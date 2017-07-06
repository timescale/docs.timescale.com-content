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

## Schema Commands <a id="schema"></a>

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

### Creating Indexes

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
inserting data row-by-row, and is recommended in environments when possible.

```sql
INSERT INTO conditions(time, location, temperature, humidity)
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

---

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
  WHERE time = NOW() - interval '12 hours';
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
  WHERE time = NOW() - interval '3 hours'
  GROUP BY fifteen_min, location
  ORDER BY fifteen_min DESC, max_temp DESC;


-- How many distinct locations with air conditioning
-- have reported data in the past day
SELECT COUNT(DISTINCT location) FROM conditions
  JOIN locations
    ON conditions.location = locations.location
  WHERE locations.air_conditioning = True
    AND time = NOW() - interval '1 day'
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
  WHERE location = 'garage' and time > now() - '1 day'
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

TimescaleDB also supports PostgreSQL's PLpgSQL scripting language to define new
functions.  For the following example, we first created a `histogram` function
using the [code found here][histogram], which returns a histogram as an `array` type.

After cutting and pasting the code found in that example to the `psql`
command line, one can ask histogram questions about data.  The
following example defines a histogram with five buckets defined over
the range 60..85.

```sql
SELECT location, COUNT(*),
    histogram(temperature, 60.0, 85.0, 5)
  FROM conditions
  WHERE time > NOW() - '7 days'
  GROUP BY location;
```
This query will output data in the following form:
```bash
 location   | count |        histogram
------------+-------+-------------------------
 office     | 10080 | [0:5]={0,3860,6220,0,0}
 basement   | 10080 | [0:5]={6056,4024,0,0,0}
 garage     | 10080 | [0:5]={2679,957,2420,2150,1874}
```

(We plan to add native histogram support in the future.)

What analytic functions are we missing?  [Let us know on github][issues].

---

## Backup & Restore <a id="backup"></a>

In this section, we cover how to backup and restore an entire
database or individual hypertables using the native PostgreSQL
`pg_dump` ([PostgreSQL docs][pg_dump]) and `pg_restore`
([PostgreSQL docs][pg_restore]) commands.

>vvv You must use `pg_dump` and `pg_restore` versions 9.6.2 and above.

### Entire database

To backup a database named _tutorial_, run from the command line:

```bash
pg_dump -f tutorial.bak tutorial
```

Restoring data from a backup currently requires some additional procedures,
which need to be run from `psql`:
```sql
CREATE DATABASE tutorial;
ALTER DATABASE tutorial SET timescaledb.restoring='on';

-- execute the restore (or from a shell)
\! pg_restore -d tutorial tutorial.bak

-- connect to the restored db
\c tutorial
SELECT restore_timescaledb();
ALTER DATABASE tutorial SET timescaledb.restoring='off';
```

### Individual hypertables

Below is the procedure for performing a backup and restore of hypertable `foo`.

#### Backup

Backup the hypertable schema:
```bash
pg_dump -s -d old_db --table foo -N _timescaledb_internal | \
  grep -v _timescaledb_internal > schema.sql
```

Backup the hypertable data:
```bash
psql -d old_db \
-c "\COPY (SELECT * FROM foo) TO foo_data.csv DELIMITER ',' CSV"
```

#### Restore
Restore the schema:
```bash
psql -d new_db < schema.sql
```

Recreate the hypertables:
```bash
psql -d new_db -c "SELECT create_hypertable('foo', 'time')"
```

>ttt The parameters to `create_hypertable` do not need to be
the same as in the old db, so this is a good way to re-organize
your hypertables (e.g., change partitioning key, number of
partitions, chunk interval sizes, etc.).

Restore the data:
```bash
psql -d new_db -c "\COPY foo FROM foo_data.csv CSV"
```


[migrate-from-postgresql]: /setup/migrate-from-postgresql
[psql]:https://www.postgresql.org/docs/9.6/static/app-psql.html
[create_hypertable]: /api/api-timescaledb#create_hypertable
[postgres-createtable]:https://www.postgresql.org/docs/9.6/static/sql-createtable.html
[postgres-createindex]:https://www.postgresql.org/docs/9.6/static/sql-createindex.html
[postgres-altertable]:https://www.postgresql.org/docs/9.6/static/sql-altertable.html
[postgres-insert]:https://www.postgresql.org/docs/9.6/static/sql-insert.html
[postgres-select]:https://www.postgresql.org/docs/9.6/static/sql-select.html
[percentile_cont]:https://www.postgresql.org/docs/current/static/functions-aggregate.html#FUNCTIONS-ORDEREDSET-TABLE
[indexing]: /getting-started/basic-operations#indexing-data
[histogram]:https://wiki.postgresql.org/wiki/Aggregate_Histogram
[first-last]: /api/api-timescaledb#first-last
[issues]:https://github.com/timescale/timescaledb/issues
[pg_dump]:https://www.postgresql.org/docs/9.6/static/app-pgdump.html
[pg_restore]:https://www.postgresql.org/docs/9.6/static/app-pgrestore.html
