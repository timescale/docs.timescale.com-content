# Continuous Aggregates
Aggregate queries which touch large swathes of time-series data can take a long
time to compute because the system needs to scan large amounts of data on every
query execution. TimescaleDB continuous aggregates automatically calculate the
results of a query in the background and materialize the results. Queries to the
continuous aggregate view are then significantly faster as they do not need to
touch the raw data in the hypertable, instead using the pre-computed aggregates
in the view.

Continuous aggregates are somewhat similar to PostgreSQL [materialized
views][postgres-materialized-views], but unlike a materialized view, continuous
aggregates do not need to be refreshed manually; the view will be refreshed
automatically in the background as new data is added, or old data is
modified. Additionally, it does not need to re-calculate all of the data on
every refresh. Only new and/or invalidated data will be calculated.  Since this
re-aggregation is automatic, it doesn’t add any maintenance burden to your
database.

Another approach would be to use triggers to update a materialized view
immediately upon writing to the database; however, this approach causes
significant write amplification, which slows inserts. We have designed
continuous aggregations to run in the background and have a minimal impact on
insertion rate by avoiding write amplification.

**How it Works:**
In general, a continuous aggregate *materialization job* takes raw data from the
original hypertable, aggregates it, and stores intermediate state in a
*materialization hypertable*. When you query the *continuous aggregate view*,
the state is finalized and returned to you as needed. We also create highly
performant triggers on the raw hypertable which determine when raw data needs to
be re-materialized due to INSERTs, UPDATEs, or DELETEs.  The re-materialization
will happen the next time the materialization job runs.

### Creating a Continuous Aggregate View [](create)
[Continuous aggregates][api-continuous-aggs] are created by setting the
`timescaledb.continuous` option in the `WITH` clause of a PostgreSQL [`CREATE
VIEW`][postgres-createview] statement.

Let's suppose we have a hypertable `device_readings` created as so:
```sql
CREATE TABLE device_readings (
      observation_time  TIMESTAMPTZ       NOT NULL,
      device_id         TEXT              NOT NULL,
      metric            DOUBLE PRECISION  NOT NULL,
      PRIMARY KEY(observation_time, device_id)
);
SELECT create_hypertable('device_readings', 'observation_time');
```

If we want to query per-device readings aggregated on an hourly basis, we might
create a continuous aggregate as so:

```sql
CREATE VIEW device_summary
WITH (timescaledb.continuous) --This flag is what makes the view continuous
AS
SELECT
  time_bucket('1 hour', observation_time) as bucket, --time_bucket is required
  device_id,
  avg(metric) as metric_avg, --We can use any parallelizable aggregate
  max(metric)-min(metric) as metric_spread --We can also use expressions on aggregates and constants
FROM
  device_readings
GROUP BY bucket, device_id; --We have to group by the bucket column, but can also add other group-by columns
```
This creates a continuous view called `device_summary` for the aggregation
query, as well as all of the infrastructure needed for materializing the data
and keeping the view up-to-date. A `time_bucket` on the time partitioning column
of the raw hypertable is required in all continuous aggregate views. The
[`time_bucket`][time-bucket] function in this case has a `bucket_width` of 1
hour. See the [`CREATE VIEW (Continuous Aggregate)`][api-continuous-aggs-create]
section of our documentation for all of the options and requirements for the
command.

In general, aggregates which can be [parallelized by PostgreSQL][postgres-parallel-agg]
are allowed in the view definition, this includes most aggregates distributed
with PostgreSQL. This means that aggregates with `ORDER BY` clauses or `DISTINCT` clauses cannot appear,
additionally we require that no `FILTER` clauses appear ([though we will allow them in future
releases](#future-work)).

---

### Using Continuous Aggregates [](using)

To select data from the continuous aggregates, simply run a `SELECT` query on
the continuous view. For instance, to return the average and spread for the
first quarter of 2018 for device `D132`, we would run:
```sql
SELECT * FROM device_summary
WHERE device_id = 'D132'
  AND bucket >= '2018-01-01' AND bucket < '2018-04-01';
```
Or we can do more complex queries on the aggregates themselves, for instance, if
we wanted to know the top 20 largest metric spreads in that quarter, we could do
something like:
```sql
SELECT * FROM device_summary
WHERE metric_spread > 1800
  AND bucket >= '2018-01-01' AND bucket < '2018-04-01'
ORDER BY bucket DESC, device_id DESC LIMIT 20;
```

**How Far Behind Will Continuous Aggregates Be?** [](how-far-behind)  
When designing continuous aggregates, we wanted to avoid write amplification as
that could drastically affect insert rate for write-heavy time-series workloads.
We also wanted to deal gracefully with out-of-order data. There are several
tunable parameters that allow us to control how quickly data is materialized
after insert and how far behind the aggregates will remain (so as not to cause
the same materialization to be modified multiple times and cause write amplification).

We usually stay at least one `bucket_width` (the first argument to the
`time_bucket` call in the view definition) behind the maximum inserted time
value. The `refresh_lag` parameter determines how much further behind the
highest inserted time value the background worker will attempt to materialize
(we will be behind by `refresh_lag` + `bucket_width`).  So in our example, if
the `refresh_lag` is 1 hour and the `bucket_width` is 1 hour, the
materialization will generally be 2 hours behind the maximum inserted value.
Tuning the `refresh_lag` parameter lower will mean that the
aggregates will follow inserts more closely, but can cause some write
amplification which may degrade insert performance. Setting `refresh_lag` to
`-<bucket_width>` will keep the continuous aggregate up-to-date.

The `refresh_interval` controls how frequently materialization jobs will be
launched. Setting a shorter interval will mean materializations happen more
"eagerly" but can consume background worker resources while it is running.

The `timescaledb.max_interval_per_job` parameter can also be useful, especially
when a continuous aggregate is created on a hypertable that already contains
data and the materialization job needs to catch up. It determines the maximum
amount of data processed in a single job. If there is still more work to do to
catch up to where we need to be based on the `refresh_lag` setting, another job
will be spawned immediately following completion. This means that the part of the
data processed by previous jobs will be available even before the
materialization is fully caught up.

>:TIP: Most times the continuous aggregate view will be updated by the background job;
  however, if you would like to run it yourself, you may use the [`REFRESH MATERIALIZED VIEW`
  command][api-refresh-continuous-aggs].

**Using `timescaledb.information` Views:**
The various options used to create the continuous aggregate view, as well as its
definition, can be found in the [`timescaledb_information.continuous_aggregates`
view][api-continuous-aggregates-info], and information about the state and progress
of the materialization background worker jobs can be found in the
[`timescaledb_information.continuous_aggregate_stats`
view][api-continuous-aggregate-stats]. These views can be quite useful for
administering continuous aggregates and tuning other options noted below.

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

A continuous aggregate may be dropped by using the `DROP VIEW` command, which
deletes the hypertable that stores the materialized data for the continuous
aggregate; it does not affect the data in the underlying hypertable from which
the continuous aggregate is derived (i.e., the raw data).  The `CASCADE`
parameter is required for this command.

```sql
DROP VIEW device_summary CASCADE;
```

>:WARNING: `CASCADE` will drop those objects that depend on the continuous
aggregate, such as views that are built on top of the continuous aggregate view.```


---


### Dropping Data with Continuous Aggregates Enabled [](dropping-data)
When dropping data in a raw hypertable using the [`drop_chunks`
function][api-drop-chunks] that has a continuous aggregate created on it, we
must specify the `cascade_to_materializations` argument to the `drop_chunks`
call. Currently, the only option for this argument is `true`, which will cause
the continuous aggregate to drop all data associated with any chunks dropped from the
raw hypertable. Further data retention options are planned for future releases
(see [future work](#future-work)).

The same argument must also be supplied to the [`add_drop_chunks_policy`
function][api-add-drop-chunks] when creating a data retention policy for a
hypertable with a continuous aggregate.  

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
  time_bucket('1 hour', observation_time ) as bucket,
  min(observation_time::timestamp) as min_time, --note the cast to localtime
  device_id,
  avg(metric) as metric_avg,
  max(metric)-min(metric) as metric_spread
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
  time_bucket('1 hour', observation_time) as bucket,
  min(observation_time AT TIME ZONE 'EST') as min_time, --note the explicit timezone
  device_id,
  avg(metric) as metric_avg,
  max(metric)-min(metric) as metric_spread
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
The first version of continuous aggregations has been released in TimescaleDB
v1.3, but we have a number of new capabilities and improvements already planned
in the next releases. Please find some of these forthcoming capabilities
described below. If you'd like to help implement them, test them, want to help
us prioritize, or have other areas you think we should work on, please get in
touch via our [Github][timescale-github] or [Slack][support-slack].


**Parallelized Materializations:**
Currently, materializations are populated by a single background worker per job.
We plan to enable multiple workers to be launched to perform a single
materialization. This can be especially helpful in the initial population of the
continuous aggregate, if it's created after the raw hypertable has a significant
amount of data.

**Fully Up-to-date Views:**
As noted [above](#how-far-behind), aggregates are intentionally a bit behind where the most recent
inserts are occurring, this reduces write amplification. However, we recognize
the need for fully up-to-date views and can accomplish this by automatically
querying the raw data and calculating the aggregates on the fly for the most
recent periods that have not yet been materialized. This union view of both the
materialization and the aggregate will then replace the normal continuous
aggregate view (though whether one selected fully up-to-date data would be
tunable at query time).

In the meantime, you can force the continuous aggregate to run whenever new data is received
by setting `refresh_lag` to `-<bucket_width>`.

**Synchronous Invalidation:**
Similarly, invalidated portions of the materialization are re-calculated the
next time the materialization is run. We plan on adding different options to
enable further tuning of the tradeoffs between write amplification, query speed,
and fully correct aggregates.

**Support Filtered Aggregates:**
Currently, aggregate clauses do not support
filter clauses in aggregates like
```sql
SELECT sum(x) FILTER (WHERE y > 3) FROM foo;
```
we plan to extend our support for aggregates like this in upcoming releases.

**Data Retention Integration:**
As noted [above](#dropping-data), currently, the only option available when
dropping chunks from a raw hypertable is to cascade the drop to the
materialialization. We plan on extending the materialization mechanism to allow
for dropping the underlying data even while keeping the aggregates for a longer
period of time at different granularities.

**Approximation Functions for Non-parallelizable Aggregates:**
Non-parallelizable aggregates such as [ordered set
aggregates][postgres-ordered-set] for calculating percentiles, medians, and the
like, as well as aggregates to compute the number of distinct items in a set, are
not supported by continuous aggregates. However, many of these types of
functions have parallelizable approximations that can provide quite accurate
approximations of the actual result and would therefore be able to integrate
seamlessly with the continuous aggregates project. We intend to implement a
number of these aggregates.  

---


[postgres-createview]: https://www.postgresql.org/docs/current/static/sql-createview.html
[postgres-parallel-agg]:https://www.postgresql.org/docs/current/parallel-plans.html#PARALLEL-AGGREGATION
[time-bucket]: /api#time_bucket
[create_hypertable]: /api#create_hypertable
[migrate-from-postgresql]: /getting-started/migrating-data
[postgres-materialized-views]: https://www.postgresql.org/docs/current/rules-materializedviews.html
[api-continuous-aggs]:/api#continuous-aggregates
[api-continuous-aggs-create]: /api#continuous_aggregate-create_view
[api-continuous-aggregates-info]: /api#timescaledb_information-continuous_aggregate
[api-continuous-aggregate-stats]: /api#timescaledb_information-continuous_aggregate_stats
[api-drop-chunks]: /api#drop_chunks
[api-add-drop-chunks]: /api#add_drop_chunks_policy
[api-set-chunk-interval]: /api#set_chunk_time_interval
[timescale-github]: https://github.com/timescale/timescaledb
[postgres-ordered-set]: https://www.postgresql.org/docs/current/functions-aggregate.html#FUNCTIONS-ORDEREDSET-TABLE
[api-refresh-continuous-aggs]: /api#continuous_aggregate-refresh_view
[support-slack]: https://slack-login.timescale.com
