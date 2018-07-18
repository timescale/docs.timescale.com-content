# Tutorial: Hello NYC

Prerequisites: [Installed TimescaleDB][install]

By now you should already have: installed TimescaleDB, experienced
creating hypertables, and tried inserting and querying data (i.e., it's
just SQL).

But a database is only as interesting as the insights it allows you to
derive from your data.

For this tutorial, we've put together a sample data set from real-life
New York City taxicab data ([courtesy of the NYC Taxi and Limousine Commission][NYCTLC]).

>ttt For simplicity we'll assume that TimescaleDB is installed on a
PostgreSQL server at `localhost` on the default port, and that a user `postgres` exists
with full superuser access. If your setup is different, please modify the
examples accordingly.

### 1. Download and Load Data

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

### 2. Run Some Queries

Let's see what tables we have:

```sql
\dt

           List of relations
 Schema |     Name      | Type  |  Owner
--------+---------------+-------+----------
 public | payment_types | table | postgres
 public | rates         | table | postgres
 public | rides         | table | postgres
(3 rows)
```

Most of our data is in the "rides" table. Let's take a closer look:

```sql
\d rides

                      Table "public.rides"
        Column         |            Type             | Modifiers
-----------------------+-----------------------------+-----------
 vendor_id             | text                        |
 pickup_datetime       | timestamp without time zone | not null
 dropoff_datetime      | timestamp without time zone | not null
 passenger_count       | numeric                     |
 trip_distance         | numeric                     |
 pickup_longitude      | numeric                     |
 pickup_latitude       | numeric                     |
 rate_code             | integer                     |
 dropoff_longitude     | numeric                     |
 dropoff_latitude      | numeric                     |
 payment_type          | integer                     |
 fare_amount           | numeric                     |
 extra                 | numeric                     |
 mta_tax               | numeric                     |
 tip_amount            | numeric                     |
 tolls_amount          | numeric                     |
 improvement_surcharge | numeric                     |
 total_amount          | numeric                     |
Indexes:
    "rides_passenger_count_pickup_datetime_idx" btree (passenger_count, pickup_datetime DESC)
    "rides_pickup_datetime_vendor_id_idx" btree (pickup_datetime DESC, vendor_id)
    "rides_rate_code_pickup_datetime_idx" btree (rate_code, pickup_datetime DESC)
    "rides_vendor_id_pickup_datetime_idx" btree (vendor_id, pickup_datetime DESC)
```

Let's run a query that TimescaleDB handles better than vanilla
PostgreSQL:

```sql
-- Average fare amount of rides with 2+ passengers by day
SELECT date_trunc('day', pickup_datetime) as day, avg(fare_amount)
  FROM rides
  WHERE passenger_count > 1 AND pickup_datetime < '2016-01-08'
  GROUP BY day ORDER BY day;

        day         |         avg
--------------------+---------------------
2016-01-01 00:00:00 | 13.3990821679715529
2016-01-02 00:00:00 | 13.0224687415181399
2016-01-03 00:00:00 | 13.5382068607068607
2016-01-04 00:00:00 | 12.9618895561740149
2016-01-05 00:00:00 | 12.6614611935518309
2016-01-06 00:00:00 | 12.5775245695086098
2016-01-07 00:00:00 | 12.5868802584437019
(7 rows)
```

Some queries will execute _**over 20x**_ faster on TimescaleDB than
on vanilla PostgreSQL. Here's one example:

```sql
-- Total number of rides by day for first 5 days
SELECT date_trunc('day', pickup_datetime) as day, COUNT(*) FROM rides
  GROUP BY day ORDER BY day
  LIMIT 5;

        day         | count
--------------------+--------
2016-01-01 00:00:00 | 345037
2016-01-02 00:00:00 | 312831
2016-01-03 00:00:00 | 302878
2016-01-04 00:00:00 | 316171
2016-01-05 00:00:00 | 343251
(5 rows)
```

Now let's run a query _beyond_ what vanilla PostgreSQL supports:

```sql
-- Number of rides by 5 minute intervals
--   (using the TimescaleDB "time_bucket" function)
SELECT time_bucket('5 minute', pickup_datetime) AS five_min, count(*)
  FROM rides
  WHERE pickup_datetime < '2016-01-01 02:00'
  GROUP BY five_min ORDER BY five_min;

      five_min       | count
---------------------+-------
 2016-01-01 00:00:00 |   703
 2016-01-01 00:05:00 |  1482
 2016-01-01 00:10:00 |  1959
 2016-01-01 00:15:00 |  2200
 2016-01-01 00:20:00 |  2285
 2016-01-01 00:25:00 |  2291
 2016-01-01 00:30:00 |  2349
 2016-01-01 00:35:00 |  2328
 2016-01-01 00:40:00 |  2440
 2016-01-01 00:45:00 |  2372
 2016-01-01 00:50:00 |  2388
 2016-01-01 00:55:00 |  2473
 2016-01-01 01:00:00 |  2395
 2016-01-01 01:05:00 |  2510
 2016-01-01 01:10:00 |  2412
 2016-01-01 01:15:00 |  2482
 2016-01-01 01:20:00 |  2428
 2016-01-01 01:25:00 |  2433
 2016-01-01 01:30:00 |  2337
 2016-01-01 01:35:00 |  2366
 2016-01-01 01:40:00 |  2325
 2016-01-01 01:45:00 |  2257
 2016-01-01 01:50:00 |  2316
 2016-01-01 01:55:00 |  2250
(24 rows)
```

### 3. Run Some Fancier Queries

Let's see what else is going on in the dataset.

```sql
-- Analyze rides by rate type
SELECT rate_code, COUNT(vendor_id) as num_trips FROM rides
  WHERE pickup_datetime < '2016-01-08'
  GROUP BY rate_code ORDER BY rate_code;

 rate_code | num_trips
-----------+-----------
         1 |   2266401
         2 |     54832
         3 |      4126
         4 |       967
         5 |      7193
         6 |        17
        99 |        42
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
-- Mapping of rate_code to text description
SELECT * FROM rates;

 rate_code |      description
-----------+-----------------------
         1 | standard rate
         2 | JFK
         3 | Newark
         4 | Nassau or Westchester
         5 | negotiated fare
         6 | group ride
(6 rows)

-- Join rides with rates to get more information on rate_code
SELECT rates.description, COUNT(vendor_id) as num_trips FROM rides
  JOIN rates on rides.rate_code = rates.rate_code
  WHERE pickup_datetime < '2016-01-08'
  GROUP BY rates.description ORDER BY rates.description;

      description      | num_trips
-----------------------+-----------
 JFK                   |     54832
 Nassau or Westchester |       967
 Newark                |      4126
 group ride            |        17
 negotiated fare       |      7193
 standard rate         |   2266401
(6 rows)
```

Now we have something that is human readable. In particular, two of
these rate types
correspond to local airports (JFK, Newark). Let's take a closer look at
those two:

```sql
-- Analysis of all JFK and EWR rides in Jan 2016
SELECT rates.description, COUNT(vendor_id) as num_trips,
    AVG(dropoff_datetime - pickup_datetime) as avg_trip_duration, AVG(total_amount) as avg_total,
    AVG(tip_amount) as avg_tip, MIN(trip_distance) as min_distance, AVG(trip_distance) as avg_distance, MAX(trip_distance) as max_distance,
    AVG(passenger_count) as avg_passengers
  FROM rides
  JOIN rates on rides.rate_code = rates.rate_code
  WHERE rides.rate_code in (2,3) AND pickup_datetime < '2016-02-01'
  GROUP BY rates.description ORDER BY rates.description;

 description | num_trips | avg_trip_duration |      avg_total      |      avg_tip       | min_distance |    avg_distance     | max_distance |   avg_passengers
-------------+-----------+-------------------+---------------------+--------------------+--------------+---------------------+--------------+--------------------
 JFK         |    225019 | 00:45:46.822517   | 64.3278115181384683 | 7.3334228220728027 |         0.00 | 17.2602816651038357 |       221.00 | 1.7333869584346211
 Newark      |     16822 | 00:35:16.157472   | 86.4633688027582927 | 9.5461657353465700 |         0.00 | 16.2706122934252764 |       177.23 | 1.7435501129473309
(2 rows)
```

Now this is interesting:
- JFK is more than 10x more popular than Newark
(assuming both airports have a similar number of flights per day).
- JFK is about 25% cheaper (most likely because of NJ tunnel and highway tolls).
- Newark trips however are 22% (10 min) shorter.
- Each airport is about 17 miles on average from the trip origination point.
- Each have on average ~1.74 passengers/trip,
indicating some homogeneity between the two rate types.

Here's an interesting insight:

If you need to book a flight out of NYC, think you will be in a rush,
and don't mind paying a little extra
(e.g., if you are splitting the fare), then you may want to consider
flying out of Newark over JFK.

### 4. What's Happening Behind the Scenes

What's nice about TimescaleDB is that it lets you run these types of queries
on large datasets without having to worry about partitioning / chunking, etc.

When you write data to the database, it gets automatically partitioned across
space and time. Then, when you query your data, the database lets you
run those queries against a *hypertable*: the abstraction of a single continuous
table across all space and time intervals.

In TimescaleDB, hypertables can live alongside normal PostgreSQL tables.

In our example above, `rides` is a hypertable, while `rates` is a normal
PostgreSQL table.

Let's peek behind the curtain
using the native PostgreSQL `EXPLAIN` command,
and see TimescaleDB at work:

```sql
-- Peek behind the scenes
EXPLAIN SELECT * FROM rides;

                                    QUERY PLAN
-----------------------------------------------------------------------------------
 Append  (cost=0.00..258876.51 rows=3591152 width=472)
   ->  Seq Scan on rides  (cost=0.00..0.00 rows=1 width=472)
   ->  Seq Scan on _hyper_1_1_chunk  (cost=0.00..235846.56 rows=3253056 width=472)
   ->  Seq Scan on _hyper_1_2_chunk  (cost=0.00..1043.31 rows=34831 width=113)
   ->  Seq Scan on _hyper_1_3_chunk  (cost=0.00..21905.44 rows=302144 width=472)
   ->  Seq Scan on _hyper_1_4_chunk  (cost=0.00..81.20 rows=1120 width=472)
(6 rows)
```

This shows that the hypertable `rides` is split across four chunks
(`_hyper_1_1_chunk`, `_hyper_1_2_chunk`, `_hyper_1_3_chunk`, `_hyper_1_4_chunk`).

>ttt This is the schema as of TimescaleDB 0.1.0.  Older versions of
 the database had a slightly different internal schema.

We can even query one of these chunks directly, accessing them via the
private schema `_timescaledb_internal`:

```sql
SELECT COUNT(*) FROM _timescaledb_internal._hyper_1_2_chunk;

 count
-------
 34831
(1 row)
```

Feel free to play with the internal TimescaleDB tables. One of the
advantages of TimescaleDB is that it is fully transparent: you can always peek
behind the curtain and see what's going on backstage.

(To see all internal schemas, use command `\dn`.)

```sql
\dn

         List of schemas
         Name          |  Owner
-----------------------+----------
 _timescaledb_cache    | postgres
 _timescaledb_catalog  | postgres
 _timescaledb_internal | postgres
 public                | postgres
(4 rows)
```

### 5. Bonus! Geospatial Queries via PostGIS [](tutorial-postgis)

TimescaleDB is packaged as a PostgreSQL extension, meaning one can install it
alongside other extensions for additional functionality. One example of that is
using PostGIS alongside TimescaleDB for geospatial data.

Here's how to do that, using our same NYC TLC dataset.

First, install PostGIS from their website (we recommend installing from source): [PostGIS Website][postgis].

Next, let's set up PostGIS in our `nyc_data` database:

```sql
-- Install the extension in the database
CREATE EXTENSION postgis;

-- Create geometry columns for each of our (lat,long) points
ALTER TABLE rides ADD COLUMN pickup_geom geometry(POINT,2163);
ALTER TABLE rides ADD COLUMN dropoff_geom geometry(POINT,2163);
```

>ttt Note that with hypertables, ALTER just works. TimescaleDB transparently
alters the schemas of all the hypertable's chunks. And the user doesn't
need to worry about this: they can just think of their hypertable as an
ordinary table.

```sql
-- Generate the geometry points and write to table
--   (Note: These calculations might take a few mins)
UPDATE rides SET pickup_geom = ST_Transform(ST_SetSRID(ST_MakePoint(pickup_longitude,pickup_latitude),4326),2163);
UPDATE rides SET dropoff_geom = ST_Transform(ST_SetSRID(ST_MakePoint(dropoff_longitude,dropoff_latitude),4326),2163);
```

Now we can run geospatial queries, like this one:

```sql
-- Number of rides on New Years Eve originating within
--   400m of Times Square, by 30 min buckets
--   Note: Times Square is at (lat, long) (40.7589,-73.9851)
SELECT time_bucket('30 minutes', pickup_datetime) AS thirty_min, COUNT(*) AS near_times_sq
  FROM rides
  WHERE ST_Distance(pickup_geom, ST_Transform(ST_SetSRID(ST_MakePoint(-73.9851,40.7589),4326),2163)) < 400
    AND pickup_datetime < '2016-01-01 14:00'
  GROUP BY thirty_min ORDER BY thirty_min;

     thirty_min      | near_times_sq
---------------------+--------------
 2016-01-01 00:00:00 |      74
 2016-01-01 00:30:00 |     102
 2016-01-01 01:00:00 |     120
 2016-01-01 01:30:00 |      98
 2016-01-01 02:00:00 |     112
 2016-01-01 02:30:00 |     109
 2016-01-01 03:00:00 |     163
 2016-01-01 03:30:00 |     181
 2016-01-01 04:00:00 |     214
 2016-01-01 04:30:00 |     185
 2016-01-01 05:00:00 |     158
 2016-01-01 05:30:00 |     113
 2016-01-01 06:00:00 |     102
 2016-01-01 06:30:00 |      91
 2016-01-01 07:00:00 |      88
 2016-01-01 07:30:00 |      58
 2016-01-01 08:00:00 |      72
 2016-01-01 08:30:00 |      94
 2016-01-01 09:00:00 |     115
 2016-01-01 09:30:00 |     118
 2016-01-01 10:00:00 |     135
 2016-01-01 10:30:00 |     160
 2016-01-01 11:00:00 |     212
 2016-01-01 11:30:00 |     229
 2016-01-01 12:00:00 |     244
 2016-01-01 12:30:00 |     230
 2016-01-01 13:00:00 |     235
 2016-01-01 13:30:00 |     238
```

What this query asks: how many taxis pick up rides within 400m of Times
Square on New Years Day, grouped by 30 minute buckets.

What the data shows: Looks like few people want to leave right at
midnight (understandably),
while a lot want to leave around 4am (when the bars close). And by noon,
Times Square is back at steady state, because NYC never takes a day off.

This is just one example, but it highlights how TimescaleDB + PostGIS
allows
us to slice data not just by time but also location.

And it shows the power of running other PostgreSQL extensions with
TimescaleDB.


### 6. Next Steps
Up for learning more? Here are a few suggestions:

- [Try Other Sample Datasets][other samples]
- [Migrate your own Data][migrate]

[install]: /getting-started/installation
[NYCTLC]: http://www.nyc.gov/html/tlc/html/about/trip_record_data.shtml
[nyc_data]: https://timescaledata.blob.core.windows.net/datasets/nyc_data.tar.gz
[postgis]: http://postgis.net/documentation
[other samples]: /tutorials/other-sample-datasets
[migrate]: /getting-started/migrating-data
