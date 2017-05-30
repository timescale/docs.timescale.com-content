# Migrate from PostgreSQL

### Your system

Depending on where your data is located, the steps to migrate are slightly
different.  If you want to setup TimescaleDB in the same database in the same
PostgreSQL instance as your migrating data [go here](#same-db).  If you want to
migrate data from a different database or a different PostgreSQL instance
altogether [go here](#different-db).  We assume that the new database has already been [setup][] with the timescale extension.

## Migrating from the same database <a id="same-db"></a>

For this example we'll assume that you have a table named `old_table` that you
want to migrate to a table named `new_table`.  The steps are:

1. Create a new empty table with the same table structure and other constraints
as the old one, using `LIKE`.
1. Convert the table to a hypertable and insert data from the old table.
1. Add any additional indexes needed.

### 1. Creating the new empty table

There are two ways to go about this step, one is more convenient, the other is
more optimal.

#### Convenient method

This method recreates `old_table` indexes on `new_table` when it is created so that
when we convert it to a hypertable in the next step, we don't have to make them
ourselves.  It avoids a step, but slows down the data transfer due to the need to
update the indexes for each migrated row.

```sql
CREATE TABLE new_table (LIKE old_table INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
```

#### Optimal method

This method does not generate the indexes while making the table.  This makes the data
transfer faster than the convenient method, but requires us to add the indexes as a
final step.

```sql
CREATE TABLE new_table (LIKE old_table INCLUDING DEFAULTS INCLUDING CONSTRAINTS EXCLUDING INDEXES);
```

### 2. Convert the new table to a hypertable

We use the TimescaleDB function [`create_hypertable`][create_hypertable] to
convert `new_table` to a hypertable, then simply `INSERT` data from the old table:

```sql
-- Assuming 'time' is the time column for the dataset
SELECT create_hypertable('new_table', 'time');
INSERT INTO new_table SELECT * FROM old_table;
```

### 3. Add additional indexes

If you used the convenient method, whatever indexes were on `old_table` are now
on `new_table` making this step optional. For the optimal `CREATE TABLE` method
or for adding any indexes not on `old_table`.  For info on the best ways to create
indexes, check out our [operations][] section:

```sql
CREATE INDEX on new_table (column_name, <options>)
```

Tada!  You did it!

[operations]:/getting-started/basic-operations
[create_hypertable]:/api/api-timescaledb#create_hypertable

---

## Migrating from a different database <a id="different-db"></a>

To migrate your database from PostgreSQL to TimescaleDB, you need
`pg_dump` for exporting your schema and data.

Migration falls into three main steps:

1. Copy over the database schema and choosing which tables will become
hypertables (i.e., those that currently have time-series data).
1. Backup data to comma-separated values (CSV).
1. Import the data into TimescaleDB

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

To put the data into the new table, let's run another `COPY`, this one to copy
data from the `.csv` into our new db:

```bash
psql -d new_db -c "\COPY foo FROM old_db.csv CSV"
```

Once finished, your migration is complete!

Now checkout some common [hypertable commands][] for exploring your data.

[setup]: /getting-started/setup
[hypertable commands]: /getting-started/basic-operations
