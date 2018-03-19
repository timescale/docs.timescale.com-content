# Setup

Ok, you have [installed][] TimescaleDB, and now you are ready to work with some
data.  The first thing to do is to create a new empty database or convert an
existing PostgreSQL database to use TimescaleDB.

<img class="main-content__illustration" style="margin: 0 5% 0 10%;" src="https://assets.iobeam.com/images/docs/illustration-setup.svg" alt="setup illustration"/>

First connect to the PostgreSQL instance:

```bash
# Connect to PostgreSQL, using a superuser named 'postgres'
psql -U postgres -h localhost
```

Now create a new empty database (skip this if you already have a database):

```sql
-- Create the database, let's call it 'tutorial'
CREATE database tutorial;
```

Lastly add TimescaleDB:

```sql
-- Connect to the database
\c tutorial

-- Extend the database with TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
```

_That's it!_  Connecting to the new database is as simple as:

```bash
psql -U postgres -h localhost -d tutorial
```

---

From here, you will create a TimescaleDB hypertable using one of the
following options:

1. **[Start from scratch][start-scratch]**: You don't currently have
any data, and just want to create an empty hypertable for inserting
data.
1. **[Migrate from Postgres][migrate-postgres]**: You are currently
storing time-series data in Postgres, and want to move this data to a
TimescaleDB hypertable.

[installed]: /getting-started/installation
[start-scratch]: /getting-started/creating-hypertables
[migrate-postgres]: /getting-started/migrating-data
