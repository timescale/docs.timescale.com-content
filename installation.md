# Installation

TimescaleDB is packaged as a PostgreSQL extension and set of scripts.

There are two ways to install TimescaleDB: (1) Docker and (2) Postgres.

## Installation (from source)

_NOTE: Currently, upgrading to new versions requires a fresh install._

### Installation Options

#### Option 1 - Docker (recommended)

**Prerequisites**

- [Postgres client](https://wiki.postgresql.org/wiki/Detailed_installation_guides) (psql)

- [Docker](https://docs.docker.com/engine/installation/)

**Build and run in Docker**

```bash
# To build a Docker image
make -f docker.mk build-image

# To run a container
make -f docker.mk run
```

#### Option 2 - Postgres

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
# Modify postgresql.conf to add required libraries. For example,
shared_preload_libraries = 'dblink,timescaledb'

# Then, restart PostgreSQL
```

## Setting up your initial database
You have two options for setting up your initial database:
1. *Empty Database* - To set up a new, empty database, please follow the instructions below.

2. *Database with pre-loaded sample data* - To help you quickly get started, we have also created some sample datasets.
See [Sample Datasets][datasets] for further instructions. (Includes installing our extension.)

[datasets]: /other-sample-datasets

### Option 1. Setting up an empty database

When creating a new database, it is necessary to install the extension and then run an initialization function.  Here we will create a new database named "tutorial".

```bash
# Connect to Postgres as a superuser named 'postgres'
psql -U postgres -h localhost
```

```sql
-- Install the extension
CREATE database tutorial;

\c tutorial

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Run initialization function
select setup_db();
```

For convenience, this can also be done in one step by running a script from
the command-line:
```bash
DB_NAME=tutorial ./scripts/setup-db.sh
```

You should now have a brand new time-series database running in Postgres.
