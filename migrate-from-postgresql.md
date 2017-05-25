# Migrate from Postgres

## Your system

Depending on where your data is located, the steps to migrate are slightly different.  If you want to setup TimescaleDB on the same database in the same PostgreSQL instance as your migrating data [go here](#same-db).  If you want to migrate data from a different database or a different PostgreSQL instance altogether [go here](#different-db).

## Migrating from the same database <a id="same-db"></a>

For this example we'll assume that you have a table named `old_table` that you want to migrate to a table named `new_table`.  The steps are:

1. Create a new empty table with schema and other constraints based on the old one, using LIKE
1. Convert that table to a hypertable
1. Add any additional indexes needed.

### 1. Creating the new empty table

There are two ways to go about this step, one is more convenient, the other is more optimal.

#### Convenient method

This method auto-generates indexes on `new_table` when it is created so that when we convert it to a hypertable in the next step, we don't have to make them ourselves.  It avoids a step, but is much slower than the optimal method.

```sql
CREATE TABLE new_table (LIKE old_table INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
```

#### Optimal method

This method does not generate the indexes while making the table.  This works faster than the convenient method, but requires us to add the indexes after the hypertable is populated with data.

```sql
CREATE TABLE new_table (LIKE old_table INCLUDING DEFAULTS INCLUDING CONSTRAINTS EXCLUDING INDEXES);
```

### 2. Convert the new table to a hypertable

We use the TimescaleDB function [`create_hypertable`][create_hypertable] to convert `new_table` to a hypertable:

```sql
-- Assuming 'old_timey' is the time column for the dataset
SELECT create_hypertable('new_table', 'old_timey');
INSERT INTO new_table SELECT * FROM old_table;
```

### 3. Add additional indexes

If you used the convenient method, whatever indexes were on `old_table` are now on `new_table` so this step is optional. For the optimal `CREATE TABLE` method or for adding any indexes not on `old_table`:

```sql
CREATE INDEX on new_table (column_name, <options>)
```

Tada!  You did it!

---

## Migrating from a different database <a id="different-db"></a>

To migrate your database from PostgreSQL to TimescaleDB, you should have
`pg_dump` for exporting your schema and data.

Migration falls into three main steps:

1. Copying over the database schema and choosing which tables are hypertables
(i.e., those that currently have time-series data)
1. Backing up data to CSV
1. Importing the data into TimescaleDB

For this example we'll assume you have a PostgreSQL instance with a database
called `old_db` that contains a single table called `foo` that you want to
convert into a hypertable in a new database called `new_db`.  

### 1. Copying schema & setting up hypertables

Copying over your database schema is easily done with `pg_dump`:
```bash
pg_dump --schema-only -f old_db.bak old_db
```

This creates a backup file called `old_db.bak` that contains only the
SQL commands to recreate all the tables in `old_db`, which in this case is just
`foo`.

To create those tables in `new_db`:
```bash
psql -d new_db < old_db.bak
```

Now that we have the schema, we want to convert tables into hypertables
where appropriate. So let's connect with the client:
```bash
psql -d new_db
```
Then use the `create_hypertable()` function on the tables to make hypertables.
Due to a current limitation, this must be run on a table while it is empty, so
we do this before importing data. In this case, our hypertable target is
`foo` (using column `time` as the time partitioning column):
```sql
SELECT create_hypertable('foo', 'time');
```

Your new database is now ready for data.

### 2. Backing up data to CSV

To backup your data to CSV, we can run a `COPY`:

```bash
psql -d old_db -c "\COPY foo TO old_db.csv DELIMITER ',' CSV"
# This insures that foo outputs to a comma separated .csv file
```

Your data is now stored in a file called `old_db.csv`.

### 3. Import data into TimescaleDB

To put the data into the new table, let's run another `COPY`:

```bash
psql -d new_db -c "\COPY foo FROM old_db.csv CSV"
```

Once finished, your migration is complete!
