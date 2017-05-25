# Migrate from Postgres

## Your system

Depending on where your data is located, the steps to migrate are slightly different.  If you want to setup TimescaleDB on the same database in the same PostgreSQL instance as your migrating data [go here](#same-db).  If you want to migrate data from a different database or a different PostgreSQL instance altogether [go here](#different-db).

## Migrating from a different database <a id="different-db"></a>

### Prerequisites

To migrate your database from PostgreSQL to TimescaleDB, you should have
the following:

1. An up and running PostgreSQL instance with your current database
1. `pg_dump` for exporting your schema and data and the PostgreSQL client `psql`
for importing into your TimescaleDB database

## Migration

Migration falls into three main steps:

1. Copying over the database schema and choosing which tables are hypertables
(i.e., those that currently have time-series data)
1. Backing up data to CSV
1. Importing the data into TimescaleDB

For this example we'll assume you have a PostgreSQL instance with a database
called `old_db` that contains a single table called `foo` that you want to
convert into a hypertable in a new database called `new_db`.  If you want to

### 1. Copying schema & setting up hypertables

Copying over one's database schema is easily done with `pg_dump`:
```bash
pg_dump --schema-only -f old_db.bak old_db
```

This creates a backup file called `old_db.bak` that contains only the
SQL commands to create all the tables in `old_db`, which in this case is just
`foo`.

To create those tables in `new_db`:
```bash
psql -d new_db < old_db.bak
```

Now that you have the schema, you'll want to convert tables into hypertables
where appropriate. So connect with the client:
```bash
psql -d new_db
```
Then use the `create_hypertable()` function on the tables to make hypertables.
Due to a current limitation, this must be run on a table while it is empty, so
we do this before importing data. For this case, our hypertable target is
`foo` (using column `time` as the time partitioning column):
```sql
SELECT create_hypertable('foo', 'time');
```

Your new database is now ready for data.

### 2. Backing up data to CSV

To backup your data to CSV, run a `COPY`:
```bash
psql -d old_db -c '\COPY "foo" TO old_db.csv CSV'
```

Your data is now stored in a file called `old_db.csv`.

### 3. Import data into TimescaleDB

To get the most out of TimescaleDB, data needs to be imported in batches so
that chunks do not become overfull (a limitation we are currently addressing).
We provide a script in our main repository under `scripts`
called `migrate_data.sh` that will break up your CSV file into appropriate
sized batches and import them.

To run, provide the CSV file, database name, and table name. So using our
example:
```bash
./scripts/migrate-data.sh old_db.csv new_db foo
```

Once finished, your migration is complete!
