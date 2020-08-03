# Continuous Aggregates

Aggregate queries which touch large swathes of time-series data can
take a long time to compute because the system needs to scan large
amounts of data on every query execution. TimescaleDB continuous
aggregates automatically calculate the results of a query in the
background and materialize the results. Queries to the continuous
aggregate view are then significantly faster as they touch less raw
data in the hypertable and instead mostly use the pre-computed
aggregates to build the view.

Continuous aggregates are somewhat similar to PostgreSQL [materialized
views][postgres-materialized-views], but unlike a materialized view,
continuous aggregates do not need to be refreshed manually; the view
will be refreshed automatically in the background as new data is
added, or old data is modified. Additionally, it does not need to
re-calculate all of the data on every refresh. Only new and/or
invalidated data will be calculated.  Since this re-aggregation is
automatic, it doesn’t add any maintenance burden to your database.

**How it Works:** A *materialization background job* regularly takes
raw data from the hypertable and computes a partial aggregate that it
stores (materializes) in the continuous aggregate.
So whenever new data is inserted, updated, or deleted in the hypertable, the
continuous aggregate will automatically decide what data needs to be
re-materialized, and it schedules a re-materialization to happen the next time
the background job runs. This way, the materalization is kept mostly
up-to-date to the raw data (and the recency and frequency of these tasks
are fully configurable; more below).

### Real-Time Aggregates [](real-time-aggregates)

Real-time aggregates are a capability (first introduced in TimescaleDB 1.7)
whereby querying the *continuous aggregate view* will then compute
fully up-to-date aggregate results by combining the materialized
partial aggregate with recent data from the hypertable that has yet to
be materialized by the continuous aggregate. By combining raw and
materialized data in this way, one gets accurate and up-to-date
results while still enjoying the speedups of pre-computing a large
portion of the result.

As an example, continuous aggregates _without_ this real-time capability make
it really fast to get aggregate answers by precomputing these values (such as
the min/max/average value over each hour). This way, if you are collecting raw
data every second, querying hourly data over the past week means reading 24 x 7
= 168 values from the database, as opposed to processing 60 x 60 x 24 x 7 =
604,800 values at query time.

But this type of continuous aggregate does not incorporate the very
latest data, _i.e._, since the last time the asynchronous aggregation job ran
inside the database. So if you are generating hourly rollups, you might only
run this materialization job every hour.

With real-time aggregates, a single, simple query will combine your
pre-computed hourly rollups with the raw data from the last
hour, to always give you an up-to-date answer.  Now, instead of touching
604,800 rows of raw data, the query reads 167 pre-computed rows of
hourly data and 3600 rows of raw secondly data, leading to significant
performance improvements.

Real-time aggregates are now the default behavior for any continuous aggregates.
To revert to previous behavior, in which the query touches materialized data only
and doesn't combine with the latest raw data, add the following parameter when
creating the continuous aggregate view:

```
timescaledb.materialized_only=true
```

You can also use this in conjunction with the ALTER VIEW to turn this feature
on or off at any time.

>:TIP: To upgrade continuous aggregates that were created in a version earlier than
TimescaleDB 1.7 to use real-time aggregates, ALTER the view to
set `timescaledb.materialized_only=false`.  All subsequent queries
to the view will immediately use the real-time aggregate feature.

---

### Creating a Continuous Aggregate View [](create)
[Continuous aggregates][api-continuous-aggs] are created by setting the
`timescaledb.continuous` option in the `WITH` clause of a
PostgreSQL [`CREATE VIEW`][postgres-createview] statement.

Suppose we have a hypertable `conditions`:
```sql
CREATE TABLE conditions (
      time TIMESTAMPTZ NOT NULL,
      device INTEGER NOT NULL,
      temperature FLOAT NOT NULL,
      PRIMARY KEY(time, device)
);
SELECT create_hypertable('conditions', 'time');
```

You can then use [`CREATE VIEW`][api-continuous-aggs-create] to create
a continuous aggregate using the `timescaledb.continuous` view
option. This view aggregates the temperatures into hourly buckets
using the [`time_bucket`][time-bucket] function.

```sql
CREATE VIEW conditions_summary_hourly
WITH (timescaledb.continuous) AS
SELECT device,
       time_bucket(INTERVAL '1 hour', time) AS bucket,
       AVG(temperature),
       MAX(temperature),
       MIN(temperature)
FROM conditions
GROUP BY device, bucket;
```

A `time_bucket` on the time partitioning column of the hypertable is required in all continuous aggregate views. If you do
not provide one, you will get an error. The `time_bucket` function in
this case has a bucket width of 1 hour.

You can create multiple continuous aggregates on the same
hypertable. For example, you can create a continuous aggregate
`condition_summary_daily` over the data with daily buckets:

```sql
CREATE VIEW conditions_summary_daily
WITH (timescaledb.continuous) AS
SELECT device,
       time_bucket(INTERVAL '1 day', time) AS bucket,
       AVG(temperature),
       MAX(temperature),
       MIN(temperature)
FROM conditions
GROUP BY device, bucket;
```

Continuous aggregates are supported for most aggregates that can be
[parallelized by PostgreSQL][postgres-parallel-agg], which includes
the normal aggregation functions like `SUM` and `AVG`. However,
aggregates using `ORDER BY` and `DISTINCT` cannot be used with
continuous aggregates since they are not possible to parallelize by
PostgreSQL. In addition, TimescaleDB continuous aggregates does not
currently support the `FILTER` clause even though it is possible to
parallelize but we might add support for this in a future version.

---

### Using Continuous Aggregates [](using)

To select data from a continuous aggregate, use a
`SELECT` query on the continuous aggregate view. For instance, you can get the
average, minimum, and maximum for the first quarter of 2018 for device
5:

```sql
SELECT * FROM conditions_summary_daily
WHERE device = 5
  AND bucket >= '2018-01-01' AND bucket < '2018-04-01';
```

Or we can do more complex queries on the aggregates themselves, for instance, if
we wanted to know the top 20 largest metric spreads in that quarter, we could do
something like:
```sql
SELECT * FROM conditions_summary_daily
WHERE max - min > 1800
  AND bucket >= '2018-01-01' AND bucket < '2018-04-01'
ORDER BY bucket DESC, device_id DESC LIMIT 20;
```

### Advanced Usage

The `timescaledb.refresh_interval` option controls how frequently
materialization jobs will be launched. Setting a shorter interval will
mean materializations happen more frequently but each job consumes
background worker resources while it is running.

When querying the continuous aggregate view (for example,
`conditions_summary_daily`) by default you will get a complete view of
the data including both the partially aggregated data and newer,
unaggregated data in the hypertable (for example, `conditions`).

If you, however, want to just get partially aggregated data and not
include recent data that has yet to be materialized, you can set the option
`timescaledb.materialized_only` to `true` using `ALTER VIEW`:

```sql
ALTER VIEW conditions_summary_hourly SET (
    timescaledb.materialized_only = true
);
```

>:TIP: You can find the names of all the materialized hypertables by
>querying `timescaledb_information.continuous_aggregates`.
>
> ```sql
> SELECT view_name, materialization_hypertable
>     FROM timescaledb_information.continuous_aggregates;
>          view_name         |            materialization_hypertable             
> ---------------------------+---------------------------------------------------
>  conditions_summary_hourly | _timescaledb_internal._materialized_hypertable_30
>  conditions_summary_daily  | _timescaledb_internal._materialized_hypertable_31
> (2 rows)
> ```

Each continuous aggregate uses the *bucket width* of the `time_bucket`
(given by the parameter `bucket_width`) function in the view
definition to decide what to update. Time-series data is typically
ordered, so it is usually the last bucket that gets most of the
updates. Recomputing the last bucket when new data arrives negates many
of the benefits of using continuous aggregation. Older buckets rarely
get updated and are usually aggregated only once.

As a result, the materialization lags behind by one bucket and up to an additional `refresh_interval` as a
result of the job not running continuously. However, you can change
this lag to either increase it (or decrease it) by setting the value
for the `timescaledb.refresh_lag` option of the view and the
background worker will attempt to materialize everything before
`refresh_lag` + `bucket_width`.

For example, using `conditions_summary_hourly` above, the bucket width
is 1 hour, so if we set the `refresh_lag` to 1 hour, the
materialization will be 2 hours behind the current time.

```sql
ALTER VIEW conditions_summary_hourly SET (
  timescaledb.refresh_lag = '1 hour'
);
```

Lowering the `refresh_lag` parameter means that the materialization
follows the raw data more closely, but can cause write amplification
that might degrade insert performance. The `refresh_lag` can also be
set to negative values. For example, setting `refresh_lag` to
`-bucket_width` will make the continuous aggregate materialize new
data as soon as it is available.

The `refresh_lag` parameter controls the balance between the
on-the-fly aggregation and pre-computed aggregation when querying the
continuous aggregate. A lower `refresh_lag` will reduce the amount of
on-the-fly aggregation by more aggressive materialization and a higher
`refresh_lag` will increase the amount of on-the-fly aggregation by
not materializing as agressively.

>:TIP: Changing the value of `refresh_lag` is rarely necessary, particularly
given the default behavior of [real-time aggregates](#real-time-aggregates).

The `timescaledb.max_interval_per_job` determines the maximum amount
of data processed in a single job. If there is more work to do after
the job completes, another job will be spawned immediately. This means
that the part of the data processed by previous jobs will be available
even before the materialization is fully caught up.

This parameter can be useful when a continuous aggregate is created on
a hypertable that already contains data and the materialization job
needs to catch up.

The `timescaledb.ignore_invalidation_older_than` parameter controls
how modifications (inserts, updates, and deletes) will trigger update
of the continuous aggregate. If modifications are done to the
hypertable, it invalidates already computed parts of the aggregate and
the aggregate has to be updated.

By default, all modifications trigger an update of the continuous
aggregate. If the `ignore_invalidation_older_than` parameter is set to
a duration, modifications with an older time will be ignored and not
trigger an update of the continuous aggregate. As a result, refresh
jobs will complete faster since they are only dealing with new data as
part of the refresh.

A common use case is to drop the raw data from the hypertable and just
keep the downsampled data in the continuous aggregate. So, for
example, if you want to keep all downsampled data, but drop anything
from the raw tables that is older than 30 days, you set
`ignore_invalidation_older_than` to `30 days` and can then drop old
chunks from the table using `drop_chunks`:

```sql
ALTER VIEW device_readings SET (
  timescaledb.ignore_invalidation_older_than = '30 days'
);
SELECT drop_chunks(INTERVAL '30 days', 'device_readings')
```

You can read more about data retention with continuous aggregates in
the [*Data retention*][sec-data-retention] section.

**Using `timescaledb.information` Views:**
The various options used to create the continuous aggregate view, as well as its
definition, can be found in the
[`timescaledb_information.continuous_aggregates` view][api-continuous-aggregates-info],
and information about the state and progress of the materialization background worker jobs can be found in the
[`timescaledb_information.continuous_aggregate_stats` view][api-continuous-aggregate-stats].
These views can be quite useful for administering continuous aggregates and
tuning other options noted below.

---

### Altering and Dropping a Continuous Aggregate View [](alter-drop)
In addition to the options discussed earlier, there are several other options that may
be set or modified after the view has been created. These may be set by running
an `ALTER VIEW` command like so:
```sql
ALTER VIEW device_summary SET (timescaledb.refresh_interval = '10 min');
```
Which sets the interval at which the view refreshes to 10 minutes.

Other alterations to the continuous aggregate view are currently disallowed. To
alter a continuous aggregate view in other ways it must be dropped and
re-created; this can entail some time to re-calculate aggregations.

A continuous aggregate may be dropped by using the `DROP VIEW`
command, which deletes the hypertable that stores the materialized
data for the continuous aggregate; it does not affect the data in the
hypertable from which the continuous aggregate is derived (i.e., the
raw data).  The `CASCADE` parameter is required for this command.

```sql
DROP VIEW device_summary CASCADE;
```

>:WARNING: `CASCADE` will drop those objects that depend on the continuous
aggregate, such as views that are built on top of the continuous aggregate view.


---


### Dropping Data with Continuous Aggregates Enabled [](dropping-data)
When dropping data in a raw hypertable using the [`drop_chunks` function][api-drop-chunks]
that has a continuous aggregate created on it, we must specify the `cascade_to_materializations`
argument to the `drop_chunks` call. A value of `true` will cause the continuous aggregate 
to drop all data associated with any chunks dropped from the raw hypertable. A value
of `false` will retain data in the continuous aggregate while dropping only the
raw data.

>:TIP: When dropping data from the raw hypertable while retaining data
on a continuous aggregate, the `older_than` parameter to `drop_chunks`
has to be longer than the `timescaledb.ignore_invalidation_older_than`
parameter on the continuous aggregate. That is because we cannot
process invalidations on data regions where the raw data has been
dropped.


The same argument must also be supplied to the [`add_retention_policy`
function][api-add-retention] when creating a data retention policy for a
hypertable with a continuous aggregate.  

---

### Advanced Topics [](advanced-usage)

#### Continuous Aggregates using Integer-Based Time [](create-integer)

Usually, continuous aggregates are defined on a [date/time-type](https://www.postgresql.org/docs/current/datatype-datetime.html) column, but it is
also possible to create your own custom scheme for handling
aggregation for tables that are using an integer time
column. This can be useful if you have tables that use other measures
of time that can be represented as integer values, such as nanosecond
epochs, minutes since founding date, or whatever is suitable for your
application.

As an example, suppose that you have a table with CPU and disk usage
for some devices where time is measured in
[microfortnights][fff-system] (a microfortnight is a little more than
a second). Since you are using an integer-valued column as time, you
need to provide the chunk time interval when creating the
hypertable. In this case, let each chunk consist of a millifortnight
(a 1000 microfortnights, which is about 20 minutes).

```sql
CREATE TABLE devices(
  time BIGINT,        -- Time in microfortnights since epoch
  cpu_usage INTEGER,  -- Total CPU usage
  disk_usage INTEGER, -- Total disk usage
  PRIMARY KEY (time)
);

SELECT create_hypertable('devices', 'time',
                         chunk_time_interval => 1000);
```

To define a continuous aggregate on a hypertable that is using an
integer time dimension, it is necessary to have a function to get the
current time in whatever representation that you are using and set it
for the hypertable using
[`set_integer_now_func`][api-set-integer-now-func]. The function can
be defined as a normal PostgreSQL function, but needs to be
[`STABLE`][pg-func-stable], take no arguments, and return an integer
value of the same type as the time column in the table. In our case,
this should suffice:

```sql
CREATE FUNCTION current_microfortnight() RETURNS BIGINT
LANGUAGE SQL STABLE AS $$
	SELECT CAST(1209600 * EXTRACT(EPOCH FROM CURRENT_TIME) / 1000000 AS BIGINT)
$$;

SELECT set_integer_now_func('devices', 'current_microfortnight');
```

Once the replacement for current time has been set up, you can define
a continuous aggregate for the `devices` table.

```sql
CREATE VIEW devices_summary
WITH (timescaledb.continuous) AS
SELECT time_bucket('500', time) AS bucket,
       avg(cpu_usage) AS avg_cpu,
       avg(disk_usage) AS avg_disk
     FROM devices
     GROUP BY bucket;
```

You can now insert some rows to check if the aggregation works as
expected.

```sql
CREATE EXTENSION tablefunc;

INSERT INTO devices(time, cpu_usage, disk_usage)
SELECT time,
       normal_rand(1,70,10) AS cpu_usage,
	   normal_rand(1,2,1) * (row_number() over()) AS disk_usage
  FROM generate_series(1,10000) AS time;
```

>:TIP: You can use the `tablefunc` extension to generate a normal
>distribution and use the `row_number` function to turn it into a
>cumulative sequence.

You can now check that the view contains the correct data. 

```sql
postgres=# SELECT * FROM devices_summary ORDER BY bucket LIMIT 10;
 bucket |       avg_cpu       |       avg_disk
--------+---------------------+----------------------
      0 | 63.0000000000000000 |   6.0000000000000000
      5 | 69.8000000000000000 |   9.6000000000000000
     10 | 70.8000000000000000 |  24.0000000000000000
     15 | 75.8000000000000000 |  37.6000000000000000
     20 | 71.6000000000000000 |  26.8000000000000000
     25 | 67.6000000000000000 |  56.0000000000000000
     30 | 68.8000000000000000 |  90.2000000000000000
     35 | 71.6000000000000000 |  88.8000000000000000
     40 | 66.4000000000000000 |  81.2000000000000000
     45 | 68.2000000000000000 | 106.0000000000000000
(10 rows)
```

---

### Best Practices [](best-practices)

**Modifying the Materialization Hypertable:**
Advanced users may find the need to modify certain properties of the
materialization hypertable (e.g. chunk size) or to create further indexes.
To help with such, we can find the name of the materialization hypertable in the
`timescaledb_information.continuous_aggregates` view ([API Docs][api-continuous-aggregates-info]).
We can then modify the materialization hypertable as if it were a normal
hypertable. For instance, we may want to set the materialization hypertable's
`chunk_time_interval` to something other than the default; this can be
accomplished by running [`set_chunk_time_interval`][api-set-chunk-interval] on
the materialization hypertable.  

**Creating Indexes on the Materialization Hypertable:**
By default, the database will automatically create composite indexes on each
column specified in the GROUP BY combined with the time_bucket column (i.e. in
our example, we would create an index on `{device_id, bucket}` and if we had
grouped by other columns, `foo` and `bar`, we would also create indexes on
`{foo, bucket}` and `{bar, bucket}`). Setting `timescaledb.create_group_indexes`
to `false` when creating the view will prevent this.  If we want to create
additional indexes or drop some of the default ones, we can do so by creating or
dropping the appropriate indexes on the materialization hypertable directly.

**Dealing with Timezones:**
Functions that depend on a local timezone setting inside a continuous aggregate
are not supported. We cannot cast to a local time because the timezone setting
will change from user to user. So attempting to create a continuous aggregate
like:
```sql
CREATE VIEW device_summary
WITH (timescaledb.continuous)
AS
SELECT
  time_bucket('1 hour', observation_time ) AS bucket,
  min(observation_time::timestamp) AS min_time,
  device_id,
  avg(metric) AS metric_avg,
  max(metric) - min(metric) AS metric_spread
FROM
  device_readings
GROUP BY bucket, device_id;
```
will fail.

Instead, we can use explicit timezones in our view definition like:
```sql
CREATE VIEW device_summary
WITH (timescaledb.continuous)
AS
SELECT
  time_bucket('1 hour', observation_time) AS bucket,
  min(observation_time AT TIME ZONE 'EST') AS min_time,
  device_id,
  avg(metric) AS metric_avg,
  max(metric) - min(metric) AS metric_spread
FROM
  device_readings
GROUP BY bucket, device_id;
```
Or we can cast to a timestamp on the way out of the view:
```sql
SELECT min_time::timestamp FROM device_summary;
```
---

### Future Work [](future-work)
The first version of continuous aggregations was released in TimescaleDB
v1.3. Multiple continuous aggregates on a hypertable is supported
in TimescaleDB v1.4. We have a number of new capabilities and
improvements already planned for the next releases.
Please find some of these forthcoming capabilities described below.
If you'd like to help implement them, test them, want to help us prioritize,
or have other areas you think we should work on, please get in touch via our
[GitHub][timescale-github] or [Slack][support-slack].


**Parallelized Materializations:**
Currently, materializations are populated by a single background worker per job.
We plan to enable multiple workers to be launched to perform a single
materialization. This can be especially helpful in the initial population of the
continuous aggregate, if it's created after the raw hypertable has a significant
amount of data.

**Synchronous Invalidation:**
Similarly, invalidated portions of the materialization are re-calculated the
next time the materialization is run. We plan on adding different options to
enable further tuning of the trade-offs between write amplification, query speed,
and fully correct aggregates.

**Support Filtered Aggregates:**
Currently, aggregate clauses do not support
filter clauses in aggregates like
```sql
SELECT sum(x) FILTER (WHERE y > 3) FROM foo;
```
we plan to extend our support for aggregates like this in upcoming releases.

**Approximation Functions for Non-parallelizable Aggregates:**
Non-parallelizable aggregates such as [ordered set aggregates][postgres-ordered-set]
for calculating percentiles, medians, and the like, as well as aggregates to
compute the number of distinct items in a set, are not supported by continuous
aggregates. However, many of these types of functions have parallelizable approximations
that can provide quite accurate approximations of the actual result and would therefore
be able to integrate seamlessly with the continuous aggregates project. We intend to
implement a number of these aggregates.

---


[fff-system]: https://en.wikipedia.org/wiki/FFF_system
[sec-data-retention]: /using-timescaledb/data_retention#data-retention
[postgres-materialized-views]: https://www.postgresql.org/docs/current/rules-materializedviews.html
[api-continuous-aggs]:/api#continuous-aggregates
[postgres-createview]: https://www.postgresql.org/docs/current/static/sql-createview.html
[pg-func-stable]: https://www.postgresql.org/docs/current/static/sql-createfunction.html
[time-bucket]: /api#time_bucket
[api-continuous-aggs-create]: /api#continuous_aggregate-create_view
[postgres-parallel-agg]:https://www.postgresql.org/docs/current/parallel-plans.html#PARALLEL-AGGREGATION
[api-refresh-continuous-aggs]: /api#continuous_aggregate-refresh_view
[api-continuous-aggregates-info]: /api#timescaledb_information-continuous_aggregate
[api-continuous-aggregate-stats]: /api#timescaledb_information-continuous_aggregate_stats
[api-drop-chunks]: /api#drop_chunks
[api-set-chunk-interval]: /api#set_chunk_time_interval
[api-set-integer-now-func]: /api#set_integer_now_func
[api-add-retention]: /api#add_retention_policy
[timescale-github]: https://github.com/timescale/timescaledb
[support-slack]: https://slack-login.timescale.com
[postgres-ordered-set]: https://www.postgresql.org/docs/current/functions-aggregate.html#FUNCTIONS-ORDEREDSET-TABLE
