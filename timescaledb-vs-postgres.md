# Why Use TimescaleDB over Relational DBs?

TimescaleDB offers three key benefits over vanilla PostgreSQL or other
traditional RDBMSs for storing time-series data: much higher data
ingest rates, equivalent to (much) superior query performance, and
extended time-oriented features.

And because TimescaleDB still allows you to use the full range of
PostgreSQL features and tools &mdash; e.g., JOINs with relational tables,
geospatial queries via PostGIS, `pg_dump` and `pg_restore`, any
connector that speaks PostgreSQL &mdash; there is little reason **not** to
use TimescaleDB for storing time-series data within a PostgreSQL
database.

## Much Higher Ingest Rates

TimescaleDB achieves a much higher and more stable ingest rate than
PostgreSQL for time-series data.  As described in our [architectural discussion][],
Postgres' performance begins to significantly suffer as soon as indexed tables
can no longer fit in memory.

In particular, whenever a new row is inserted, the database needs to
update the indexes (e.g., B-trees) for each of the table's indexed
columns, which will involve swapping one or more pages in from disk.
Throwing more memory at the problem only delays the inevitable, and
your throughput in the 10K-100K+ rows per second can crash to
hundreds of rows per second once your time-series table is in the tens
of millions of rows.

TimescaleDB solves this through its heavy (and adaptive) utilization of
time-space partitioning, even when running *on a single machine*.  So
all writes to recent time intervals are only to tables that remain in
memory, and updating any secondary indexes is also fast as a result.

In short, TimescaleDBs sees throughput more than 15x that of
PostgreSQL for moderately-sized tables:

<img width="100%" src="//assets.timescale.com/benchmarks/timescale-vs-postgres-insert.jpg"></img>

We have observed similarly high, consistent throughput &mdash; 100K-200K
rows per second, or 1M-2M metrics per second &mdash; in TimescaleDB
databases **over 10+ billion rows**, even when deployed with a single disk.

## Superior or Similar Query Performance

On single disk machines, at least, many simple queries that just
perform indexed lookups or table scans are similarly performant
between PostgreSQL and TimescaleDB.

For example, the following query on an &sim;80M row table with indexed
time, hostname, and cpu usage information, will take less than 1ms for
each database:

```sql
SELECT date_trunc('hour', time) AS hour,
    MAX(user_usage) AS user_usage FROM cpu
  WHERE hostname = 'host_1234'
    AND time >= '2017-01-01' AND time < '2017-01-02'
  GROUP BY hour ORDER BY hour
```

Similar queries which involve a basic scan over an index are also equivalently performant:

```sql
SELECT * FROM cpu
  WHERE usage_user > 90.0
    AND time >= '2017-01-01' AND time < '2017-01-02'
```

In contrast, other queries that can reason specifically about time ordering can
be _much_ more performant in TimescaleDB.

TimescaleDB uses a time-based "merge append" optimization to
minimize the number of groups which much be processed to execute the
following (given its knowledge that time is already ordered).  For a
test &sim;80M row table, this results in query latency that is **22x** lower
than PostgreSQL (12ms vs. 2.5s).

```sql
SELECT date_trunc('minute', time) AS minute,
    MAX(usage_user) FROM cpu
  WHERE time < '2017-01-01'
  GROUP BY minute ORDER BY minute
  LIMIT 5
```

We will be publishing more complete benchmarking comparisons between
PostgreSQL and TimescaleDB soon, as well as the software to replicate
our benchmarks.

The high-level result that most stands out in our query benchmarking is that
for **every query** that we have tried, TimescaleDB achieves
either **similar or superior performance** to vanilla Postgres.


## Extended Time-oriented Features

TimescaleDB also includes a number of time-oriented features that
aren't found in traditional relational databases.  These include
special query optimizations (like the merge append above) that provide
some of the huge performance improvements for time-oriented queries.

It also includes *new* types of queries, including some of the
following:

- **Time bucketing**: A more powerful version of the standard `date_trunc` function,
    allowing for arbitrary time intervals and
    flexible groupings instead of just second, minute, hour, etc.

- **Last / first**: These optimized aggregation functions allow you
    to get the value of one column as ordered by another.  For
    example, `last(temperature, time)` will return the latest
    temperature value based on time within a group (e.g., an hour).

For more information about TimescaleDB's current (and growing) list of
time features, please [see our API](/api/api-timescaledb#time_bucket).

**Next:** How does TimescaleDB compare to NoSQL time-series DBs? [TimescaleDB vs. NoSQL](/introduction/timescaledb-vs-nosql)

[architectural discussion]: /introduction/architecture#benefits-chunking
