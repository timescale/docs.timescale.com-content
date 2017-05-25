# Tutorial: Hello NYC

Prerequisites: [Installed TimescaleDB](installation)

By now you should already have installed TimescaleDB, and have experienced
creating hypertables, as well as inserting and querying data (i.e., it's
just SQL).

But a database is only as interesting as the insights it allows you to
derive from your data.

For this tutorial, we've put together a sample data set from real-life
New York City taxicab data ([courtesy of the NYC Taxi and Limousine
Commission][NYCTLC]).

*(Note: For simplicity we'll assume that TimescaleDB is installed on a
PostgreSQL server at `localhost` on the default port, and that a user `postgres`
exists with full superuser access. If your setup is different, please modify the
examples accordingly.)*

### 1. Download and load data

Let's start by downloading the dataset. In the interest of (downloading) time
and space (on your machine), we'll only grab data for the month of January 2016.

This dataset contains two files:
1. `nyc_data.sql` - A SQL file that will set up the necessary tables
1. `nyc_data_rides.csv` - A CSV file with the ride data

First, create a database, e.g., `nyc_data` with the extension:

```sql
CREATE DATABASE nyc_data;
\c nyc_data
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
SELECT setup_timescaledb();
```

Now, download the file [`nyc_data.tar.gz`][nyc_data].

Then, follow these steps:

```bash
# (1) unzip the archive
tar -xvzf nyc_data.tar.gz

# (2) import the table schemas
psql -U postgres -d nyc_data -h localhost < nyc_data.sql

# (3) import data
psql -U postgres -d nyc_data -h localhost -c "\COPY rides FROM nyc_data_rides.csv CSV"
```

The data is now ready for you to use.

```bash
# To access your database
psql -U postgres -h localhost -d nyc_data
```

### 2. Run some queries

```sql
-- See how much data we have
SELECT COUNT(*) FROM rides;

count
----------
10906858
(1 row)
```

```sql
-- Look at the data by day
SELECT DATE_TRUNC('day', pickup_datetime) as day, COUNT(*)
FROM rides
GROUP BY day ORDER BY day;

        day         | count
--------------------+--------
2016-01-01 00:00:00 | 345037
2016-01-02 00:00:00 | 312831
2016-01-03 00:00:00 | 302878
2016-01-04 00:00:00 | 316171
2016-01-05 00:00:00 | 343251
2016-01-06 00:00:00 | 348516
2016-01-07 00:00:00 | 364894
2016-01-08 00:00:00 | 392070
2016-01-09 00:00:00 | 405825
2016-01-10 00:00:00 | 351788
2016-01-11 00:00:00 | 342651
2016-01-12 00:00:00 | 367390
2016-01-13 00:00:00 | 395090
2016-01-14 00:00:00 | 396473
2016-01-15 00:00:00 | 401289
2016-01-16 00:00:00 | 411899
2016-01-17 00:00:00 | 379156
2016-01-18 00:00:00 | 341481
2016-01-19 00:00:00 | 385187
2016-01-20 00:00:00 | 382105
2016-01-21 00:00:00 | 399654
2016-01-22 00:00:00 | 420162
2016-01-23 00:00:00 |  78133
2016-01-24 00:00:00 | 159766
2016-01-25 00:00:00 | 282087
2016-01-26 00:00:00 | 327655
2016-01-27 00:00:00 | 359180
2016-01-28 00:00:00 | 383326
2016-01-29 00:00:00 | 414039
2016-01-30 00:00:00 | 435369
2016-01-31 00:00:00 | 361505
(31 rows)
```

### 3. Run some fancier queries

Let's see what else is going on in the dataset.

```sql
-- Analyze rides by rate type
SELECT rate_code, COUNT(vendor_id) as num_trips
FROM rides
GROUP BY rate_code order by rate_code;

rate_code | num_trips
----------+-----------
        1 |  10626315
        2 |    225019
        3 |     16822
        4 |      4696
        5 |     33688
        6 |       102
       99 |       216
(7 rows)
```

Unfortunately `rate_code` doesn't really tell us what these groups
represent, and it doesn't look like there is any other info on
rates in the `rides` table.

But it turns out that there is a separate `rates` table, and
fortunately for us, TimescaleDB supports JOINs between tables:

*(In other words: with TimescaleDB you won't need to denormalize
your data.)*

```sql
-- Join rides with rates to get more information on rate_code
SELECT rates.description, COUNT(vendor_id) as num_trips
FROM rides JOIN rates on rides.rate_code = rates.rate_code
GROUP BY rates.description order by rates.description;

     description      | num_trips
----------------------+-----------
JFK                   |    225019
Nassau or Westchester |      4696
Newark                |     16822
group ride            |       102
negotiated fare       |     33688
standard rate         |  10626315
(6 rows)
```

Now we have something that is human readable. In particular, two of
these rate types
correspond to local airports (JFK, Newark). Let's take a closer look
those two:

```sql
-- Detailed comparison between JFK, Newark airports
SELECT rates.description, COUNT(vendor_id) as num_trips,
  AVG(dropoff_datetime - pickup_datetime) as avg_trip_duration,
  AVG(total_amount) as avg_total, AVG(tip_amount) as avg_tip,
  MIN(trip_distance) as min_distance, AVG(trip_distance) as avg_distance,
  MAX(trip_distance) as max_distance, AVG(passenger_count) as avg_passengers
FROM rides JOIN rates on rides.rate_code = rates.rate_code
WHERE rates.description in ('JFK', 'Newark')
GROUP BY rates.description order by rates.description;

description | num_trips | avg_trip_duration |      avg_total      |      avg_tip       | min_distance |    avg_distance     | max_distance |   avg_passengers   
------------+-----------+-------------------+---------------------+--------------------+--------------+---------------------+--------------+--------------------
JFK         |    225019 | 00:45:46.822517   | 64.3278115181384683 | 7.3334228220728027 |         0.00 | 17.2602816651038357 |       221.00 | 1.7333869584346211
Newark      |     16822 | 00:35:16.157472   | 86.4633688027582927 | 9.5461657353465700 |         0.00 | 16.2706122934252764 |       177.23 | 1.7435501129473309
(2 rows)
```

Now this is interesting:
- JFK is over 10x more popular than Newark
(assuming both airports have a similar number of flights per day)
- JFK is about 25% cheaper (most likely because of NJ tunnel and highway tolls)
- Newark trips however are 22% (10 min) shorter
- Each airport is about 17 miles on average from the trip origination point
- Each have on average ~1.74 passengers/trip,
indicating some homogeneity between the two rate types

Here's an interesting lesson:

If you need to book a flight out of NYC, think you will be in a rush,
and don't mind paying a little extra
(e.g., if you are splitting the fare), then you may want to consider
flying out of Newark over JFK.

### 4. What's happening behind the scenes

What's nice about TimescaleDB is that it lets you run these types of queries
on large datasets without having to worry about partitioning / chunking, etc.

When you write data to the database, it gets automatically partitioned across
space and time. Then, when you query your data, the database lets you
run those queries against a *hypertable*: the abstraction of a single continuous
table across all space and time intervals.

In TimescaleDB, hypertables can live alongside normal PostgreSQL tables.

In our example above, `rides` is a hypertable, while `rates` is a normal
PostgreSQL table.

Let's peek behind the curtain at our last query
using the native PostgreSQL `EXPLAIN` command,
and see TimescaleDB at work:

```sql
EXPLAIN SELECT rates.description, COUNT(vendor_id) as num_trips,
  AVG(dropoff_datetime - pickup_datetime) as avg_trip_duration,
  AVG(total_amount) as avg_total, AVG(tip_amount) as avg_tip,
  MIN(trip_distance) as min_distance, AVG(trip_distance) as avg_distance,
  MAX(trip_distance) as max_distance, AVG(passenger_count) as avg_passengers
FROM rides JOIN rates on rides.rate_code = rates.rate_code
WHERE rates.description in ('JFK', 'Newark')
GROUP BY rates.description order by rates.description;

QUERY PLAN
-------------------------------------------------------------------------------------------------------
Sort  (cost=397779.22..397779.26 rows=13 width=248)
Sort Key: rates.description
->  HashAggregate  (cost=397778.69..397778.98 rows=13 width=248)
Group Key: rates.description
->  Hash Join  (cost=26.04..380054.91 rows=708951 width=71)
Hash Cond: (_hyper_1_0_replica.rate_code = rates.rate_code)
->  Append  (cost=0.00..332038.35 rows=10906938 width=43)
->  Seq Scan on _hyper_1_0_replica  (cost=0.00..0.00 rows=1 width=180)
->  Seq Scan on _hyper_1_1_0_partition  (cost=0.00..0.00 rows=1 width=180)
->  Seq Scan on _hyper_1_2_0_partition  (cost=0.00..0.00 rows=1 width=180)
->  Seq Scan on _hyper_1_1_0_1_data  (cost=0.00..140858.35 rows=4638335 width=43)
->  Seq Scan on _hyper_1_1_0_2_data  (cost=0.00..13154.56 rows=432956 width=43)
->  Seq Scan on _hyper_1_2_0_3_data  (cost=0.00..162961.55 rows=5342055 width=43)
->  Seq Scan on _hyper_1_2_0_4_data  (cost=0.00..15063.89 rows=493589 width=44)
->  Hash  (cost=25.88..25.88 rows=13 width=36)
->  Seq Scan on rates  (cost=0.00..25.88 rows=13 width=36)
Filter: (description = ANY ('{JFK,Newark}'::text[]))
(17 rows)
```

This shows that the hypertable `rides` is split across two partitions
(`_hyper_1_1_0_partition` and `_hyper_1_2_0_partition`), each of which has
two chunks, resulting in four chunks total (`_hyper_1_1_0_1_data`,
`_hyper_1_1_0_2_data`, `_hyper_1_2_0_3_data`, `_hyper_1_2_0_4_data`).

We can even query one of these chunks directly, accessing them via the
private schema `_timescaledb_internal._hyper_1_2_0_3_data`:

```sql
SELECT COUNT(*) FROM _timescaledb_internal._hyper_1_2_0_3_data;

count
---------
5341840
(1 row)
```

Feel free to play some more with the internal TimescaleDB tables. One of the
advantages of TimescaleDB is that it is fully transparent: you can always peek
behind the curtain and see all of its guts.

(To see all internal schemas, use command `\dn`.)

```sql
\dn
         List of schemas
         Name          |  Owner
-----------------------+----------
 _timescaledb_cache    | postgres
 _timescaledb_catalog  | postgres
 _timescaledb_data_api | postgres
 _timescaledb_internal | postgres
 _timescaledb_meta     | postgres
 _timescaledb_meta_api | postgres
 public                | postgres
(7 rows)
```

### 5. Next steps

Up for learning more? Here are a few suggestions:

- [Try Other Sample Datasets](/tutorials/other-sample-datasets)
- [Migrate your own Data](/getting-started/setup)
- [Read the Technical Paper](http://www.timescaledb.com/papers/timescaledb.pdf)

[NYCTLC]: http://www.nyc.gov/html/tlc/html/about/trip_record_data.shtml
[nyc_data]: https://timescaledata.blob.core.windows.net/datasets/nyc_data.tar.gz
