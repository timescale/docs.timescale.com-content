# Hello NYC

Prerequisites: [Installed TimescaleDB](installation)

By now you should already have installed TimescaleDB, and have experienced
creating hypertables, as well as inserting and querying data (i.e., it's
just SQL).

But a database is only as interesting as the insights it allows you to
derive from your data.

For this tutorial, we've put together a sample data set from real-life
New York City taxicab data ([courtesy of the NYC Taxi and Limousine
Commission](http://www.nyc.gov/html/tlc/html/about/trip_record_data.shtml).

*(Note: For simplicity we'll assume that TimescaleDB is Installed
on a PostgreSQL server at `localhost` on the default port,
and that a user `postgres` exists with full superuser access. If your
setup is different, please modify the examples accordingly.)*

## 1. Download and load data

Let's start by downloading the dataset. TBD Link.

Note that this dataset is a dump of a full database, meaning
that it includes any relevant hypertables and other table schemas.

To load the dataset:
```bash
```

## 2. Run some queries

```bash
-- See how much data we have
SELECT COUNT(*) FROM rides;
```

```bash
-- Look at the data by day
SELECT DATE_TRUNC('day', pickup_datetime) as day, COUNT(*)
FROM rides
GROUP BY day ORDER BY day;
```
Looks like there is some weirdness on January 13th. We'll come back to
that.

## 3. Run some fancier queries

```bash
-- Analyze rides by fare type
SELECT rate_code, COUNT(vendor_id) as num_trips,
  AVG(total_amount) as avg_total, AVG(tip_amount) as avg_tip,
  MIN(trip_distance) as min_distance, AVG(trip_distance) as avg_distance,
  MAX(trip_distance) as max_distance, AVG(passenger_count) as avg_passengers
FROM rides
GROUP BY rate_code order by rate_code;
```

Unfortunately `rate_code` doesn't really tell us what these group
represent, and it doesn't look like there isn't any other info on
rates in the `rides` table.

But it turns out that there is a separate `rates` table, and
fortunately for us, TimescaleDB supports JOINs between tables:

```bash
-- Join rides with rates to get more information on rate_code
SELECT rates.description, COUNT(vendor_id) as num_trips,
  AVG(total_amount) as avg_total, AVG(tip_amount) as avg_tip,
  MIN(trip_distance) as min_distance, AVG(trip_distance) as avg_distance,
  MAX(trip_distance) as max_distance, AVG(passenger_count) as avg_passengers
FROM rides JOIN rates on rides.rate_code = rates.rate_code
GROUP BY rates.description order by rates.description;

description      | num_trips |      avg_total      |        avg_tip         | min_distance |      avg_distance      | max_distance |   avg_passengers   
-----------------------+-----------+---------------------+------------------------+--------------+------------------------+--------------+--------------------
JFK                   |    225019 | 64.3278115181384683 |     7.3334228220728027 |         0.00 |    17.2602816651038357 |       221.00 | 1.7333869584346211
Nassau or Westchester |      4696 | 75.1223679727427598 |     7.4726171209540034 |         0.00 |    17.3553918228279387 |       191.90 | 1.6654599659284497
Newark                |     16822 | 86.4633688027582927 |     9.5461657353465700 |         0.00 |    16.2706122934252764 |       177.23 | 1.7435501129473309
group ride            |       102 | 62.1697058823529412 | 0.69303921568627450980 |         0.00 | 0.77872549019607843137 |        16.90 | 1.0980392156862745
negotiated fare       |     33688 | 67.3104983970553313 |     6.5764545238660651 |         0.00 |     6.1954120161481833 |       485.90 | 1.3221325100926146
standard rate         |  10626315 | 14.3073638791998920 |     1.6022851364748739 |         0.00 |     4.3523019372190642 |   8000010.00 | 1.6705376228730279
(6 rows)

```

There are a lot of interesting things going on, but one in particular
caught our eye: the difference between the JFK fare from the Newark
Airport fare.

Turns out **that Newark is on average closer to most New
Yorkers than JFK**, even though Newark is in a different state (i.e.,
the beautiful State of New Jersey[LINK].)

Yet, despite this, Newark fares were on average $22 more expensive
than JFK, most likely due to highway and tunnel tolls.

1.

- intro
- install db
- download TLC data
- create schema
- load data into schema

- run queries
. Run basic queries, interesting questions
.. rollups, top 10s, joins, window functions
. Run explain to see what's happening behind the scenes
. Query individual tables

- for more:
. more sample data sets
. migrate your own data
. read whitepaper
