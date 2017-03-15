# Installation

Timescale is engineered up from PostgreSQL and is packaged as a PostgreSQL extension and set of scripts.

#### Prerequisites
- You will need the [Postgres][] client (psql).
<!-- TODO specify check for version -->
<!-- TODO specify that postgres client is not postgres full version?-->

There are two ways to install Timescale, each with different requirements:
1. Using a standard PostgreSQL installation with development environment (header files).

2. Building in a container using [Docker][].
---

[Postgres]: https://wiki.postgresql.org/wiki/Detailed_installation_guides
[Docker]: https://docs.docker.com/engine/installation/

### Option 1. Build and install with local PostgreSQL

```bash
# To build the extension
make

# To install
make install
```

### Option 2: Build and run in Docker

```bash
# To build a Docker image
make -f docker.mk build-image

# To run a container
make -f docker.mk run

# To run tests
make -f docker.mk test
```
---
You should now have Postgres running locally, accessible with
the following command:

```bash
# Connect to Postgres as a superuser named 'postgres'
psql -U postgres -h localhost
```

Next, we'll install our extension and create an initial database.

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
