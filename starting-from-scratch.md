# Starting from an empty database

One of the core ideas of our time-series database are time-series optimized data
tables, called **hypertables**.

### Creating a (hyper)table
To create a hypertable, you start with a regular SQL table, and then convert
it into a hypertable via the function `create_hypertable()` ([API reference][]).

The following example creates a hypertable for tracking
temperature and humidity across a collection of devices over time.

```sql
-- We start by creating a regular SQL table

CREATE TABLE conditions (
  time        TIMESTAMPTZ       NOT NULL,
  location    TEXT              NOT NULL,
  temperature DOUBLE PRECISION  NULL,
  humidity    DOUBLE PRECISION  NULL
);
```

Next, transform it into a hypertable with `create_hypertable()`:

```sql
-- This creates a hypertable that is partitioned by time
--   using the values in the `time` column.

SELECT create_hypertable('conditions', 'time');

-- OR you can additionally partition the data on another dimension
--   (what we call 'space') such as `location`.
-- For example, to partition `location` into 2 partitions:

SELECT create_hypertable('conditions', 'time', 'location', 2);
```

**Next let's learn how to create and work with a [hypertable][], the primary
point of interaction for TimescaleDB.**

[hypertable]: /getting-started/basic-operations
[API Reference]: /api/api-timescaledb
