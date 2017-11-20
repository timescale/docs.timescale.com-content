# Migrating Data
>ttt First make sure that you have properly [installed][] AND [setup][] your Timescale database within your PostgreSQL instance.

## Migration from PostgreSQL

Depending on where your data is currently stored,
the steps to migrate it to TimescaleDB are slightly different.

- **Same database**:  If you want to setup TimescaleDB in the
same database in the same PostgreSQL instance as your stored
data, [follow these instructions](#same-db).

- **Different database**: If you want to migrate data from
a different database or a different PostgreSQL instance
altogether, [follow these instructions](#different-db).

## Migrating from the Same Database <a id="same-db"></a>

For this example we'll assume that you have a table named `old_table` that you
want to migrate to a table named `new_table`.  The steps are:

1. Create a new empty table with the same table structure and other constraints
as the old one, using `LIKE`.
1. Convert the table to a hypertable and insert data from the old table.
1. Add any additional indexes needed.

### 1. Creating the New Empty Table

There are two ways to go about this step: one more convenient, the other faster.

#### Convenient Method

This method recreates `old_table` indexes on `new_table` when it is created so that
when we convert it to a hypertable in the next step, we don't have to make them
ourselves.  It avoids a step, but slows down the data transfer due to the need to
update the indexes for each migrated row.

```sql
CREATE TABLE new_table (LIKE old_table INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
```

#### Faster Method

This method does not generate the indexes while making the table.  This makes the data
transfer faster than the convenient method, but requires us to add the indexes as a
final step.

```sql
CREATE TABLE new_table (LIKE old_table INCLUDING DEFAULTS INCLUDING CONSTRAINTS EXCLUDING INDEXES);
```

### 2. Convert the New Table to a Hypertable

We use the TimescaleDB function [`create_hypertable`][create_hypertable] to
convert `new_table` to a hypertable, then simply `INSERT` data from the old table:

```sql
-- Assuming 'time' is the time column for the dataset
SELECT create_hypertable('new_table', 'time');

-- Insert everything from old_table
INSERT INTO new_table SELECT * FROM old_table;
```

>vvv `create_hypertable` may fail if invalid UNIQUE or PRIMARY
KEY indexes existed on the old table (see
this [note][unique_indexes]).
In this case, you would have to reconfigure your indexes
and/or schema.

### 3. Add Additional Indexes

If you used the convenient method, whatever indexes were on `old_table` are now
on `new_table` making this step optional. For the faster `CREATE TABLE` method
or for adding any indexes not on `old_table`, you need to add indexes to
this hypertable.

```sql
CREATE INDEX on new_table (column_name, <options>)
```

Tada!  You did it!

For more info on the best strategies for indexing, check out
our [schema management][indexing] section.

---

## Migrating from a Different Database <a id="different-db"></a>

To migrate your database from PostgreSQL to TimescaleDB, you
need `pg_dump` for exporting your schema and data.

Migration falls into three main steps:

1. Copy over the database schema and choose which tables will become
hypertables (i.e., those that currently have time-series data).
1. Backup data to comma-separated values (CSV).
1. Import the data into TimescaleDB

For this example we'll assume you have a PostgreSQL instance with a database
called `old_db` that contains a single table called `conditions` that you want to
convert into a hypertable in a new database called `new_db`.

### 1. Copying Schema & Setting up Hypertables

Copying over your database schema is easily done with `pg_dump`:
```bash
pg_dump --schema-only -f old_db.bak old_db
```

This creates a backup file called `old_db.bak` that contains only the
SQL commands to recreate all the tables in `old_db`, which in this case
is just `conditions`.

To create those tables in `new_db`:
```bash
psql -d new_db < old_db.bak
```

Now that we have the schema, we want to convert tables into hypertables
where appropriate. So let's connect with the client:
```bash
psql -d new_db
```
Then use the `create_hypertable` function on the tables to make hypertables.
Due to a current limitation, this must be run on a table while it is empty, so
we do this before importing data.
In this case, our hypertable target is `conditions` (using
column `time` as the time partitioning column):
```sql
SELECT create_hypertable('conditions', 'time');
```

Your new database is now ready for data.

### 2. Backing up Data to CSV

To backup your data to CSV, we can run a `COPY`:

```bash
# The following ensures 'conditions' outputs to a comma-separated .csv file
psql -d old_db -c "\COPY (SELECT * FROM conditions) TO old_db.csv DELIMITER ',' CSV"
```

Your data is now stored in a file called `old_db.csv`.

### 3. Import Data into TimescaleDB

To put the data into the new table, let's run another `COPY`, this one to copy
data from the `.csv` into our new db:

```bash
psql -d new_db -c "\COPY conditions FROM old_db.csv CSV"
```

Once finished, your migration is complete!

>ttt The standard `COPY` command in PostgreSQL is single threaded.
 So to speed up importing larger amounts of data, we recommend using
 our [parallel importer][] instead.

Now checkout some common [hypertable commands][] for exploring your data.

[installed]: /getting-started/installation
[setup]: /getting-started/setup
[create_hypertable]: /api#create_hypertable
[unique_indexes]: /using-timescaledb/schema-management#unique_indexes
[indexing]: /using-timescaledb/schema-management#indexing
[parallel importer]: https://github.com/timescale/timescaledb-parallel-copy
[hypertable commands]: /using-timescaledb/hypertables
