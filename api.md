# API/Command Reference

## Psql Commands <a id="psql"></a>
Here we list some of the most common `psql` commands.  For a complete list, check out the [PostgreSQL psql docs][psql].

- `-c <command>`, `--command=<command>`

    Tells `psql` to execute the string *`<command>`* without entering the
    client shell. The *`<command>`* string can be **either** a backslash
    command or a SQL command, but not a combination.  Multiple `-c` commands can be chained.

- `-d <name>`, `--dbname=<name>`

    Denotes the *`<name>`* of the database to connect to.

- `-h <hostname>`, `--host=<hostname>`

    Denotes the *`<hostname>`* of the machine where the PostgreSQL
    server is running.

- `-U <username>`, `--username=<username>`

    Denotes the *`<username>`* of the user with which to connect
    to the database.

Common `psql` commands include:

```bash
# Connect to the database 'tutorial' with username 'postgres'
psql -U postgres -h localhost -d tutorial

# Backup your database to a .csv file
psql -d tutorial -c "\COPY tutorial TO tutorial.csv DELIMITER ',' CSV"
```

---

### Psql Shell Commands

- `\l`

    List available databases

- `\c`, `\connect`

    Connect to a PostgreSQL database using the given parameters.

- `\d`

    List available tables.  If optional argument `NAME` is given, describe
    table, view, or index in more detail.

---

## Table Commands <a id="schema"></a><a id="tables"></a>

Commands to create, alter, or delete schemas in TimescaleDB are
identical to those in PostgreSQL.  Schema commands should be made to
the hypertable name, and any changes are propagated to all chunks
belonging to that hypertable.

### Create a Hypertable

Creating a hypertable is a two-step process.
<!-- add steps format?-->
1. Create a standard table ([PostgreSQL docs][postgres-createtable]).
```sql
CREATE TABLE conditions (
    time        TIMESTAMPTZ       NOT NULL,
    location    TEXT              NOT NULL,
    temperature DOUBLE PRECISION  NULL
);
```

1. Then, execute the TimescaleDB `create_hypertable` command on this
newly created table ([API docs][create_hypertable]).

>vvv You can only convert a plain PostgreSQL table into a
  hypertable if it is currently empty.  Otherwise,
  the `create_hypertable` command will throw an error.  If you need
  to *migrate* data from an existing table to a hypertable, [follow these
  migration instructions instead][migrate-from-postgresql].

### Alter a Hypertable

You can execute standard `ALTER TABLE` commands against the hypertable ([PostgreSQL docs][postgres-createtable]).

```sql
ALTER TABLE conditions
  ADD COLUMN humidity DOUBLE PRECISION NULL;
```

TimescaleDB will then automatically propagate these schema changes to
the chunks that constitute this hypertable.

>vvv Altering a table's schema is quite efficient provided that its
default value is set to NULL.  If its default is a non-null value, TimescaleDB
will need to fill in this value into all rows (of all chunks) belonging to this
hypertable.

### Deleting a Hypertable

It's just the standard `DROP TABLE` command, where TimescaleDB will
correspondingly delete all chunks belonging to the hypertable.
```sql
DROP TABLE conditions;
```

### Creating Indexes <a id="indexes"></a>

TimescaleDB supports the range of PostgreSQL index types, and creating, altering,
or dropping an index on the hypertable ([PostgreSQL docs][postgres-createindex])
will similarly be propagated to all its constituent chunks.

```sql
CREATE INDEX ON conditions (location, time DESC);
```

For more instructions and suggestions about indexing data within
TimescaleDB, as well as information about default indexes that
TimescaleDB automatically creates, [please see our indexing
discussion][indexing].

### Creating Triggers <a id="triggers"></a>

TimescaleDB supports the full range of PostgreSQL triggers, and creating,
altering, or dropping triggers on the hypertable will similarly
propagate these changes to all of a hypertable's constituent chunks.

In the following example, let's say you want to create a new
table `error_conditions` with the same schema as `conditions`, but designed
to only store records which are deemed erroneous, where an application
signals a sensor error by sending a `temperature` or `humidity` having a
value >= 1000.

So, we'll take a two-step approach. First, let's create a function that
will insert data deemed erroneous into this second table:

```sql
CREATE OR REPLACE FUNCTION record_error()
  RETURNS trigger AS $record_error$
BEGIN
 IF NEW.temperature >= 1000 OR NEW.humidity >= 1000 THEN
   INSERT INTO error_conditions
     VALUES(NEW.time, NEW.location, NEW.temperature, NEW.humidity);
 END IF;
 RETURN NEW;
END;
$record_error$ LANGUAGE plpgsql;
```
Second, create a trigger that will call this function whenever a new row is
inserted into the hypertable.

```sql
CREATE TRIGGER record_error
  BEFORE INSERT ON conditions
  FOR EACH ROW
  EXECUTE PROCEDURE record_error();
```
Now, all data is inserted into the `conditions` data, but any row deemed
erroneous is _also_ added to the `error_conditions` table.

TimescaleDB supports the full gamut of
triggers: `BEFORE INSERT`, `AFTER INSERT`, `BEFORE UPDATE`, `AFTER UPDATE`, `BEFORE DELETE`, `AFTER DELETE`.
For additional information, see the [PostgreSQL docs][postgres-createtrigger].

---

## INSERT Commands <a id="insert"></a>

Data can be inserted into a hypertable using the standard INSERT SQL command
([PostgreSQL docs][postgres-insert]).

```sql
INSERT INTO conditions(time, location, temperature, humidity)
  VALUES (NOW(), 'office', 70.0, 50.0);
```

You can also insert multiple rows into a hypertable using a single `INSERT` call,
even thousands at a time. This is typically much more efficient than
inserting data row-by-row, and is recommended when possible.

```sql
INSERT INTO conditions
  VALUES
    (NOW(), 'office', 70.0, 50.0),
    (NOW(), 'basement', 66.5, 60.0),
    (NOW(), 'garage', 77.0, 65.2);
```

>ttt The rows that belong to a single batch INSERT command do **not** need
to belong to the same chunk (by time interval or partitioning key).
Upon receiving an `INSERT` command for multiple rows, the TimescaleDB
engine will determine which rows (sub-batches) belong to which chunks,
and will write them accordingly to each chunk in a single transaction.

You can also specify that INSERT returns some or all of the inserted
data via the `RETURNING` statement:

```sql
INSERT INTO conditions
  VALUES (NOW(), 'office', 70.1, 50.1) RETURNING *;

             time              | location | temperature | humidity
-------------------------------+----------+-------------+----------
 2017-07-28 11:42:42.846621+00 | office   |        70.1 |     50.1
(1 row)
```

## UPDATE Commands <a id="update"></a>

Updates in TimescaleDB work as expected in standard SQL ([PostgreSQL docs][postgres-update]).

```sql
UPDATE conditions SET temperature = 70.2, humidity = 50.0
  WHERE time = '2017-07-28 11:42:42.846621+00' AND location = 'office';
```

An update command can touch many rows at once, i.e., the following
will modify all rows found in a 10-minute block of data.

```sql
UPDATE conditions SET temperature = temperature + 0.1
  WHERE time >= '2017-07-28 11:40' AND time < '2017-07-28 11:50';
```

>vvv TimescaleDB achieves much higher insert performance compared to
 vanilla PostgreSQL when inserts are localized to the most recent time
 interval (or two).  If your workload is heavily based on UPDATEs to old
 time intervals instead, you may observe significantly lower write
 throughput.

## UPSERT Functionality <a id="upsert"></a>

TimescaleDB supports UPSERTs in the same manner as PostgreSQL
via the optional `ON CONFLICT` clause ([PostgreSQL docs][postgres-upsert]).
If such a clause is provided, rather than cause an error,
an inserted row that
conflicts with another can either (a) do nothing or (b) result in a
subsequent update of that existing row.

In order to create a conflict, an insert must be performed on
identical value(s) in column(s) covered by a unique index or constraint. Such an
index is created automatically when marking column(s) as PRIMARY KEY
or with a UNIQUE constraint.

Following the examples given above, an INSERT with an identical
timestamp and location as an existing row will succeed and create an
additional row in the database.

If, however, the `conditions` table had been created with a UNIQUE
constraint defined on one or more of the columns (either at table
creation time or via an ALTER command):

```sql
CREATE TABLE conditions (
    time        TIMESTAMPTZ       NOT NULL,
    location    TEXT              NOT NULL,
    temperature DOUBLE PRECISION  NULL,
    humidity    DOUBLE PRECISION  NULL,
    UNIQUE (time, location)
);
```

then the second attempt to insert to this same time will normally
return an error.

The above `UNIQUE` statement during table creation internally is similar to:

```sql
CREATE UNIQUE INDEX on conditions (time, location);
```
Both of these result on a unique index for the table:
```sql
# \d+ conditions;
                              Table "public.conditions"
   Column    |           Type           | Modifiers | Storage  | Stats target | Description
-------------+--------------------------+-----------+----------+--------------+-------------
 time        | timestamp with time zone | not null  | plain    |              |
 location    | text                     | not null  | extended |              |
 temperature | double precision         |           | plain    |              |
 humidity    | double precision         |           | plain    |              |
Indexes:
    "conditions_time_location_idx" UNIQUE, btree ("time", location)
```
Now, however, the INSERT command can specify that nothing be done on
a conflict. This is particularly important when writing many rows as
one batch, as otherwise the entire transaction will fail (as opposed
to just skipping the row that conflicts).

```sql
INSERT INTO conditions
  VALUES ('2017-07-28 11:42:42.846621+00', 'office', 70.1, 50.0)
  ON CONFLICT DO NOTHING;
```

Alternatively, one can specify how to update the existing data:
```sql
INSERT INTO conditions
  VALUES ('2017-07-28 11:42:42.846621+00', 'office', 70.2, 50.1)
  ON CONFLICT (time, location) DO UPDATE
    SET temperature = excluded.temperature,
        humidity = excluded.humidity;
```

>ttt Unique constraints must include all partitioning keys as
 their prefix.  For example, if the table just uses time partitioning,
 the system requires `time` as the initial part of the
 constraint: `UNIQUE(time)`, `UNIQUE(time, location)`, etc.
 On the other hand, `UNIQUE(location)` is *not* a valid constraint.

>If the schema were to have an additional column like `device` that is used
 as an additional partition dimension, then the constraint would have
 to be `UNIQUE(time, device)` or `UNIQUE(time, device, location)`. In
 such scenarios then, `UNIQUE(time, location)` would *no longer* be
 a valid constraint.

<!-- -->
>vvv TimescaleDB does not yet support using `ON CONFLICT ON CONSTRAINT` with
 a named key (e.g., `conditions_time_location_idx`), but much of this
 functionality can be captured by specifying the same columns as above with
 a unique index/constraint. This limitation will be removed in a future version.


## SELECT Commands <a id="select"></a>

TimescaleDB supports **full SQL**.

Data can be queried from a hypertable using the standard SELECT SQL command
([PostgreSQL docs][postgres-select]), including with arbitrary WHERE clauses,
GROUP BY and ORDER BY commands, JOINS, subqueries, window functions,
user-defined functions (UDFs), HAVING clauses, and so on.

In other words, if you already know SQL&mdash;or use tools that speak SQL
or PostgreSQL&mdash;you already know how to use TimescaleDB.

From basic queries:

```sql
-- Return the last 100 entries written to the database
SELECT * FROM conditions LIMIT 100;

-- Return the more recent 100 entries by time order
SELECT * FROM conditions ORDER BY time DESC LIMIT 100;

-- Number of data entries written in past 12 hours
SELECT COUNT(*) FROM conditions
  WHERE time > NOW() - interval '12 hours';
```
To more advanced SQL queries:
```sql
-- Information about each 15-min period for each location
-- over the past 3 hours, ordered by time and temperature
SELECT time_bucket('15 minutes', time) AS fifteen_min,
    location, COUNT(*),
    MAX(temperature) AS max_temp,
    MAX(humidity) AS max_hum
  FROM conditions
  WHERE time > NOW() - interval '3 hours'
  GROUP BY fifteen_min, location
  ORDER BY fifteen_min DESC, max_temp DESC;


-- How many distinct locations with air conditioning
-- have reported data in the past day
SELECT COUNT(DISTINCT location) FROM conditions
  JOIN locations
    ON conditions.location = locations.location
  WHERE locations.air_conditioning = True
    AND time > NOW() - interval '1 day'
```

---

## Advanced Analytic Queries  <a id="advanced-analytics"></a>

TimescaleDB can be used for a variety of analytical queries, both through its
native support for PostgreSQL's full range of SQL functionality, as well as
additional functions added to TimescaleDB (both for ease-of-use and for better
query optimization).

The following list is just a sample of some of its analytical capabilities.

### Median/Percentile

PostgreSQL has inherent methods for determining median values and percentiles
namely the function `percentile_cont` ([PostgreSQL docs][percentile_cont]).  An example query
for the median temperature is:

```sql
SELECT percentile_cont(0.5)
  WITHIN GROUP (ORDER BY temperature)
  FROM conditions;
```

### Cumulative Sum

One way to determine cumulative sum is using the SQL
command `sum(sum(column)) OVER(ORDER BY group)`.  For example:

```sql
SELECT host, sum(sum(temperature)) OVER(ORDER BY location)
  FROM conditions
  GROUP BY location;
```

### Moving Average

For a simple moving average, you can use the `OVER` windowing function over
some number of rows, then compute an aggregation function over those rows. The
following computes the smoothed temperature of a device by averaging its last
10 readings together:

```sql
SELECT time, AVG(temperature) OVER(ORDER BY time
      ROWS BETWEEN 9 PRECEDING AND CURRENT ROW)
    AS smooth_temp
  FROM conditions
  WHERE location = 'garage' and time > NOW() - interval '1 day'
  ORDER BY time DESC;
```


### First, Last

TimescaleDB defines functions for `first` and `last`,
which allow you to get the value of one column as ordered by another.

```sql
SELECT location, last(temperature, time)
  FROM conditions
  GROUP BY location;
```
See our [API docs][first-last] for more details.

### Histogram

TimescaleDB also provides a [histogram][] function.
The following example defines a histogram with five buckets defined over
the range 60..85. The generated histogram has seven bins where the first
is for values below the minimun threshold of 60, the middle five bins are for
values in the stated range and the last is for values above 85.


```sql
SELECT location, COUNT(*),
    histogram(temperature, 60.0, 85.0, 5)
   FROM conditions
   WHERE time > NOW() - interval '7 days'
   GROUP BY location;
```
This query will output data in the following form:
```bash
 location   | count |        histogram
------------+-------+-------------------------
 office     | 10080 | {0,0,3860,6220,0,0,0}
 basement   | 10080 | {0,6056,4024,0,0,0,0}
 garage     | 10080 | {0,2679,957,2420,2150,1874,0}
```

What analytic functions are we missing?  [Let us know on github][issues].


[migrate-from-postgresql]: /setup/migrate-from-postgresql
[psql]:https://www.postgresql.org/docs/current/static/app-psql.html
[create_hypertable]: /api/api-timescaledb#create_hypertable
[postgres-createtable]:https://www.postgresql.org/docs/current/static/sql-createtable.html
[postgres-createindex]:https://www.postgresql.org/docs/current/static/sql-createindex.html
[postgres-createtrigger]:https://www.postgresql.org/docs/current/static/sql-createtrigger.html
[postgres-altertable]:https://www.postgresql.org/docs/current/static/sql-altertable.html
[postgres-insert]:https://www.postgresql.org/docs/current/static/sql-insert.html
[postgres-update]:https://www.postgresql.org/docs/current/static/sql-update.html
[postgres-upsert]:https://www.postgresql.org/docs/current/static/sql-insert.html#SQL-ON-CONFLICT
[postgres-select]:https://www.postgresql.org/docs/current/static/sql-select.html
[percentile_cont]:https://www.postgresql.org/docs/current/static/functions-aggregate.html#FUNCTIONS-ORDEREDSET-TABLE
[indexing]: /getting-started/basic-operations#indexing
[first-last]: /api/api-timescaledb#first-last
[issues]:https://github.com/timescale/timescaledb/issues
[histogram]:/api/api-timescaledb#histogram
