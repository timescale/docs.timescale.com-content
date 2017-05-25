# Setup

Ok, you have [installed][] TimescaleDB, and now you are ready to work with some data.  The first thing to do is to create a new empty database or convert an existing PostgreSQL database to a TimescaleDB.

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

## *** CYOA goes here (Start from scratch, Migrate from PostgreSQL, migrate from other data source)

[installed]: /getting-started/installation
