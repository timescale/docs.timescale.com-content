
# Tutorial: Continuous Aggregates

One kind of query that occurs frequently when performing data analysis is
aggregating data into summaries.

For instance if we want to find out the average of a column for each day in the
dataset stored in a hypertable, we would run

``` sql
SELECT time_bucket('1 day', time_dimension_column_name) bucket, avg(column_name), stddev(column_name)
FROM hypertable
GROUP BY bucket;
```

However, performing this query as written requires scanning all the data within
the table, which can be inefficient if this query is called frequently. A
continuous aggregate view recomputes the query automatically at user specified
time intervals and materializes the results into a table. When the user
queries the view, the system reads and processes the much smaller materialized
table. This speeds up the query significantly. This is particularly useful when
recomputing aggregates frequently for large data sets.

We will explore this feature using the data set from the [Hello NYC Tutorial][hello_nyc]

Prerequisites:
TimescaleDB installed (version 1.3 or greater)

### 1. Download and Load Data

Let's start by downloading the data.

This dataset contains two files:
1. `contagg_nyc_data.sql` - A SQL file that will set up the necessary tables
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
psql -U postgres -d nyc_data -h localhost <  contagg_nyc_data.sql

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
Everytime the query is run, the database recomputes the results for the query by
scanning the entire table. With continuous aggregate queries, we have a way of
telling TimescaleDB to cache the results and update them when the underlying
data in the *rides* table is modified. Under the covers, TimescaleDB creates
a **materialization table** where the result of this query is saved. The
materialization table is updated at a **refresh interval** which is specified
 when the continuous aggregate query is created. For example, if we
specify a refresh interval of 10 minutes, the continuous aggregate query
 checks the changes (inserts/updates/deletes) that were made to the *rides*
table, recomputes the aggregates for the modified rows and updates the
values in the materialization table.


We use the `CREATE VIEW` statement and specify `timescaledb.continuous` in the
`WITH` clause to create a continuous aggregate query. We use
`timescaledb.refresh_interval` parameter to specify that we want to update the
continuous aggregate query every 30 minutes.

```sql
CREATE VIEW cagg_rides_view WITH
(timescaledb.continuous, timescaledb.refresh_interval = ’30m’)
AS
SELECT vendor_id, time_bucket('1h', pickup_datetime) as day,
     count(*) total_rides,
     avg(fare_amount) avg_fare,
     max(trip_distance) as max_trip_distance,
     min(trip_distance) as min_trip_distance
FROM rides
GROUP BY vendor_id, time_bucket('1h', pickup_datetime);
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

We can view the metadata for the continuous aggregate in the
**timescaledb_information.continuous_aggregates** view.

``` sql
SELECT view_name, refresh_lag, refresh_interval, max_interval_per_job, materialization_hypertable
FROM timescaledb_information.continuous_aggregates;
-[ RECORD 1 ]--------------+-------------------------------------------------
view_name                  | cagg_rides_view
refresh_lag                | 02:00:00
refresh_interval           | 00:30:00
max_interval_per_job       | 20:00:00
materialization_hypertable | _timescaledb_internal._materialized_hypertable_2
```
The `refresh_interval` is set to 30 minutes. The computed aggregates are saved
in the materialization table, `_timescaledb_internal._materialized_hypertable_2`.

What are `refresh_lag` and `max_interval_per_job`? We use the
`timescaledb.refresh_lag` parameter to indicate by how much does the continuous
 aggregate query lag behind the data in the *rides* table. For example, if we
expect frequent updates to the *rides*  table for the current hour, we do not
want to precompute the aggregates for that range. We would set the
`refresh_lag = ‘1h'` to indicate that. (The default value is twice the
bucket_width used by the `time_bucket` expression. This is the 2 hours shown for
`refresh_lag` in the view output above). So the continuous aggregate will get
refreshed every 30 minutes (`refresh_interval`) but will update the continuous
aggregates only for the data that satisfies the condition:
`time_bucket(‘1h’, pickup_datetime) <   max(pickup_time) - ‘1h’ `(if the
`refresh_lag` is set to 1 hour)

To keep the continuous aggregate up-to-date,
you can set `timescaledb.refresh_lag` to a negative value. This will allow the continuous aggregate
to update when new data comes in. However, do note that this comes with performance implications,
since the aggregate query will be run more often. 

The `timescaledb.max_interval_per_job` parameter is used when we want to limit
the amount of data processed by an update of the continuous aggregate and use
smaller or bigger batch sizes (the batching is done automatically by TimescaleDB).
`timescaledb.max_interval_per_job` specifies the batch size.

`refresh_lag` and `max_interval_per_job` are additional parameters that can be
specified while creating or altering a continuous aggregate. Refer to the
documentation for the syntax.

### 3. Queries using continuous aggregates
We can use the continuous aggregate, just like any other view, in a `SELECT` query.

``` sql
SELECT vendor_id, day, total_rides FROM cagg_rides_view WHERE total_rides > 15000;
 vendor_id |         day         | total_rides
-----------+---------------------+-------------
 2         | 2016-01-01 01:00:00 |       15407
(1 row)
```

### 4. Statistics for continuous aggregates

We can view information about the jobs that updated the continuous aggregates
using the **timescaledb_information.continuous_aggregate_stats** view.

``` sql
SELECT * FROM timescaledb_information.continuous_aggregate_stats;
-[ RECORD 1 ]----------+------------------------------
view_name              | cagg_rides_view
completed_threshold    | 2016-01-31 22:00:00
invalidation_threshold | 2016-01-31 22:00:00
job_id                 | 1000
last_run_started_at    | 2019-04-25 10:48:08.15141-04
last_run_status        | Success
job_status             | scheduled
last_run_duration      | 00:00:00.042841
next_scheduled_run     | 2019-04-25 11:18:08.194251-04
total_runs             | 1
total_successes        | 1
total_failures         | 0
total_crashes          | 0


---- fetch max pickup_datetime for comparison with completed_threshold ----
SELECT max(pickup_datetime) FROM rides;
-[ RECORD 1 ]------------
max | 2016-01-31 23:59:59

```

The column `job_id` gives the id of the background worker that updates the continuous
aggregate query. `next_scheduled_run` says when the next scheduled update
will occur.  The `completed_threshold` shows that rows with
`pickup_time` value < '2016-01-31 22:00:00' (from the *rides* table) were used
to update the continuous aggregate. Since the `refresh_lag` is set to 2 hours,
the completed threshold is 2 hours behind the maximum pickup_time in the  
*rides* table.  After a job completes, the `invalidation_threshold` and
`completed_threshold` will be the same. These values differ when a background
job is running.


### 5. Alter and Refresh of continuous aggregates
The parameters passed in the `WITH` clause can be modified using `ALTER VIEW`.  
We can modify the `refresh_lag` to 1 hour using `ALTER VIEW`.

``` sql
ALTER VIEW cagg_rides_view SET (timescaledb.refresh_lag='1h');
ALTER VIEW

 SELECT view_name, refresh_lag, refresh_interval, max_interval_per_job, materialization_hypertable
FROM timescaledb_information.continuous_aggregates;
-[ RECORD 1 ]--------------+-------------------------------------------------
view_name                  | cagg_rides_view
refresh_lag                | 01:00:00
refresh_interval           | 00:30:00
max_interval_per_job       | 20:00:00
materialization_hypertable | _timescaledb_internal._materialized_hypertable_2
```

We can also manually update the continuous aggregate query by using the
`REFRESH` command.

``` sql
REFRESH MATERIALIZED VIEW cagg_rides_view;
```

You will find more details about the API in the [documentation][tsdb_doc].

[hello_nyc]: /tutorials/tutorial-hello-nyc
[nyc_data]: https://timescaledata.blob.core.windows.net/datasets/nyc_data.tar.gz
[tsdb_doc]: https://docs.timescale.com/api
