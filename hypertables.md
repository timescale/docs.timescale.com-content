# Hypertables

Commands to create, alter, or delete schemas in TimescaleDB are
identical to those in PostgreSQL.  Schema commands should be made to
the hypertable name, and any changes are propagated to all chunks
belonging to that hypertable.

### Create a Hypertable <a id="create"></a>

Creating a hypertable is a two-step process.
<!-- add steps format?-->
1. Create a standard table ([PostgreSQL docs][postgres-createtable]).
```sql
CREATE TABLE conditions (
    time        TIMESTAMPTZ       NOT NULL,
    location    TEXT              NOT NULL,
    temperature DOUBLE PRECISION  NULL
);
```

1. Then, execute the TimescaleDB `create_hypertable` command on this
newly created table ([API docs][create_hypertable]).

>vvv You can only convert a plain PostgreSQL table into a
  hypertable if it is currently empty.  Otherwise,
  the `create_hypertable` command will throw an error.  If you need
  to *migrate* data from an existing table to a hypertable, [follow these migration instructions instead][migrate-from-postgresql].

---

### Alter a Hypertable <a id="alter"></a>

You can execute standard `ALTER TABLE` commands against the hypertable ([PostgreSQL docs][postgres-createtable]).

```sql
ALTER TABLE conditions
  ADD COLUMN humidity DOUBLE PRECISION NULL;
```

TimescaleDB will then automatically propagate these schema changes to
the chunks that constitute this hypertable.

>vvv Altering a table's schema is quite efficient provided that its
default value is set to NULL.  If its default is a non-null value, TimescaleDB
will need to fill in this value into all rows (of all chunks) belonging to this
hypertable.

---

### Deleting a Hypertable <a id="delete"></a>

It's just the standard `DROP TABLE` command, where TimescaleDB will
correspondingly delete all chunks belonging to the hypertable.
```sql
DROP TABLE conditions;
```

---

### Best Practices <a id="best-practices"></a>

Users of TimescaleDB often have two common questions:

1. How large should I configure my intervals for time partitioning?
1. Should I use space partitioning, and how many space partitions should I use?

**Time intervals**: The current release of TimescaleDB does not
perform adaptive time intervals (although this is in the works).
So, users must configure it when creating their hypertable by
setting the `chunk_time_interval` (or use the default of 1 month).
The interval used for new chunks can be changed by calling `set_chunk_time_interval`.

The key property of choosing the time interval is that the chunk
belonging to the most recent interval (or chunks if using space
partitions) fit into memory.  As such, we typically recommend setting
the interval so that these chunk(s) comprise no more than 25% of main
memory.

To determine this, you roughly need to understand your data rate.  If
you are writing roughly 2GB of data per day and have 64GB of memory,
setting the time interval to a week would be good.  If you are writing
10GB per day on the same machine, setting the time interval to a day
would be appropriate.  This interval would also hold if data is loaded
more in batches, e.g., you bulk load 70GB of data per week, with data
corresponding to records from throughout the week.

While it's generally safer to make chunks smaller rather than too
large, setting intervals too small can lead to *many* chunks, which
corresponds to increased planning latency for some types of queries.

>ttt One caveat is that the total chunk size is actually dependent on
both the underlying data size *and* any indexes, so some care might be
taken if you make heavy use of expensive index types (e.g., some
PostGIS geospatial indexes).  During testing, you might check your
total chunk sizes via the [chunk relation size](#chunk_relation_size)
function.

**Space partitions**: The use of additional partitioning is a very
specialized use case.  **Most users will not need to use it.**

Space partitions use hashing: Every distinct item is hashed to one of
N buckets.  Remember that we are already using (flexible) time
intervals to manage chunk sizes; the main purpose of space
partitioning is to enable parallel I/O to the same time interval.

Parallel I/O can benefit in two scenarios: (a) two or more concurrent
queries should be able to read from different disks in parallel, or
(b) a single query should be able to use query parallelization to read
from multiple disks in parallel.

Note that query parallelization in PostgreSQL 9.6 (and 10) does not
support querying *different* hypertable chunks in parallel;
query parallelization only works on a single physical table (and thus
a single chunk). We might add our own support for this, but it is not
currently supported.

Thus, users looking for parallel I/O have two options:

1. Use a RAID setup across multiple physical disks, and expose a
single logical disk to the hypertable (i.e., via a single tablespace).

1. For each physical disk, add a separate tablespace to the
database.  TimescaleDB allows you to actually add multiple tablespaces
to a *single* hypertable (although under the covers, each underlying
chunk will be mapped by TimescaleDB to a single tablespace / physical
disk).

We recommend a RAID setup when possible, as it supports both forms of
parallelization described above (i.e., separate queries to separate
disks, single query to multiple disks in parallel).  The multiple
tablespace approach only supports the former.  With a RAID setup,
*no spatial partitioning is required*.

That said, when using space partitions, we recommend using 1
space partition per disk.

TimescaleDB does *not* benefit from a very large number of space
partitions (such as the number of unique items you expect in partition
field).  A very large number of such partitions leads both to poorer
per-partition load balancing (the mapping of items to partitions using
hashing), as well as much increased planning latency for some types of
queries.

[postgres-createtable]: https://www.postgresql.org/docs/9.6/static/sql-createtable.html
[create_hypertable]: /api#create_hypertable
[migrate-from-postgresql]: /getting-started/migrating-data
