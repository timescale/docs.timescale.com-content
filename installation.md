TimescaleDB is an open-source database designed to make SQL scalable for
time-series data. It is engineered up from PostgreSQL, providing automatic
partitioning across time and space (partitioning key), as well as full
SQL support.

TimescaleDB is packaged as a PostgreSQL extension and set of scripts.

For a more detailed description of our architecture, [please read
the technical
paper](http://www.timescaledb.com/papers/timescaledb.pdf)

There are several ways to install TimescaleDB:
1. [Homebrew](#homebrew) (for MacOS),
1. [Docker](#docker), or
1. From [source][].

### Supported platforms

Currently TimescaleDB supports MacOS/OSX and Unix for all [platforms supported by PostgreSQL][platforms].  Windows is not directly supported, but may work indirectly using the Docker installation method (see below).

## Installation

_NOTE: Currently, upgrading to new versions requires a fresh install._

*** Choose your own adventure goes here

### Setting up your initial database
Now, we'll install our extension and create an initial database. Below
you'll find instructions for creating a new, empty database.

To help you quickly get started, we have also created some sample
datasets. Once you complete the initial setup below you can then
easily import this data to play around with TimescaleDB functionality.
See [our Sample Datasets][datasets]
for further instructions.

#### Setting up an empty database

When creating a new database, it is necessary to install the extension and then run an initialization function.

```bash
# Connect to Postgres, using a superuser named 'postgres'
psql -U postgres -h localhost
```

```sql
-- Install the extension
CREATE database tutorial;
\c tutorial
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Run initialization function
SELECT setup_timescaledb();
```

For convenience, this can also be done in one step by running a script from
the command-line:
```bash
DB_NAME=tutorial ./scripts/setup-db.sh
```

#### Accessing your new database
You should now have a brand new time-series database running in Postgres.

```bash
# To access your new database
psql -U postgres -h localhost -d tutorial
```

Next let's learn some of the [Basic operations][] available to TimescaleDB.



### Caveats
Below are a few issues with the database that we are working on as we move out of beta:

- All users have full read/write access to the metadata tables for hypertables.
- Permission changes on hypertables are not correctly propagated.
- `create_hypertable()` can only be run on an empty table.
- Custom user-created triggers on hypertables currently not allowed.
- `drop_chunks()` (see our [API Reference][]) is currently only
supported for hypertables that are not partitioned by space.

### More APIs
For more information on TimescaleDB's APIs, check out our
[API Reference][].


[platforms]: https://www.postgresql.org/docs/9.5/static/supported-platforms.html
[source]: /getting-started/installation#source
[datasets]: /getting-started/other-sample-datasets
[docker-run.sh]: https://github.com/timescale/timescaledb/blob/master/scripts/docker-run.sh
[API Reference]: /timescaledb-api
[Basic operations]: /getting-started/basic-operations
