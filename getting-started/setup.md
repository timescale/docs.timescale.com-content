# Setup

Ok, you have [installed][] TimescaleDB, and now you are ready to work with some
data.  The first thing to do is to create a new empty database or convert an
existing PostgreSQL database to use TimescaleDB.

>:TIP: If you are planning on doing any performance testing on TimescaleDB, we
strongly recommend that you [configure][] TimescaleDB properly.

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

>:WARNING: Starting in v0.12.0, TimescaleDB enables [telemetry reporting][]
by default. You can opt-out by following the instructions detailed
in our [telemetry documentation][]. However, please do note that telemetry is
anonymous, and by keeping it on, you help us [improve our product][].

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
1. **[Migrate from PostgreSQL][migrate-postgres]**: You are currently
storing time-series data in a PostgreSQL database, and want to move this data
to a TimescaleDB hypertable.

---

[installed]: /getting-started/installation
[configure]: /getting-started/configuring
[telemetry reporting]: /api#get_telemetry_report
[telemetry documentation]: /using-timescaledb/telemetry
[improve our product]: https://www.timescale.com/blog/why-introduced-telemetry-in-timescaledb-2ed11014d95d/
[start-scratch]: /getting-started/creating-hypertables
[migrate-postgres]: /getting-started/migrating-data
