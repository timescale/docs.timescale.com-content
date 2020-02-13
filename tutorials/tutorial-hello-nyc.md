# Tutorial: Hello NYC

Prerequisites: [Installed TimescaleDB][install]

By now you should already have: installed TimescaleDB, experienced
creating hypertables, and tried inserting and querying data (i.e., it's
just SQL).

But a database is only as interesting as the insights it allows you to
derive from your data.

For this tutorial, we've put together a sample data set from real-life
New York City taxicab data ([courtesy of the NYC Taxi and Limousine Commission][NYCTLC]).

>:TIP: For simplicity we'll assume that TimescaleDB is installed on a
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

Next, download the file from the below link:

[:DOWNLOAD_LINK: `nyc_data.tar.gz`][nyc_data]

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

>:TIP: This is the schema as of TimescaleDB 0.1.0.  Older versions of
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
          Name           |  Owner
-------------------------+----------
 _timescaledb_cache      | postgres
 _timescaledb_catalog    | postgres
 _timescaledb_config     | postgres
 _timescaledb_internal   | postgres
 public                  | postgres
 timescaledb_information | postgres
(6 rows)
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

>:TIP: Note that with hypertables, ALTER just works. TimescaleDB transparently
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
Hello Timescale!

Use case: IoT Analysis and Monitoring

In this tutorial, you will learn:
How to get started with TimescaleDB and Timescale Cloud*
How to use TimescaleDB to analyze and monitor data from IoT sensors

Dataset: NYC taxicab data for January 2016
Estimated time for completion: 25 minutes.

* This tutorial is primarily designed for users of Timescale Cloud. However, you can follow along just fine if you’re using a self-hosted and/or self-managed version of TimescaleDB.
Background


New York City is home to more than 8.3 million people. In an effort to support a growing population of New Yorkers and tourists and to reduce their carbon footprint, the New York Data Team has recruited you to help analyze and monitor data from New York’s yellow cab taxis using TimescaleDB. Your work will be critical to how they plan transit upgrades, set budgets, allocate resources, and more. 

You have 3 missions:
Mission 1: Gear Up [5 minutes]
You will learn how to connect to a hosted database in Timescale Cloud and load data from a CSV file in your local terminal using psql.

Mission 2: Analysis [10 minutes]
You will learn how to analyze a time-series dataset using TimescaleDB and PostgreSQL. 

Mission 3: Monitoring [10 minutes]
You will learn how to use TimescaleDB to monitor IoT devices. You’ll also learn about using TimescaleDB in conjunction with other PostgreSQL extensions like PostGIS, for querying geospatial data.
Mission 1: Gear up


The New York Data Team is using yellow taxi cab data from the New York City Taxi and Limousine Commission (NYC TLC). The NYC TLC is the agency responsible for licensing and regulating New York City’s Yellow taxi cabs and other for hire vehicles. These vehicles are famous for getting New Yorkers and tourists wherever they need to go across all five boroughs. 

The NYC TLC has over 200,000 licensee vehicles completing about 1 million trips each day – that’s a lot of trips! Each of these rides produces time-series data, and that data needs a place to be stored. The New York Data Team have chosen TimescaleDB as their time-series database of choice and have asked you to help them get connected.

The steps below assume you’ve already created a Timescale Cloud account and have an instance running (you can still follow the same steps for a local installation of TimescaleDB, just be sure to change the username, password and port numbers
1.1 Get Connected
First, download and install psql. Next, navigate to the ‘Overview Tab’ of your Timescale Cloud dashboard and locate your host, port and password, as highlighted in Fig 1.1.


Fig 1.1: Connection information from the Overview tab in Timescale Cloud

Afterward, connect to your Timescale Cloud database from psql by typing the command in code block 1 into your terminal, ensuring to replace the {curly brackets} with your real password, hostname and port number found in the overview tab.


psql postgres://tsdbadmin:{YOUR_PASSWORD_HERE}@{|YOUR_HOSTNAME_HERE}:{YOUR_PORT_HERE}/defaultdb?sslmode=require
Code block 1

You should see the connection message shown in code block 2 below after successfully connecting:

psql (11.3, server 11.4)
SSL connection (protocol: TLSv1.2, cipher: ECDHE-RSA-AES256-GCM-SHA384, bits: 256, compression: off)
Type "help" for help.

defaultdb=>
Code block 2

To verify that TimescaleDB is installed, run the command in code block 3 which lists all installed extensions to your PostgreSQL database:


defaultdb=> \dx
Code block 3

You should see an output similar to the one shown in code block 4 below. Notice how one of the installed extensions is TimescaleDB!

defaultdb-> \dx
                                      List of installed extensions
    Name     | Version |   Schema   |                            Description                            
-------------+---------+------------+-------------------------------------------------------------------
 plpgsql     | 1.0     | pg_catalog | PL/pgSQL procedural language
 timescaledb | 1.4.2   | public     | Enables scalable inserts and complex queries for time-series data
(2 rows)
Code block 4

1.2 Define your data schema
As mentioned above, the NYC TLC collects ride-specific data from every vehicle, generating data from millions of rides every day. 

They collect the following data about each ride:
Pickup date and time (as a timestamp)
Pickup location (latitude and longitude)
Drop off date and time (as a timestamp)
Drop off location (latitude and longitude)
Trip distance (in miles)
Fares (in USD)
Passenger count 
Rate type (e.g standard, airport. For more see RateCodeID in this doc)
Payment type (Cash, credit card. For more see Payment_type in this doc)

To efficiently store that data, we’re going to need 3 tables:
1 hypertable called rides, which will store all of the above data for each ride taken.
1 regular Postgres table called payment_types, which maps the payment types to their English description.
1 regular Postgres table called rates, which maps the numeric rate codes to their English description.

See nyc_data_setup.sql [Github link: https://github.com/timescale/examples/tree/master/hello-timescale ] below which defines the schema for our 3 tables:

-- nyc_data_setup.sql
-- Create table 'rides' which will store trip data
DROP TABLE IF EXISTS "rides";
CREATE TABLE "rides"(
    vendor_id TEXT,
    pickup_datetime TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    dropoff_datetime TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    passenger_count NUMERIC,
    trip_distance NUMERIC,
    pickup_longitude  NUMERIC,
    pickup_latitude   NUMERIC,
    rate_code         INTEGER,
    dropoff_longitude NUMERIC,
    dropoff_latitude  NUMERIC,
    payment_type INTEGER,
    fare_amount NUMERIC,
    extra NUMERIC,
    mta_tax NUMERIC,
    tip_amount NUMERIC,
    tolls_amount NUMERIC,
    improvement_surcharge NUMERIC,
    total_amount NUMERIC
);

-- Create hypertable for rides 
-- This allows us to take advantage of timescaledb's space and time partitioning
SELECT create_hypertable('rides', 'pickup_datetime', 'payment_type', 2, create_default_indexes=>FALSE);
-- Create indexes (special look up tables/ pointers) on the following columns to speed up data retrieval
CREATE INDEX ON rides (vendor_id, pickup_datetime desc);
CREATE INDEX ON rides (pickup_datetime desc, vendor_id);
CREATE INDEX ON rides (rate_code, pickup_datetime DESC);
CREATE INDEX ON rides (passenger_count, pickup_datetime desc);

-- Create table 'payment_types' to store description of payment types for easy lookup
CREATE TABLE IF NOT EXISTS "payment_types"(
    payment_type INTEGER,
    description TEXT
);
INSERT INTO payment_types(payment_type, description) VALUES
(1, 'credit card'),
(2, 'cash'),
(3, 'no charge'),
(4, 'dispute'),
(5, 'unknown'),
(6, 'voided trip');

-- Create table 'rates' to store description of rate codes for for easy lookup
CREATE TABLE IF NOT EXISTS "rates"(
    rate_code   INTEGER,
    description TEXT
);
INSERT INTO rates(rate_code, description) VALUES
(1, 'standard rate'),
(2, 'JFK'),
(3, 'Newark'),
(4, 'Nassau or Westchester'),
(5, 'negotiated fare'),
(6, 'group ride');

1.3 Load trip data into timescaledb
[Note, if the dataset is already pre-loaded into your Timescale Cloud instance, you can skip straight to Mission 2.]

Next, let’s upload the taxi cab data into your Timescale Cloud instance. The data is in a file called nyc_data_rides.csv Download it here [Github Link: https://github.com/timescale/examples/tree/master/hello-timescale]. 

Then, run the statements contained in nyc_data_setup.sql (from 1.2 above) in psql to create the schemas in your database.

To confirm success, run the command below and check that you see the following tables:
rides
Payment_type
rates

defaultdb-> \dt

The next step is to copy data from nyc_data_rides.csv into the ‘rides’ hypertable. To do this, we’ll use the psql \copy command below:


defaultdb=> \COPY rides FROM nyc_data_rides.csv CSV

Then, run the following query to validate that your insertion of data:

SELECT * FROM rides
LIMIT 5;

If you see the following result, congrats you’ve successfully completed Mission 1!

SELECT * FROM rides
LIMIT 5;
 vendor_id |   pickup_datetime   |  dropoff_datetime   | passenger_count | trip_distance |  pickup_longitude   |  pickup_latitude   | rate_code |  dropoff_longitude  |  dropoff_latitude  | payment_type | fare_amount | extra | mta_tax | tip_amount | tolls_amount | improvement_surcharge | total_amount 
-----------+---------------------+---------------------+-----------------+---------------+---------------------+--------------------+-----------+---------------------+--------------------+--------------+-------------+-------+---------+------------+--------------+-----------------------+--------------
 1         | 2016-01-01 00:00:01 | 2016-01-01 00:11:55 |               1 |          1.20 | -73.979423522949219 | 40.744613647460938 |         1 | -73.992034912109375 | 40.753944396972656 |            2 |           9 |   0.5 |     0.5 |          0 |            0 |                   0.3 |         10.3
 1         | 2016-01-01 00:00:02 | 2016-01-01 00:11:14 |               1 |          6.00 | -73.947151184082031 | 40.791046142578125 |         1 | -73.920768737792969 | 40.865577697753906 |            2 |          18 |   0.5 |     0.5 |          0 |            0 |                   0.3 |         19.3
 1         | 2016-01-01 00:00:07 | 2016-01-01 00:09:49 |               1 |          1.80 | -73.989166259765625 | 40.726589202880859 |         1 | -74.009483337402344 | 40.715072631835938 |            2 |           9 |   0.5 |     0.5 |          0 |            0 |                   0.3 |         10.3
 1         | 2016-01-01 00:00:09 | 2016-01-01 00:07:18 |               2 |          1.20 | -73.963912963867188 | 40.712173461914062 |         1 | -73.951332092285156 | 40.712200164794922 |            2 |           7 |   0.5 |     0.5 |          0 |            0 |                   0.3 |          8.3
 1         | 2016-01-01 00:00:16 | 2016-01-01 00:33:00 |               2 |          2.90 | -73.982154846191406 | 40.774879455566406 |         1 | -73.981361389160156 | 40.744113922119141 |            2 |        20.5 |   0.5 |     0.5 |          0 |            0 |                   0.3 |         21.8
(5 rows)

Mission 2: Analysis


The day is 1 February 2016, and the government has just issued a notice that, in an effort to mitigate the impact of global warming, all public entities must take measures to decrease their carbon footprint. New York City has committed to reducing their greenhouse gas emissions by 20% by 2024. Given the number of taxi rides taken each day, they believe studying past taxi rider history will play a major factor in doing so.

The New York Data Team have recruited you to help them make sense of historical taxi ride data, draw insights, and use your analysis to plan for the future. Your goal is to conduct an analysis of all NYC TLC taxi rides taken  in January 2016.
2.1 Basic Analysis
2.1.1 How many rides took place on each day?
The first question that they’ve asked you to explore is simple: How many rides took place on each day during January 2016?

Since TimescaleDB supports full SQL, all that’s required is a simple SQL query to count the number of rides and group/ order them by the day they took place, as seen in query 2.1.1 below:

-- 2.1.1
-- What's the total number of rides that took place everyday for first 5 days
SELECT date_trunc('day', pickup_datetime) as day, COUNT(*) FROM rides
  GROUP BY day ORDER BY day

2.1.2 What is the average fare amount for 2+ passengers?
The next question they’d like an answer to is what the daily average fare amount for rides with 2+ passengers for the first week of January? Once again, this is a simple 4 line SQL query with some conditional statements, shown in query 2.1.2 below:

-- 2.1.2
-- What is the daily average fare amount for rides with 2 or more passengers
-- for first 7 days
SELECT date_trunc('day', pickup_datetime) as day, avg(fare_amount)
  FROM rides
  WHERE passenger_count > 1 AND pickup_datetime < '2016-01-08'
  GROUP BY day ORDER BY day;

An interesting aside is that queries like query 2.1.1 and 2.1.2 execute up to 20x faster on TimescaleDB than on a vanilla PostgreSQL database, thanks to Timescale’s automatic time and space partitioning.

2.1.3 How many rides took place by each rate type?
Another thing the New York Data Team would like to know is the breakdown of rides by ride type. We see in query 2.1.3 (a) how to achieve this in SQL:


-- 2.1.3 (a)
-- How many rides of each rate type took place in the month?
SELECT rate_code, COUNT(vendor_id) as num_trips FROM rides
  WHERE pickup_datetime < '2016-02-01'
  GROUP BY rate_code ORDER BY rate_code;

After running query 2.1.3 (a) above , you’ll get the following output, which shows how many rides of each rate code took place. 

Fig 2.1.3.1: Results for rides breakdown by rate code in query 2.1.3.1

While that’s technically correct, you’d like to present something more human readable to the NYC TLC. To do that, we can use the power of SQL joins, like in query 2.1.3 (b) below:

-- 2.1.3 (b)
-- How many rides of each rate type took place?
-- Join rides with rates to get more information on rate_code
SELECT rates.description, COUNT(vendor_id) as num_trips FROM rides
  JOIN rates on rides.rate_code = rates.rate_code
  WHERE pickup_datetime < '2016-02-01'
  GROUP BY rates.description ORDER BY rates.description;


Fig 2.1.3.2: Results for rides breakdown by rate code in human readable form in query 2.1.3 (b)

This is a simple illustration of a powerful point: By allowing JOINs over hypertables and regular PostgreSQL tables, TimescaleDB allows you to combine your time-series data with your relational or business data to unearth powerful insights.
2.2 Airport Ride Analysis
2.2.1 Analysis of rides to JFK and EWR
From your work calculating rides by rate type, the NYC TLC noticed that rides to John F Kennedy International Airport (JFK) and Newark International Airport (EWR) were the 2nd and 4th most popular ride types, respectively. Given this popularity in airport rides and consequent carbon footprint, the city of New York thinks that airport public transportation could be an area of improvement - reducing traffic in the city and overall carbon footprint associated with airport trips.

Prior to instituting any programs, they would like you to more closely examine trips to JFK (code 2) and Newark (code 3). For each airport, they would like to know the following for the month of January:
Number of trips to that airport
Average trip duration (i.e drop off time - pickup time)
Average trip cost
Average tip
Minimum, Maximum and Average trip distance
Average number of passengers

To do this, we can run query 2.2.1:

-- 2.2.1
-- For each airport: num trips, avg trip duration, avg cost, avg tip, avg distance, min distance, max distance, avg number of passengers
SELECT rates.description, COUNT(vendor_id) as num_trips,
    AVG(dropoff_datetime - pickup_datetime) as avg_trip_duration, AVG(total_amount) as avg_total,
    AVG(tip_amount) as avg_tip, MIN(trip_distance) as min_distance, AVG(trip_distance) as avg_distance, MAX(trip_distance) as max_distance,
    AVG(passenger_count) as avg_passengers
  FROM rides
  JOIN rates on rides.rate_code = rates.rate_code
  WHERE rides.rate_code in (2,3) AND pickup_datetime < '2016-02-01'
  GROUP BY rates.description ORDER BY rates.description;

Which produces the following output:

Fig 2.2: Results for airport rides analysis in query 2.2.1

The New York Data Team was very happy about your ride comparison work. Based on your analysis, they identified:

There are 13x more rides to JFK than Newark. This often leads to heavy traffic on the roads to and from JFK, especially during peak times. They’ve decided to explore road improvements to those areas, as well as increasing public transport to and from the airport (e.g busses, subway, trains etc)
Each airport ride has on average the same number of passengers per trip (~1.7 passengers per trip).
The trip distances are roughly the same 16-17 miles.
JFK is about 30% cheaper, most likely because of NJ tunnel and highway tolls.
Newark trips are 22% (10 min) shorter.

This data is useful not just for city planners, but also for airport travellers and tourism organizations like the NYC Tourism Bureau. For example, a tourism organization could recommend cost-conscious travelers who’d rather not fork out $84 for a ride to Newark to use public transport instead, like the NJ Transit train from Penn Station ($15.25 for an adult ticket). Similarly, they could recommend those travelling to JFK airport, and who are weary of heavy traffic, to take the subway and airtrain instead, for just $7.50.

Moreover, you could also make recommendations for those flying out of New York City about which airport to choose. For example, from the data above, we can recommend those travellers who think they’d be in a rush and who don’t mind paying a little extra to consider flying out of Newark over JFK.

If you’ve made it this far, you’ve successfully completed Mission 2 and now have a basic understanding of how to analyze time-series data using TimescaleDB!
Mission 3: Monitoring


The NYC Data Team would also like to use the time-series data from taxi rides for monitoring the ride’s current status.

(Note: A more realistic setup would involve creating a data pipeline that streams sensor data directly from the cars into TimescaleDB. However, we will use the January 2016 data to illustrate the underlying principles that are applicable regardless of setup.)
3.1 Basic time-based monitoring
It’s January 1st 2016. NYC riders have celebrated New Year’s Eve, and using taxi cabs to get home safely or to travel to their first gathering of the new year.

3.1.1 How many rides took place every 5 minutes for the first day of 2016?
The first thing the New York Data Team would like to know is how many rides have recently taken place. We can approximate that by counting the number of rides that were completed on the first day of 2016, in 5 minute intervals.

While it's easy to count how many rides took place, there is no easy way to segment data by 5 minute time intervals in PostgreSQL. As a result, we will need to use a query similar to query 3.1.1 (a) below:

-- 3.1.1 (a)
-- Vanilla Postgres query for num rides every 5 minutes
SELECT
  EXTRACT(hour from pickup_datetime) as hours,
  trunc(EXTRACT(minute from pickup_datetime) / 5)*5 AS five_mins,
  COUNT(*)
FROM 
  rides
WHERE 
  pickup_datetime < '2016-01-02 00:00'
GROUP BY 
  hours,
  five_mins

It’s not immediately clear why query 3.1.1 (a) returns rides by segmented by 5 minute buckets, so let’s examine it more closely, using the sample time of 08:49:00. Note, to see how Timescale simplifies common time-series analysis tasks, like segmenting data by arbitrary time intervals, you can skip to query 3.1.1 (b).

In query 3.1.1, we first extract hours, the hour that a ride took place in:
  EXTRACT(hour from pickup_datetime) as hours,
So for 08:49 our result for hours would be 8. Then we need to calculate, five_mins, the closest multiple of 5 minutes for a given timestamp. To do this, we calculate the quotient of the minute that a ride took place divided by 5. Then we truncate the result to take the ‘floor’ of that quotient. Afterward, we multiply that truncated quotient by 5 to in essence find the 5 minute bucket that the minute is closest to:
  trunc(EXTRACT(minute from pickup_datetime) / 5)*5 AS five_mins,
So our result for time of 08:49 would be trunc(49/5)*5 = trunc(9.8)*5 = 9*5 = 45, so this time would be in the 45min bucket. After exacting both the hours and which 5 minute interval the time fell into, we’d then group our results, first by the hours and then the five_mins interval. Whew, that was a lot for a conceptually simple question!

Questions that call for segmentation by arbitrary time intervals are common in time-series analysis, but can sometimes be unwieldy in vanilla PostgreSQL. Thankfully, to help make time-series analysis quick and simple, Timescale has many SQL functions specifically made for time-series analysis. One of those special Timescale SQL functions is time_bucket. time_bucket is a more powerful version of the PostgreSQL date_trunc function, as it allows for arbitrary time intervals, rather than the standard day, minute, hour provided by date_trunc.

So when using TimescaleDB, the complex query 3.1.1 (a) above turns into a simple 4 line SQL query, as seen in 3.1.1 (b) below:

-- 3.1.1 (b)
-- How many rides took place every 5 minutes for the first day of 2016?
-- using the TimescaleDB "time_bucket" function
SELECT time_bucket('5 minute', pickup_datetime) AS five_min, count(*)
  FROM rides
  WHERE pickup_datetime < '2016-01-02 00:00'
  GROUP BY five_min ORDER BY five_min;

3.2 Dude, where’s my car? (Timescale + PostGIS)
New York City is famous for the annual Ball Drop New Year’s Eve celebration in Times Square. Thousands of people gather in Time Square to bring in the new year together and then head home, to their favorite bar or first gathering of the new year.

This matters to you - as a member of the New York Data Team - because you’d like to understand taxi demand in the Times Square area on the first day of 2016. 

3.2.1 How many rides on New Year’s Morning originated from within 400m of Times Square, by 30 minute buckets?
To answer this question, your first guess might be to use our friend ‘time_bucket’ from 3.1.1 above to count rides initiated in 30 minute intervals. But there’s one piece of information we don’t have -- how do we figure out which rides started near Time Square?

This requires that we make use of the pick up latitude and longitude columns in our ‘rides’ hypertable (see section 1.3 above), which provides each ride’s pickup location. To take advantage of the pickup location, we’ll need to get our hypertable ready for geospatial queries.

The good news is that Timescale is compatible with all other Postgres extensions and, for geospatial data, we’ll use PostGIS. This allows us to slice data by time and location with the speed and scale of TimescaleDB!


-- Geospatial queries - Timescale + POSTGIS -- slice by time and location
-- Install the extension in the database
CREATE EXTENSION postgis;

Then, run the following command to verify that PostGIS was installed properly. You should see the PostGIS extension in your extension list, as note in bold below:

defaultdb=> \dx
                                       List of installed extensions
    Name     | Version |   Schema   |                             Description                             
-------------+---------+------------+---------------------------------------------------------------------
 plpgsql     | 1.0     | pg_catalog | PL/pgSQL procedural language
 postgis     | 2.5.1   | public     | PostGIS geometry, geography, and raster spatial types and functions
 timescaledb | 1.4.2   | public     | Enables scalable inserts and complex queries for time-series data
(3 rows)


Now, we need to alter our table to work with PostGIS. To start, we’ll add geometry columns for ride pick up and drop off locations:

-- Create geometry columns for each of our (lat,long) points
ALTER TABLE rides ADD COLUMN pickup_geom geometry(POINT,2163);
ALTER TABLE rides ADD COLUMN dropoff_geom geometry(POINT,2163);

Next we’ll need to convert the latitude and longitude points into geometry coordinates so that it plays well with PostGIS:

-- Generate the geometry points and write to table
-- (Note: These calculations might take a few mins)
UPDATE rides SET pickup_geom = ST_Transform(ST_SetSRID(ST_MakePoint(pickup_longitude,pickup_latitude),4326),2163);
UPDATE rides SET dropoff_geom = ST_Transform(ST_SetSRID(ST_MakePoint(dropoff_longitude,dropoff_latitude),4326),2163);

Lastly, we need one more piece of info: Times Square is located at (lat, long) (40.7589,-73.9851)

Now, we have all the information to answer our original question: How many rides on New Year’s Morning originated within 400m of Times Square, by 30 minute buckets?


-- 3.2.1
--Times Sq and midnight rides
-- how many taxis pick up rides within 400m of Times Square on New Years Day, grouped by 30 minute buckets.
-- Number of rides on New Years Day originating within 400m of Times Square, by 30 min buckets
--   Note: Times Square is at (lat, long) (40.7589,-73.9851)
SELECT time_bucket('30 minutes', pickup_datetime) AS thirty_min, COUNT(*) AS near_times_sq
  FROM rides
  WHERE ST_Distance(pickup_geom, ST_Transform(ST_SetSRID(ST_MakePoint(-73.9851,40.7589),4326),2163)) < 400
    AND pickup_datetime < '2016-01-01 14:00'
  GROUP BY thirty_min ORDER BY thirty_min;

You should get the following results:


Fig 3.2.1: Results for rides near Times Square by 30 min intervals from query 3.2.1

From Fig 3.2.1 above, the New York Data Team saw that few people wanted to leave by taxi around midnight, while many left by taxi between 03:00-05:00, after the bars, clubs and other New Years Eve parties closed. They are taking steps to incentivize drivers to be available after 3:00am on New Year’s day to meet the increased ride demand during that time.

Rides then picked up in the mid-morning hours, as people headed to breakfast and other New Years activities. New York is truly the city that never sleeps and Times Square is a good reflection of that! 

This is one example of how you can combine other PostgreSQL extensions with TimescaleDB to build powerful queries, answer big questions, and make recommendations.

Congratulations, you’ve successfully used Timescale and PostGIS to slice your data by time and location - completing the third and final mission of this tutorial!
Conclusions and Next Steps
In this tutorial you learned:
How to get started with TimescaleDB and Timescale Cloud

In Mission 1, you learned how to connect to a database in Timescale Cloud and load data from a CSV file using psql.

How to use TimescaleDB to gain insights from IoT data for both monitoring and analysis

In Missions 2 and 3 you learned how to use TimescaleDB to conduct analysis and monitoring on an IoT dataset. You learned about hypertables, saw how Timescale supports full SQL and how JOINs enable you to combine your time-series data with your relational or business data. 

You also learned about special Timescale SQL functions like time_bucket and how they make time-series analysis possible in fewer lines of code, as well as how Timescale is compatible with other extensions like PostGIS, for fast querying by time and location.

Ready for more learning? Here’s a few suggestions:
Time Series Forecasting using TimescaleDB, R, Apache MADlib and Python
Continuous Aggregates

