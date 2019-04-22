# Starting from an Empty Database

One of the core ideas of our time-series database is the time-series optimized data
table we call a **hypertable**.

### Creating a (Hyper)table
>:TIP: First make sure that you have properly [installed][] **AND [setup][]** TimescaleDB within your PostgreSQL instance.

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

-- OR you can additionally partition the data on another
--   dimension (what we call 'space partitioning').
-- E.g., to partition `location` into 4 partitions:

SELECT create_hypertable('conditions', 'time', 'location', 4);
```

For more information about how to choose the appropriate partitioning
for your data, see our [best practices discussion][].

**Next let's learn how to create and work with a [hypertable][], the primary
point of interaction for TimescaleDB.**

[installed]: /getting-started/installation
[setup]: /getting-started/setup
[hypertable]: /getting-started/basic-operations
[best practices discussion]: /api/api-timescaledb#create_hypertable-best-practices
[API Reference]: /api/api-timescaledb
