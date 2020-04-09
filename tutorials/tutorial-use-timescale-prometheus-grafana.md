# Tutorial: Using TimescaleDB, Prometheus, and Grafana to Visualize Long-Term Metrics Data

This is the second part of our tutorial on how to use TimescaleDB, 
Prometheus, and Grafana to store and analyze long-term metrics data. In the 
first part, you’ll learn how to [set up TimescaleDB and Prometheus][setup-prometheus]. 
In this part, you’ll learn how to use your metrics data to answer questions 
about how your infrastructure is performing.

If you’d like to complete this tutorial without having to set up all the 
necessary infrastructure, you can [download a sample dataset][sample-database] 
containing a host of Prometheus metrics from monitoring a PostgreSQL database. 
If you choose to use this sample dataset, be sure to follow steps 1 and 2 
of the [first part of this tutorial][setup-prometheus] to set up 
Timescale with `pg_prometheus` and the postgresql adapter, which will automatically 
create the needed schema for you. Then you can load the sample data into 
the `metrics_labels` and `metrics_values` tables respectively; the filenames 
reflect which table data from that file should be inserted into. Step 4 of the 
first part of this tutorial will help you connect your TimescaleDB instance with 
Grafana, so that you can complete the steps in this part of the tutorial.

In this tutorial, you will learn how to 
[optimize TimescaleDB for Prometheus metrics](#optimize-timescale) and build 
visualizations that help you use metrics to answer common questions, such as:

- [How many active connections are there to the database?](#active-connections)
- [What is the maximum and average percent of memory usage?](#memory-usage)
- [When is the database being read most often?](#db-reads)
- [How much disk space is being used?](#disk-space)
- [What is the cache hit rate?](#cache-hit)

### Optimizing TimescaleDB for Prometheus metrics [](optimize-timescale)

There are several ways to optimize your TimescaleDB to maximize storage, query 
time, and overall cost efficiency:

- Use compression to save storage space
- Apply a data retention policy and decide how much metrics data to keep
- Use continuous aggregations to reduce the frequency of queries that tax the database

#### Compression

One challenge with storing long-term metrics is that you can quickly run out of 
space. Even the most compact commercial cloud infrastructure deployments can generate 
gigabytes of data every day. [TimescaleDB compression][compression] can save upwards 
of 80% of space for most people. For this tutorial, we were able to save 70% of space 
using compression. Compression allows you to keep raw prometheus metrics around for 
longer, using less disk space.

Using compression is easy. First, decide on an interval after which you’d like data 
to be compressed (e.g., after 6 hours), then add an automated compression policy on the 
`metrics_values` hypertable, since that's the table that will grow as more samples 
are collected. To do so, run the following command in `psql`:

```sql
--- Add compression policy on metrics_values -- compress old data after every 6 hours
ALTER TABLE metrics_values SET (
 timescaledb.compress,
 timescaledb.compress_segmentby = 'labels_id'
);

SELECT add_compress_chunks_policy('metrics_values', INTERVAL '6 hours');
```

You can change the interval from `6 hours`, to `1 day` or `2 days` and so on, depending 
on your requirements and resource constraints.

To see if chunks are being compressed, run the command below in `psql`:

```sql
SELECT uncompressed_total_bytes, compressed_total_bytes 
FROM timescaledb_information.compressed_hypertable_stats;
```

Your output should look like this:

```bash
uncompressed_total_bytes  | compressed_total_bytes 
--------------------------+------------------------
 5054 MB                  | 17 MB
(1 row)
```

#### Data retention policies

You can use [data retention][data-retention] to determine how long you want to store 
long-term metrics. For example, “long-term data storage” may be mandated by a law 
governing your type of business, or you may want to retain an arbitrary amount of data 
you believe is relevant. 

Data retention policies are powerful because they allow you to keep __downsampled metrics__, 
where you can keep aggregate rollups of your data for long term analysis, but discard 
underlying data that compose those aggregates to save on storage space.

For example, if you’re generating a large amount of metrics data daily, you might 
want to only keep raw data around for a certain period of time, say 15 days or 30 
days, and then keep rollups of that data around indefinitely. Here’s how you 
can enable that, using the scenario of keeping data around for 2 days:

```sql
--Adding a data retention policy to drop chunks that only consist of data older than 2 days old
-- available on Timescale Cloud and in Timescale Community v 1.7+
SELECT add_drop_chunks_policy('metrics_values', INTERVAL '2 days', cascade_to_materializations=>FALSE);
```

To check if the policy was created successfully and for information about the policy, run:

```sql
SELECT * FROM timescaledb_information.drop_chunks_policies;
```

#### Continuous aggregations

We use continuous aggregation in this tutorial in order to compute common aggregated 
queries in the background so that you can save processing time at the moment you 
need the information.

To use continuous aggregates with a data retention policy, your aggregate intervals 
can be less than or equal to your data retention policy interval. That is to say, if 
your data retention policy interval is DRI and your aggregate intervals are AI, then 
AI < = DRI.

To create a continuous aggregate for five minute (`5m`) rollups of the maximum, 
average and minimum of metrics, where the underlying data will be dropped according 
to the data retention policy we set up above:

```sql
-- 5 minute rollups of metrics
-- refresh interval same as time bucket interval
CREATE VIEW metrics_5mins
WITH (timescaledb.continuous,
   timescaledb.ignore_invalidation_older_than='2d',
   timescaledb.refresh_lag = '-30m',
   timescaledb.refresh_interval = '5m')
AS
   SELECT time_bucket('5 minutes', time) as bucket,
       labels_id,
       avg(value) as avg,
       max(value) as max,
       min(value) as min
       FROM
           metrics_values
       GROUP BY bucket, labels_id;
```

In the `WITH` statement, we specify that:

- The aggregate will ignore trying to find underlying data older than 2 days, 
since that data will be dropped according to our automated retention policy, 
set up in the Data retention policies section above
- The aggregate will be up to date with the most recent data available every time 
it refreshes. We can also configure it to be slightly behind live data to make it less 
computationally intensive, by setting `timescaledb.refresh_lag` to a positive 
value like `10m` or `1d` depending on our requirements.
- The aggregate data refreshes every 5 minutes, since that’s the time  
interval specified in our `time_bucket` statement.

To check for the successful creation of aggregates, as well as for information about 
them, run:

```sql
SELECT view_name, refresh_lag, refresh_interval, max_interval_per_job, materialization_hypertable
FROM timescaledb_information.continuous_aggregates
```

To create an hourly rollup of your metrics, you’d run:

```sql
--1 hour agg
CREATE VIEW metrics_hourly
WITH (timescaledb.continuous,
   timescaledb.ignore_invalidation_older_than='2d',
   timescaledb.refresh_lag = '-30m',
   timescaledb.refresh_interval = '1h')
AS
   SELECT time_bucket('1 hour', time) as bucket,
       labels_id,
       avg(value) as avg,
       max(value) as max,
       min(value) as min
       FROM
           metrics_values
       GROUP BY bucket, labels_id;
```

Notice how the refresh interval changes according to the aggregate interval set 
in the `time_bucket` part of the statement.

With these optimizations, we’re ready to dive in and start using our 
data to answer common questions.

### How many connections are there to the database? [](active-connections)

Prometheus metrics are stored in the `metrics_values` table, while the labels for 
metrics are stored in the `metrics_labels` table. If you match the `id` from the 
`metrics_labels` table with all values corresponding to that `label_id` in the 
`metrics_values` table, you will be able to see all values for that particular metric.

After consulting the [PostgreSQL documentation][postgres-docs], we know we are 
interested in the `postgresql_pg_stat_activity_conn_count` label. First, let’s 
identify which `id` corresponds to the metrics we are interested in by running 
this query:

```sql
SELECT * 
FROM metrics_labels
WHERE metric_name LIKE 'postgresql_pg_stat_activity_conn_count';
```

The result will look like this:

```bash
id   |              metric_name               |      labels                                                                                                                                                      
-----+----------------------------------------+------------------
 296 | postgresql_pg_stat_activity_conn_count | { labels here }
 297 | postgresql_pg_stat_activity_conn_count | { labels here }
```

Our Prometheus data comes from two different databases, a default database and a 
test database. We can see that the `id` for our desired metric is `296` (corresponding 
to our default database) and `297` (corresponding to our test database). Therefore, 
we can now obtain all the values for the metric by running the following two SQL 
queries (one for each database):

```sql
SELECT
  time,
  avg(value) AS "defaultdb connections"
FROM metrics_values
WHERE
  labels_id = 296
GROUP BY 1
ORDER BY 1;

SELECT
  time,
  avg(value) AS "defaultdb connections"
FROM metrics_values
WHERE
  labels_id = 297
GROUP BY 1
ORDER BY 1;
```

Our result for the first of the above queries should look something like this:

```bash
           time            | defaultdb connections 
----------------------------+-----------------------
 2020-03-16 04:11:27.936+00 |                     2
 2020-03-16 04:11:37.937+00 |                     2
 2020-03-16 04:11:47.937+00 |                     2
```

Depending on your installation of Prometheus, the `metric_labels` table may vary. 
Therefore, it’s probably better not to hardcode the `label_id` into your SQL query 
and instead `JOIN` queries on the two tables, like this:

```sql
SELECT
  time,
  avg(value) AS "defaultdb connections"
FROM metrics_values
JOIN metrics_labels ON metrics_values.labels_id = metrics_labels.id
WHERE
  metrics_labels.metric_name LIKE 'postgresql_pg_stat_activity_conn_count'
GROUP BY 1
ORDER BY 1;
```

We can visualize this query in Grafana using a Graph visualization by selecting 
the ‘Edit SQL’ button in the query builder and entering the following query, which 
looks similar to the raw SQL query from earlier but is altered to support Grafana:

```sql
SELECT
  $__timeGroupAlias("time", 1m),
  avg(value) AS "defaultdb connections"
FROM metrics_values
JOIN metrics_labels ON metrics_values.labels_id = metrics_labels.id
WHERE
  $__timeFilter("time") AND
  metrics_labels.metric_name LIKE 'postgresql_pg_stat_activity_conn_count'
GROUP BY 1
ORDER BY 1;
```

The result of your query should look like this:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/screenshots-for-prometheus-tutorial/grafana_query_1_screenshot.png" alt="Visualizing PostgreSQL connections in Grafana"/>

### What is the maximum and average percent of memory usage? [](memory-usage)

Knowing the maximum and average memory usage of your infrastructure gives 
you an idea of when you are about to require an upgrade to your service plan 
or instance size.

The problem with obtaining this information is that running this query over _all_ 
of your data several times a day can take a long time. TimescaleDB includes a 
feature called [continuous aggregation][continuous-aggregates] that solves this. 
A continuous aggregation recomputes a query automatically at user-specified time intervals 
and stores the results in a table. Thus, instead of everyone running an aggregation query 
each time, the database can run a common aggregation periodically in the background, and 
users can query the results of the aggregation. Continuous aggregates generally improve database 
performance and query speed for common calculations.

In our case, we want to maintain a continuous aggregate for the average, maximum, and 
minimum memory usage of our PostgreSQL database. Let’s first create a continuous aggregate, 
then use it in a query to visualize data in Grafana.

#### Create a continuous aggregate

Let’s set up a continuous aggregate called `metrics_10mins` to bucket our memory usage 
stats for ten minute blocks. We will enter this command on the `psql` command line 
for our database:

```sql
CREATE VIEW metrics_10mins
WITH (timescaledb.continuous,
   timescaledb.ignore_invalidation_older_than='2d',
   timescaledb.refresh_lag = '-30m',
   timescaledb.refresh_interval = '10m')
AS
   SELECT time_bucket('10 minutes', time) as bucket,
       labels_id,
       avg(value) as avg,
       max(value) as max,
       min(value) as min
       FROM
           metrics_values
       GROUP BY bucket, labels_id;
```

In this aggregate, we’re choosing ten minute `time_bucket` intervals, and computing 
the average, maximum, and minimum memory usage for each of those bucket intervals. 

#### Use the continuous aggregate in a Grafana query

In Grafana, we’ll create another Graph visualization, click ‘Edit SQL’, and enter 
the following query:

```sql
SELECT
  bucket AS "time",
  avg, max
FROM metrics_10mins
WHERE
  $__timeFilter(bucket) AND labels_id = 179
ORDER BY 1;
```

The result of your query should look like this:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/screenshots-for-prometheus-tutorial/grafana_query_2_screenshot.png" alt="Visualizing PostgreSQL connections in Grafana"/>

### When is the database being read most often? [](db-reads)

So far, we’ve built queries to understand the memory usage patterns of our 
PostgreSQL database. We also want to understand how the database itself is 
queried by others. In effect, we want to know what are the max, min and average 
number of blocks read from my database in 5 minute intervals?

Once again, we will build a continuous aggregate for 5 minute intervals to 
obtain the information we’re interested in:

```sql
CREATE VIEW metrics_5mins
WITH (timescaledb.continuous,
    timescaledb.ignore_invalidation_older_than='2d',
    timescaledb.refresh_lag = '-30m',
    timescaledb.refresh_interval = '5m')
AS
    SELECT time_bucket('5 minutes', time) as bucket,
        labels_id,
        avg(value) as avg,
        max(value) as max,
        min(value) as min
        FROM
            metrics_values
        GROUP BY bucket, labels_id;
```

And now we can use that continuous aggregate in Grafana. Once again, create a Graph 
visualization, select ‘Edit SQL’, and enter the following query:

```sql
SELECT
  bucket AS "time",
  metrics_labels.labels->'datname' AS metric,
  min, avg, max
FROM metrics_5mins
JOIN metrics_labels ON metrics_5mins.labels_id = metrics_labels.id
WHERE
  $__timeFilter(bucket) AND metrics_labels.metric_name LIKE 'postgresql_pg_stat_database_blks_read'
GROUP BY 1,2,3,4,5
ORDER BY 1;
```

The result of your query should look like this:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/screenshots-for-prometheus-tutorial/grafana_query_3_screenshot.png" alt="Visualizing PostgreSQL connections in Grafana"/>

### How much disk space is being used? [](disk-space)

Knowing how much disk space is being used for a given time period can be
helpful in troubleshooting a host of errors with your application. We can
get the current percentage of disk space being used by querying the value of
the `disk_used_percent` metric, which corresponds to a `labels_id` of 57.

Our Grafana query will look like this:

```sql
SELECT
  $__timeGroupAlias("time", 1m),
  avg(value) AS "% disk used"
FROM metrics_values
WHERE
  $__timeFilter("time") AND
  labels_id = 57
GROUP BY 1
ORDER BY 1
```

We can visualize this in Grafana by first adding a new panel. Choose the
`Gauge` visualization. Click `Edit SQL` in the query editor and paste
the query above. Make sure your data source is selected properly.

Now, go to the Visualization tab to configure your gauge's visual
properties. It's helpful to play around with the options a little bit.
In order to obtain the result below, you'll want to do the following:

- In the 'Display' section, select 'Last (not null)' in the 'Calc' field
- Turn on both 'Labels' and 'Markers'
- In the 'Field' section, provide a title, set your 'Unit' to be 'percent (0-100)'.
- In the 'Threshold' section, set the red field to 90, add a yellow field and set it to 75, and set the green field to 0.

Your resulting gauge should look like this:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/screenshots-for-prometheus-tutorial/grafana_query_4_screenshot.png" alt="Visualizing disk space usage using a Gauge in Grafana"/>

### What is the cache-hit rate? [](cache-hit)

A cache hit rate measures the effectiveness of the caching system and is 
influenced by factors such as the cache policy, the number of cacheable 
objects, the size of the cache memory, and the expiry time of the object. A higher 
cache hit rate is a good indicator of lower latency and better resource utilization. 

In order to compute the cache hit rate for our instance, we will apply the following formula:

```bash
sum(heap_blks_hit) / ( sum(heap_blks_hit) + sum(heap_blks_read) )
```

The `heap_blks_hit` value has a `labels_id` of 313, while the `heap_blks_read`
value has a `labels_id` of 315. This leads to the following Grafana query, using
an `INNER JOIN` to combine metric values from the same table:

```sql
SELECT m_313.time, SUM(m_313.value)/(SUM(m_313.value) + SUM(m_315.value)) as cache_hit_rate
FROM metrics_values m_313 
INNER JOIN metrics_values m_315 ON m_313.time = m_315.time
WHERE  m_313.labels_id = 313 AND m_315.labels_id = 315
GROUP BY m_313.time
ORDER BY m_313.time;
```

In Grafana, this looks like this:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/screenshots-for-prometheus-tutorial/grafana_query_5_screenshot.png" alt="Visualizing PostgreSQL cache hit rate in Grafana"/>

### Summary

TimescaleDB, Grafana, and Prometheus together represent a modern open-source 
analytics stack. In minutes, you can be up and running and ready to analyze 
your metrics data to identify potential efficiencies and solve problems. 

Looking for what to do next? You can kick start your use of Grafana and 
Timescale to analyze Prometheus metrics by using our 
[sample Grafana dashboard files][sample-dashboards] as a starting point.


[get-prometheus]: https://prometheus.io
[get-grafana]: http://grafana.org
[sample-database]: https://s3.amazonaws.com/docs.iobeam.com/examples/prometheus-grafana/prom_data_csvs.zip
[timescale-cloud]: https://www.timescale.com/products
[timescale-cloud-install]: /getting-started/exploring-cloud
[timescale-cloud-prometheus-endpoint]: /tutorials/tutorial-setting-up-timescale-cloud-endpoint-for-prometheus
[timescaledb-install]: /getting-started/installation
[grafana-cloud]: https://grafana.com/get
[grafana-tutorial]: /tutorials/tutorial-grafana
[grafana-security-docs]: https://grafana.com/docs/grafana/latest/installation/configuration/#security
[grafana-stack-overflow]: https://stackoverflow.com/questions/54039604/what-is-the-default-username-and-password-for-grafana-login-page
[hello-timescale]: /tutorials/tutorial-hello-timescale
[postgres-docs]: https://www.postgresql.org/docs/
[continuous-aggregates]: /tutorials/continuous-aggs-tutorial
[compression]: /using-timescaledb/compression
[data-retention]: /using-timescaledb/data-retention
[setup-prometheus]: /tutorials/tutorial-setup-timescale-prometheus
[use-timescale-prometheus-grafana]: /tutorials/tutorial-use-timescale-prometheus-grafana
[aws-signup]: https://aws.amazon.com
[ssl-setup-instructions]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AccessingInstancesLinux.html
[ssl-setup-key-instructions]: https://stackoverflow.com/questions/9270734/ssh-permissions-are-too-open-error
[pg-prometheus-extension]: https://github.com/timescale/pg_prometheus
[timescale-remote-storage-adapter]: https://github.com/timescale/prometheus-postgresql-adapter
[docker-ubuntu]: https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-18-04
[filezilla]: https://www.filezilla.org
[stack-overflow-filezilla]: https://stackoverflow.com/questions/16744863/connect-to-amazon-ec2-file-directory-using-filezilla-and-sftp
[prometheus-exporters]: https://prometheus.io/docs/instrumenting/exporters/
[prometheus-node-exporters]: https://github.com/prometheus/node_exporter
[sample-dashboards]: https://github.com/timescale/examples/tree/master/prometheus-grafana
