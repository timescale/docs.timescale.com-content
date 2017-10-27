# Schema management

## Indexing Data <a id="indexing"></a>

TimescaleDB supports the range of PostgreSQL index types, and creating, altering,
or dropping an index on the hypertable ([PostgreSQL docs][postgres-createindex])
will similarly be propagated to all its constituent chunks.

Data is indexed via the SQL `CREATE INDEX` command. For instance,
```sql
CREATE INDEX ON conditions (location, time DESC);
```
This can be done before or after converting the table to a hypertable.

### Indexing Suggestions

Our experience has shown that for time-series data, the most-useful index type
varies depending on your data.

For indexing columns with discrete (limited-cardinality) values (e.g., where you
are most likely to use an "equals" or "not equals" comparator) we suggest using
an index like this (using our hypertable `conditions` for the example):
```sql
CREATE INDEX ON conditions (location, time DESC);
```
For all other types of columns, i.e., columns with continuous values (e.g.,
where you are most likely to use a
"less than" or "greater than" comparator) the index should be in the form:
```sql
CREATE INDEX ON conditions (time DESC, temperature);
```
Having a `time DESC` column specification in the index allows for efficient
queries by column-value and time. For example, the index defined above would
optimize the following query:
```sql
SELECT * FROM conditions WHERE location = 'garage'
  ORDER BY time DESC LIMIT 10
```

For sparse data where a column is often NULL, we suggest adding
a `WHERE column IS NOT NULL` clause to the index (unless you are often
searching for missing data). For example,

```sql
CREATE INDEX ON conditions (time DESC, humidity)
  WHERE humidity IS NOT NULL;
```
this creates a more compact, and thus efficient, index.

>ttt <a id="unique_indexes"></a> To a define an index as UNIQUE or PRIMARY KEY, the time column and, if it
exists, the partitioning column **must** be the first (or first two)
columns that comprise the index.  That is, using our running
example, you can define a unique index on just the {time, location} fields,
or to include a third column (say, temperature), the index
must be specified as {time, location, temperature}.  That said, we
find UNIQUE indexes in time-series data to be much less prevalent than
in traditional relational data models.


### Default Indexes

By default, TimescaleDB automatically creates a time index on your data when a hypertable is created.

```sql
CREATE INDEX ON conditions (time DESC);
```

Additionally, if the `create_hypertable` command specifies an optional
"space partition" in addition to time (say, the `location` column),
TimescaleDB will automatically create the following index:

```sql
CREATE INDEX ON conditions (location, time DESC);
```

This default behavior can be overridden when executing the `create_hypertable` command
([see the API docs][create_hypertable]).

---

## Creating Triggers <a id="triggers"></a>

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

## Constraints

**Need text here**

---

## JSON

**Need text here**

---

## Maintenance

**Need text here**

[postgres-createindex]: https://www.postgresql.org/docs/9.6/static/sql-createindex.html
[create_hypertable]: /api#create_hypertable
[postgres-createtrigger]: https://www.postgresql.org/docs/9.6/static/sql-createtrigger.html
