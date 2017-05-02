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

### Option 1 - Homebrew <a id="homebrew"></a>

This will install both TimescaleDB *AND* PostgreSQL 9.6 via Homebrew. If you have another PostgreSQL installation (such as through Postgres.app), this will cause problems. If you wish to maintain your current version of PostgreSQL outside of Homebrew we
recommend [installing from source][source].  Otherwise please be sure to remove non-Homebrew installations before using this method.

**Prerequisites**

- [Homebrew](https://brew.sh/)

**Build and install**

```bash
# Add our tap
brew tap timescale/tap

# To install
brew install timescaledb
```

**Update `postgresql.conf`**

Also, you will need to edit your `postgresql.conf` file to include
necessary libraries:
```bash
# Modify postgresql.conf to uncomment this line and add required libraries.
# For example:
shared_preload_libraries = 'timescaledb'
```

To get started you'll now need to restart PostgreSQL and add a
`postgres` superuser (used in the rest of the docs):
```bash
# Restart PostgreSQL
brew services restart postgresql

# Add a superuser postgres:
createuser postgres -s
```

### Option 2 - Docker Hub <a id="docker"></a>

You can pull our Docker images from [Docker Hub](https://hub.docker.com/r/timescale/timescaledb/).

```bash
docker pull timescale/timescaledb:latest
```

To run, you'll need to specify a directory where data should be
stored/mounted from on the host machine. For example, if you want
to store the data in `/your/data/dir` on the host machine:
```bash
docker run -d \
  --name timescaledb \
  -v /your/data/dir:/var/lib/postgresql/data \
  -p 5432:5432 \
  -e PGDATA=/var/lib/postgresql/data/timescaledb \
  timescale/timescaledb postgres \
  -cshared_preload_libraries=timescaledb
```
In particular, the `-v` flag sets where the data is stored. If not set,
the data will be dropped when the container is stopped.

You can write the above command to a shell script for easy use, or use
our [docker-run.sh][] in the `scripts/` of our github repo, which saves
the data to `$PWD/data`. There you can also see additional `-c` flags
we recommend for memory settings, etc.

### Option 3 - From source <a id="source"></a>
We have only tested our build process on **MacOS and Linux**. We do
not support building on Windows yet. Windows may be able to use our
Docker image on Docker Hub (see above).

**Prerequisites**

- A standard **PostgreSQL 9.6** installation with development environment (header files) (e.g., [Postgres.app for MacOS](https://postgresapp.com/))

**Build and install with local PostgreSQL**

```bash
# To build the extension
make

# To install
make install
```

**Update `postgresql.conf`**

Also, you will need to edit your `postgresql.conf` file to include
necessary libraries, and then restart PostgreSQL:
```bash
# locate your postgresql.conf file
-psql -d postgres -c "SHOW config_file;"

# Modify postgresql.conf to add required libraries.
# For example:
shared_preload_libraries = 'timescaledb'

# Then, restart PostgreSQL
```
*Note*: The `shared_preload_libraries` line is commented out by default.  Make sure to uncomment it when adding our library.

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
[API Reference]: /api-docs
[Basic operations]: /getting-started/basic-operations
