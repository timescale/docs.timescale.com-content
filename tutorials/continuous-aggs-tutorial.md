
# Tutorial: Continuous Aggregates

One kind of query that occurs frequently when performing data analysis is
aggregating data into summaries.

For instance if we want to find out the average of a column for each day in the
dataset stored in a hypertable, we would run

``` sql
SELECT time_bucket('1 day', time_dimension_column_name) bucket,
  avg(column_name), stddev(column_name)
FROM hypertable
GROUP BY bucket;
```

However, performing this query as written requires scanning all the data within
the hypertable, which can be inefficient if this query is called frequently. A
**continuous aggregate** recomputes the query automatically at user-specified
time intervals and materializes the results into a table. When the user
queries the continuous aggregate, the system reads and processes the much smaller materialized
table. This speeds up the query significantly. This is particularly useful when
recomputing aggregates frequently for large data sets.

We will explore this feature using the data set from the [Hello Timescale Tutorial][hello_timescale]

### Pre-requisites

To complete this tutorial, you will need a cursory knowledge of the Structured Query 
Language (SQL). The tutorial will walk you through each SQL command, but it will be 
helpful if you've seen SQL before.

To start, [install TimescaleDB][install-timescale]. Once your installation is complete, 
we can proceed to ingesting or creating sample data and finishing the tutorial.

### 1. Download and Load Data

Let's start by downloading the data.

This dataset contains two files:
1. `nyc_data_contagg.sql` - A SQL file that will set up the necessary tables
for the continuous aggregates tutorial.
1. `nyc_data_rides.csv` - A CSV file with the ride data.

First, create a database, e.g., `nyc_data` with the extension:

```sql
CREATE DATABASE nyc_data;
\c nyc_data
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
```

Next, download the file from the below link:

[:DOWNLOAD_LINK: `nyc_data.tar.gz`][nyc_data]

Then, follow these steps:

```
# (1) unzip the archive
tar -xvzf nyc_data.tar.gz

# (2) import the table schemas
psql -U postgres -d nyc_data -h localhost <  nyc_data_contagg.sql

# (3) import data
psql -U postgres -d nyc_data -h localhost -c "\COPY rides FROM nyc_data_rides.csv CSV"
```

The data is now ready for you to use.

```
# To access your database
psql -U postgres -h localhost -d nyc_data
```

### 2. Create a continuous aggregate query
Let us assume we use the following query frequently to calculate hourly ride statistics.

```sql
SELECT vendor_id, time_bucket('1h', pickup_datetime) as day,
     count(*) total_rides,
     avg(fare_amount) avg_fare,
     max(trip_distance) as max_trip_distance,
     min(trip_distance) as min_trip_distance
FROM rides
GROUP BY vendor_id, time_bucket('1h', pickup_datetime);
```
Every time the query is run, the database recomputes the results for the query by
scanning the entire table. With continuous aggregates, we have a way of
telling TimescaleDB to cache the results and update them when the underlying
data in the *rides* table is modified. 

Under the covers, TimescaleDB creates a **materialization table** where the result 
of this query is saved. The materialization table is updated at a **schedule interval** 
which is specified with the continuous aggregate policy. For example, if we
specify a schedule interval of 30 minutes, the continuous aggregate 
checks every 30 minutes for changes (inserts/updates/deletes) that were 
made to the *rides* table, recomputes the aggregates for the modified rows 
and updates the values in the materialization table.

We use the `CREATE MATERIALIZED VIEW` statement and specify `timescaledb.continuous` in the
`WITH` clause to create a continuous aggregate query. Then we use the  
`add_continuous_aggregation_policy()` function to specify that we want to update the
continuous aggregate view every 30 minutes.

>:TIP:If you have a lot of historical data to aggregate into the view, consider using
> the `WITH NO DATA` option as outlined in the [alternative approach](#with-no-data).

```sql
CREATE MATERIALIZED VIEW cagg_rides_view WITH
  (timescaledb.continuous)
AS
SELECT vendor_id, time_bucket('1h', pickup_datetime) as day,
  count(*) total_rides,
  avg(fare_amount) avg_fare,
  max(trip_distance) as max_trip_distance,
  min(trip_distance) as min_trip_distance
FROM rides
GROUP BY vendor_id, time_bucket('1h', pickup_datetime);

SELECT add_continuous_aggregate_policy('cagg_rides_view', 
  start_offset => INTERVAL '1 week',
  end_offset   => INTERVAL '1 hour',
  schedule_interval => INTERVAL '30 minutes');
```
Note that a continuous aggregate query requires a group by clause with a
`time_bucket` expression and the `time_bucket` expression uses the time dimension
column of the *rides* hypertable.

```sql
\d cagg_rides_view
                          View "public.cagg_rides_view"
      Column       |            Type             | Collation | Nullable | Default
-------------------+-----------------------------+-----------+----------+---------
 vendor_id         | text                        |           |          |
 day               | timestamp without time zone |           |          |
 total_rides       | bigint                      |           |          |
 avg_fare          | numeric                     |           |          |
 max_trip_distance | numeric                     |           |          |
 min_trip_distance | numeric                     |           |          |
```

We can view the metadata for the continuous aggregate by selecting information 
from the **timescaledb_information.continuous_aggregates** view joined to the
**timescaledb_information.jobs** view.

``` sql
SELECT view_name, schedule_interval, 
  config ->> 'start_offset' as start_offset,
  config ->> 'end_offset' as end_offset,
  date_trunc('second',next_start::timestamp) as next_start,
  materialization_hypertable_name
FROM timescaledb_information.continuous_aggregates ca
  INNER JOIN timescaledb_information.jobs j 
    ON ca.materialization_hypertable_name = j.hypertable_name
  WHERE view_name = 'cagg_rides_view';

-[ RECORD 1 ]-------------------+---------------------------
view_name                       | cagg_rides_view
schedule_interval               | 00:30:00
start_offset                    | 7 days
end_offset                      | 01:00:00
next_start                      | 2020-10-29 15:59:51
materialization_hypertable_name | _materialized_hypertable_9
```

As you can see from the result, the `schedule_interval` is set to 30 minutes. The
computed aggregates are saved in the materialization table, 
`_timescaledb_internal._materialized_hypertable_9`.

What are `start_offset` and `end_offset`? These intervals determine the window
of time TimescaleDB will look at when refreshing the data in the continuous aggregate.
`start_offset` determines the oldest timestamp in the hypertable that TimescaleDB 
will look for changes to data in the underlying hypertable, while `end_offset` is the 
most recent timestamp interval that will be considered.

>:TIP:Comparing to TimescaleDB 1.x, `start_offset` is related to
> `ignore_invalidation_older_than` and `end_offset` is similar to `refresh_lag`,
> although the semantics of these new parameters are much simpler to understand.

For example, if we expect frequent updates to the *rides*  table for the current hour, we do not
want to materialize the aggregates for that range. We would set the `end_offset = INTERVAL '1h'` 
to indicate that. (If you don't specify an `end_offset`, the default value is twice the
bucket_width used by the `time_bucket` expression.) 

So given the continuous aggregate policy that we created above, the continuous aggregate will get
refreshed every 30 minutes (`schedule_interval`) but will update the continuous aggregates only 
for the data that satisfies the condition:

```sql
time_bucket('1h', pickup_datetime) > max(pickup_time) - INTERVAL '7 days' 
  AND time_bucket('1h', pickup_datetime) < max(pickup_time) - '1h'
``` 

### 3. Queries using continuous aggregates
We can use the continuous aggregate just like any other `VIEW` in a `SELECT` query.

``` sql
SELECT vendor_id, day, total_rides FROM cagg_rides_view WHERE total_rides > 15000;
 vendor_id |         day         | total_rides
-----------+---------------------+-------------
 2         | 2016-01-01 01:00:00 |       15407
(1 row)
```

### 4. Statistics for continuous aggregates

We can view information about the jobs that update the continuous aggregate
using the **timescaledb_information.job_stats** view.

``` sql
SELECT * FROM timescaledb_information.job_stats js 
WHERE job_id = (
  SELECT job_id FROM timescaledb_information.jobs j 
    INNER JOIN timescaledb_information.continuous_aggregates ca 
    ON j.hypertable_name = ca.materialization_hypertable_name 
  WHERE ca.view_name = 'cagg_rides_view'
);

-[ RECORD 1 ]----------+------------------------------
hypertable_schema      | _timescaledb_internal
hypertable_name        | _materialized_hypertable_9
job_id                 | 1006
last_run_started_at    | 2020-10-29 15:59:51.814305+00
last_successful_finish | 2020-10-29 15:59:51.823749+00
last_run_status        | Success
job_status             | Scheduled
last_run_duration      | 00:00:00.009444
next_start             | 2020-10-29 16:29:51.823749+00
total_runs             | 2
total_successes        | 2
total_failures         | 0


---- fetch max pickup_datetime for comparison with completed_threshold ----
SELECT max(pickup_datetime) FROM rides;
-[ RECORD 1 ]------------
max | 2016-01-31 23:59:59

```

The column `job_id` gives the id of the background worker that updates the continuous
aggregate. `next_start` says when the next scheduled update will occur. 
`last_sucessful_finish` and `last_run_duration` allow you to see when the
scheduled aggregate finished and how long it took to run.

### 5. Update the Continuous Aggregate schedule
Altering the schedule or parameters of a continuous aggregate policy is accomplished by
first removing the existing policy and then creating a new updated policy with the
desired settings.

To modify the policy that currently exists on the `cagg_rides_view` so that the `start_offset`
is now equal to `1 month`, you would:

``` sql
SELECT remove_continuous_aggregate_policy('cagg_rides_view');

SELECT add_continuous_aggregate_policy('cagg_rides_view', 
  start_offset => interval '1 month',
  end_offset   => INTERVAL '1 hour',
  schedule_interval => INTERVAL '30 minutes');

SELECT view_name, schedule_interval, 
  config ->> 'start_offset' as start_offset,
  config ->> 'end_offset' as end_offset,
  date_trunc('second',next_start::timestamp) as next_start,
  materialization_hypertable_name
FROM timescaledb_information.continuous_aggregates ca
  INNER JOIN timescaledb_information.jobs j 
    ON ca.materialization_hypertable_name = j.hypertable_name
  WHERE view_name = 'cagg_rides_view';

-[ RECORD 1 ]-------------------+---------------------------
view_name                       | cagg_rides_view
schedule_interval               | 00:30:00
start_offset                    | 1 mon
end_offset                      | 01:00:00
next_start                      | 2020-10-29 15:59:51
materialization_hypertable_name | _materialized_hypertable_9
```

Notice that the `start_offset` is not set to `1 mon`.

## Using `WITH NO DATA` when creating a Continuous Aggregate [](with-no-data)

If you have a lot of historical data, we suggest creating the continuous aggregate
using the `WITH NO DATA` parameter for the `CREATE MATERIALIZED VIEW` command. Doing 
so will allow the continuous aggregate to be created instantly (you won't have to wait 
for the data to be aggregated on creation!). Data will then begin to populate as the 
continuous aggregate policy begins to run.

**However**, only data newer than `start_offset` would begin to populate the continuous
aggregate. If you have historical data that is older than the `start_offset` INTERVAL, 
you need to manually refresh history up to the current `start_offset` to allow
real-time queries to run efficiently.

Using the example in **Step 2** above, if we had years worth of data, a better approach 
to creating the continuous aggregate is shown in the SQL below which includes `WITH NO DATA`
and specifically refreshes the history separate from the continuous aggregate refresh policy:

```sql
CREATE MATERIALIZED VIEW cagg_rides_view WITH
  (timescaledb.continuous)
AS
SELECT vendor_id, time_bucket('1h', pickup_datetime) as day,
  count(*) total_rides,
  avg(fare_amount) avg_fare,
  max(trip_distance) as max_trip_distance,
  min(trip_distance) as min_trip_distance
FROM rides
GROUP BY vendor_id, time_bucket('1h', pickup_datetime)
WITH NO DATA;

SELECT add_continuous_aggregate_policy('cagg_rides_view', 
  start_offset => INTERVAL '1 week',
  end_offset   => INTERVAL '1 hour',
  schedule_interval => INTERVAL '30 minutes');

CALL refresh_continuous_aggregate('cagg_rides_view', NULL, localtimestamp - INTERVAL '1 week');
```


You will find more details about the Continuous Aggregate API in the [documentation][cagg_api].

[hello_timescale]: /tutorials/tutorial-hello-timescale
[nyc_data]: https://timescaledata.blob.core.windows.net/datasets/nyc_data.tar.gz
[tsdb_doc]: https://docs.timescale.com/v2.0/api#continuous-aggregates
[install-timescale]: /getting-started/installation
