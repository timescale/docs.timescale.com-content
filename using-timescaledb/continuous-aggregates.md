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

### An introductory example [](quick-start)

As a quick introductory example, let's create a hypertable
`conditions` containing temperature data for devices and a continuous
aggregate to compute the daily average, minimum, and maximum
temperature. Start off by creating the hypertable and populate it with
some random data:

```sql
CREATE TABLE conditions (
      time TIMESTAMPTZ NOT NULL,
      device INTEGER NOT NULL,
      temperature FLOAT NOT NULL,
      PRIMARY KEY(time, device)
);
SELECT * FROM create_hypertable('conditions', 'time', 'device', 3);

INSERT INTO conditions
SELECT time, (random()*30)::int, random()*80 - 40
FROM generate_series(TIMESTAMP '2020-01-01 00:00:00',
     		     TIMESTAMP '2020-06-01 00:00:00',
		     INTERVAL '10 min') AS time;
```

You can then create a continuous aggregate view to compute the daily
average, minimum, and maximum temperature:

```sql
CREATE MATERIALIZED VIEW conditions_summary_hourly
WITH (timescaledb.continuous) AS
SELECT device,
       time_bucket(INTERVAL '1 hour', time) AS bucket,
       AVG(temperature),
       MAX(temperature),
       MIN(temperature)
FROM conditions
GROUP BY device, bucket;
```

Lastly, you should add a policy to ensure that the continuous
aggregate is refreshed on a regular basis.

```sql
SELECT add_continuous_aggregate_policy('conditions_summary_hourly',
	start_offset => INTERVAL '1 month',
	end_offset => INTERVAL '1 h',
	schedule_interval => INTERVAL '5 min');
```

In this case, the continuous aggregate will be refreshed every hour
and refresh the last month's data.

You can now run a normal `SELECT` on the continuous aggregate and it
will give you the aggregated data, for example, to select the daily
averages for device 1 during the first three months:

```sql
SELECT bucket, avg
  FROM conditions_summary_hourly
 WHERE device = 1 AND bucket BETWEEN '2020-01-01' AND '2020-03-31'
ORDER BY bucket;
```

### A detailed look at continuous aggregate views [](detailed-look)

As shown above, creating a refreshing [continuous
aggregate][api-continuous-aggs] is a two-step process. First, one
needs to create a continuous aggregate view of the data using [`CREATE
MATERIALIZED VIEW`][postgres-createview] with the
`timescaledb.continuous` option. Second, a continuous aggregate
policy needs to be created to keep it refreshed.

You can create several continuous aggregates for the same
hypertable. For example, we could create another continuous aggregate
view that summarizes the hourly data.

```sql
CREATE MATERIALIZED VIEW conditions_summary_daily
WITH (timescaledb.continuous) AS
SELECT device,
       time_bucket(INTERVAL '1 day', time) AS bucket,
       AVG(temperature),
       MAX(temperature),
       MIN(temperature)
FROM conditions
GROUP BY device, bucket;

-- Create the policy
SELECT add_continuous_aggregate_policy('conditions_summary_daily',
	start_offset => INTERVAL '1 month',
	end_offset => INTERVAL '1 day',
	schedule_interval => INTERVAL '1 hour');
```

A `time_bucket` on the time partitioning column of the hypertable is
required in all continuous aggregate views. If you do not provide one,
you will get an error.

When the view is created, it will (by default) be populated with data
so that it contains the aggregates computed across the entire
`conditions` hypertable.

It might, however, not always be desirable to populate the continuous
aggregate. If the amount of data in `conditions` is large and new data
is continuously being added, it is usually more meaningful to control
the order in which the data is refreshed or combine manual refresh
with a policy. For example, it might be more interesting to see the
recent data but historical data can be deferred to later. In those
cases, the `WITH NO DATA` option can be used to avoid aggregating the
data during creation.

You could then add a policy to control the refresh of the recent data,
and also run manual refreshes using
[`refresh_continuous_aggregate`][refresh_continuous_aggregate] to
refresh the historical data in a controlled manner. For example, to
refresh one month of data you could write:

```sql
CALL refresh_continuous_aggregate('conditions_summary_hourly', '2020-05-01', '2020-06-01');
```

Unlike a regular materialized view, the refresh will only recompute
the data within the window that has changed in the underlying
hypertable since the last refresh. Therefore, if only a few buckets
need updating, then the refresh is quick.

Note that the end range is exclusive and aligned to the buckets of the
continuous aggregate, so this will refresh only the buckets that are
fully in the date range `['2020-05-01', '2020-06-01')`, that is, up to
but not including `2020-06-01`. While it is possible to use `NULL` to
indicate an open-ended range, we do not in general recommend using
it. For more information, see the [Advanced Usage](#advanced-usage)
section below.

However, note that this might materialize a lot of data, can affect
other policies such as the data retention, and affects write
amplification, so it should only be used rarely.

Continuous aggregates are supported for most aggregates that can be
[parallelized by PostgreSQL][postgres-parallel-agg], which includes
the normal aggregation functions like `SUM` and `AVG`. However,
aggregates using `ORDER BY` and `DISTINCT` cannot be used with
continuous aggregates since they are not possible to parallelize by
PostgreSQL. In addition, TimescaleDB continuous aggregates does not
currently support the `FILTER` clause (not to be confused with
`WHERE`) even though it is possible to parallelize but we might add
support for this in a future version.

#### Automatic refresh with a continuous aggregate policy

You can refresh the continuous aggregate view manually as mentioned
above, but you can also automate the refresh by adding a continuous
aggregate policies to automatically refresh data.

There are a few situations that you might want to automate:

- You want the continuous aggregate and the hypertable to be in sync,
  even when data is removed from the hypertable.
- You want to aggregate data from the hypertable into the continuous
  aggregate but want to keep the aggregated data in the continuous
  aggregate when removing data from the hypertable.

These cases can be automatied using a *continuous aggregate policy*,
which are added using the function
[`add_continuous_aggregate_policy`][add-continuous-aggregate-policy].

This function takes takes three arguments:

- The parameter `start_interval` indicate the start of the refresh
  window relative to the current time when the policy executes.
- The parameter `end_interval` indicate the end of the refresh window
  relative to the current time when the policy executes.
- The parameter `schedule_interval` indicate the refresh interval in
  wall-clock time.

Similar to the `refresh_continuous_aggregate` function, providing
`NULL` to `start_interval` or `end_interval` makes the range
open-ended and will extend to the beginning or end of time,
respectively.

For example, to create a policy for `conditions_summary_hourly` that
keeps the continuous aggregate up to date with the underlying
hypertable `conditions` and run every hour, you would write:

```sql
SELECT add_continuous_aggregate_policy('conditions_summary_hourly',
	start_interval => NULL,
	end_interval => INTERVAL '1 h',
	schedule_interval => INTERVAL '1 h');
```

This will ensure that all data in the continuous aggregate is up to
date with the hypertable except the last hour and also ensure that we
do not try to refresh the last bucket of the continuous
aggregate. Since we give an open-ended `start_interval`, any data that
is removed from `conditions` (for example, by using `DELETE` or
[`drop_chunks`][api-drop-chunks]) will also be removed from
`conditions_summary_hourly`. In effect, the continuous aggregate will
always reflect the data in the underlying hypertable.

If you instead want to keep the continuous aggregate up to date for
say only the last 30 days.  the continuous aggregate even if it is
removed from the underlying hypertable, you can set a range for the
`start_interval`. For example, if you have a [data retention
policy][sec-data-retention] that removed data older than one month,
you can set `start_interval` to one month (or less) and thereby not
refresh data older than one month, which includes data that is
removed.

```sql
SELECT add_continuous_aggregate_policy('conditions_summary_hourly',
	start_interval => INTERVAL '1 month',
	end_interval => INTERVAL '1 h',
	schedule_interval => INTERVAL '1 h');
```

>:WARNING: It is important to consider data retention policies when
>setting up continuous aggregate policies. If the continuous aggregate
>policy window covers data that is removed by the data retention
>policy, the aggregates for those buckets will be refreshed and
>consequently the data will be removed. For example, if you have a
>data retention policy that will remove all data older than 2 weeks,
>the continuous aggregate policy above will only have data for the
>last two weeks. A more reasonable data retention policy for this case
>would then be to remove data that is older than 1 month.
>
>You can read more about data retention with continuous aggregates in
>the [*Data retention*][sec-data-retention] section.

Time-series data is typically ordered, so it is usually the last
bucket that gets most of the updates. Recomputing the last bucket when
new data arrives negates many of the benefits of using continuous
aggregation. Older buckets rarely get updated and are usually
aggregated only once.

As a result, it is recommended to configure continuous aggregate
policies with a positive `end_interval`, that is, the materialization
will lag behind the most recent time by this amount. A recommended
value is at least one time bucket.

A continuous aggregate may be dropped by using the `DROP MATERIALIZED
VIEW` command. It does not affect the data in the hypertable from
which the continuous aggregate is derived (`conditions` in the example
above).

```sql
DROP MATERIALIZED VIEW conditions_summary_hourly;
```

---

### Using Continuous Aggregates [](using)

To query data from a continuous aggregate, use a `SELECT` query on
the continuous aggregate view. For instance, you can get the average,
minimum, and maximum for the first quarter of 2020 for device 5:

```sql
SELECT * FROM conditions_summary_hourly
WHERE device = 5
  AND bucket >= '2020-01-01' AND bucket < '2020-04-01';
```

Or we can do more complex queries on the aggregates themselves, for instance, if
we wanted to know the top 20 largest metric spreads in that quarter, we could do
something like:
```sql
SELECT * FROM conditions_summary_hourly
WHERE max - min > 1800
  AND bucket >= '2020-01-01' AND bucket < '2020-04-01'
ORDER BY bucket DESC, device_id DESC LIMIT 20;
```

---

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
it really fast to get aggregate answers by pre-computing these values (such as
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

Real-time aggregates are now the default behavior for any continuous
aggregates. To revert to the previous behavior, in which the query
touches materialized data only and doesn't combine with the latest raw
data, add the parameter `timescaledb.materialized_only=true` when
creating the continuous aggregate view.

You can also use this in conjunction with the [`ALTER MATERIALIZED
VIEW`][api-alter-cagg] to turn this feature on or off at any time.

>:TIP: To upgrade continuous aggregates that were created in a version
earlier than TimescaleDB 1.7 to use real-time aggregates, alter the
view to set `timescaledb.materialized_only=false`.  All subsequent
queries to the view will immediately use the real-time aggregate
feature.

---

### Advanced Topics [](advanced-usage)

#### Refreshing continuous aggregates [](refresh-cagg)

When using `refresh_continuous_aggregate` it is possible to use `NULL`
to indicate an open-ended range either for the start of the window or
the end of the window. For example, to refresh the complete range of a
continuous aggregate, write:

```sql
CALL refresh_continuous_aggregate('conditions_summary_hourly, NULL, NULL);
```

We do not recommend doing so for tables that see continuous ingest of
new data since that would trigger a refresh of buckets that are not
yet filled completely.

However, note that this might materialize a lot of data, can affect
other policies such as the data retention, and affects write
amplification, so it should only be used rarely.

>:TIP: You should avoid refreshing time intervals that still see a lot
>of writes, which is usually the last bucket of the continuous
>aggregate. These intervals are still changing and will not produce
>accurate aggregate anyway and refreshing unnecessarily will increase
>the write amplification, which will slow down the ingest rate of the
>hypertable. If you want to ensure that you read the latest bucket, you
>should instead rely on [real-time aggregates][real-time-aggregates].

The `schedule_interval` option to `add_continuous_aggregate_policy`
controls how frequently materialization jobs will be launched. Setting
a shorter interval will mean materializations happen more frequently
but each job consumes background worker resources while it is running.

#### Disabling real-time aggregates

When querying the continuous aggregate view (for example,
`conditions_summary_hourly`) by default you will get a complete view of
the data including both the partially aggregated data and newer,
unaggregated data in the hypertable (for example, `conditions`),
based on the [real-time aggregate capability](#real-time-aggregate).

If you, however, want to just get partially aggregated data and not
include recent data that has yet to be materialized, you can set the
option `timescaledb.materialized_only` to `true` using [`ALTER
MATERIALIZED VIEW`][api-alter-cagg]:

```sql
ALTER MATERIALIZED VIEW conditions_summary_hourly SET (
    timescaledb.materialized_only = true
);
```

**Using `timescaledb.information` Views:**
The various options used to create the continuous aggregate view, as well as its
definition, can be found in the
[`timescaledb_information.continuous_aggregates` view][api-continuous-aggregates-info],
and information about the state and progress of the materialization background worker jobs can be found in the
[`timescaledb_information.continuous_aggregate_stats` view][api-continuous-aggregate-stats].
These views can be quite useful for administering continuous aggregates and
tuning other options noted below.

### Dropping Data with Continuous Aggregates Enabled [](dropping-data)
Note that if any still-refreshing (more recent than `start_offset`) part of the
continuous aggregate is dropped via a [retention policy][api-add-retention] or
direct [`drop_chunks`][api-drop-chunks] call, the aggregate will be updated to
reflect the loss of data. For this reason, if it is desired to retain the continuous
aggregate after dropping the underlying data, the `start_offset` of the aggregate
policy must be set to a smaller interval than the `drop_after` parameter of a
hypertable's retention policy. Similiarly, when calling `drop_chunks`, extra
care should also be taken to ensure that any such chunks are not within the
refresh window of a continuous aggregate that still needs the data.  More detail
and examples of this can be seen in the the [data retention documentation][retention-aggregate].

This is also a consideration when manually refreshing a continuous aggregate.
Calling `refresh_continuous_aggregate` on a region containing dropped chunks will
recalculate the aggregate without the dropped data. This can lead to undesirable
results, such as replacing previous aggregate data with NULL values, given that the
raw data has subsequently been dropped.

#### Continuous Aggregates using Integer-Based Time [](create-integer)

Usually, continuous aggregates are defined on a
[date/time-type](https://www.postgresql.org/docs/current/datatype-datetime.html)
column, but it is also possible to create your own custom scheme for
handling aggregation for tables that are using an integer time
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
CREATE MATERIALIZED VIEW devices_summary
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

**Creating Indexes on the Materialization Hypertable:** By default,
the database will automatically create composite indexes on each
column specified in the `GROUP BY` combined with the `time_bucket`
column (i.e., in our example, because the continuous aggregate view
is defined as `GROUP BY device, bucket`, we would automatically
create a composite index on `{device, bucket}`.  If we had additionally
grouped by additional columns (e.g., `GROUP BY device, foo, bar, bucket`),
we would create additional indexes as well (`{foo, bucket}` and
`{bar, bucket}`). Setting `timescaledb.create_group_indexes` to `false` when
creating the view will prevent this.  If we want to create additional
indexes or drop some of the default ones, we can do so by creating or
dropping the appropriate indexes on the materialization hypertable
directly.

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

**Dealing with Timezones:**
Functions that depend on a local timezone setting inside a continuous aggregate
are not supported. We cannot cast to a local time because the timezone setting
will change from user to user. So attempting to create a continuous aggregate
like:
```sql
CREATE MATERIALIZED VIEW device_summary
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
CREATE MATERIALIZED VIEW device_summary
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
[api-alter-cagg]: /api#continuous_aggregate-alter_view
[api-continuous-aggregates-info]: /api#timescaledb_information-continuous_aggregate
[api-continuous-aggregate-stats]: /api#timescaledb_information-continuous_aggregate_stats
[api-drop-chunks]: /api#drop_chunks
[api-set-chunk-interval]: /api#set_chunk_time_interval
[api-set-integer-now-func]: /api#set_integer_now_func
[api-add-retention]: /api#add_retention_policy
[timescale-github]: https://github.com/timescale/timescaledb
[support-slack]: https://slack-login.timescale.com
[postgres-ordered-set]: https://www.postgresql.org/docs/current/functions-aggregate.html#FUNCTIONS-ORDEREDSET-TABLE
[clock_timestamp]: http://www.postgresql.org/docs/12/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT
[add-continuous-aggregate-policy]: /api#add_continuous_aggregate_policy
[refresh_continuous_aggregate]: /api#refresh_continuous_aggregate
[retention-aggregate]: /using-timescaledb/data-retention#retention-with-aggregates
