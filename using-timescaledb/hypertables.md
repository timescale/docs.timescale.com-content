# Hypertable Basics

Hypertables in TimescaleDB are designed to be easy to manage and to behave
predictibly to users familiar with standard PostgreSQL tables. Along those lines,
SQL commands to create, alter, or delete (hyper)tables in TimescaleDB are
identical to those in PostgreSQL.  Even though hypertables are comprised of many
interlinked "chunk" tables, commands made to the hypertable automatically propagate
changes down to all of the chunks belonging to that hypertable.

### Create a Hypertable [](create)

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

1. Then, execute the TimescaleDB [`create_hypertable`][create_hypertable] command on this
newly created table.

>:TIP: If you need to *migrate* data from an existing table to a hypertable, make
sure to set the `migrate_data` argument to `true` when calling the function.
If you would like finer control over index formation and other aspects
of your hypertable, [follow these migration instructions instead][migrate-from-postgresql].

<!-- -->
>:WARNING: The use of the `migrate_data` argument to convert a non-empty table can
lock the table for a significant amount of time, depending on how much data is
in the table.

>:TIP: The 'time' column used in the `create_hypertable` function supports
timestamp, date, or integer types, so you can use a parameter that is not
explicitly time-based, as long as it can increment.  For example, a
monotonically increasing id would work.

---

### Alter a Hypertable [](alter)

You can execute standard `ALTER TABLE` commands against the hypertable ([PostgreSQL docs][postgres-createtable]).

```sql
ALTER TABLE conditions
  ADD COLUMN humidity DOUBLE PRECISION NULL;
```

TimescaleDB will then automatically propagate these schema changes to
the chunks that constitute this hypertable.

>:WARNING: Altering a table's schema is quite efficient provided that the default
 value for any additional column is set to NULL.  If the default is set to a
 non-null value, TimescaleDB will need to fill in this value for all rows
 (of all chunks) belonging to this hypertable.

---

### Deleting a Hypertable [](drop)

It's just the standard `DROP TABLE` command, where TimescaleDB will
correspondingly delete all chunks belonging to the hypertable.
```sql
DROP TABLE conditions;
```

---

### Distributing a Hypertable across Multiple Nodes [](distributing)

Hypertables can be distributed over several nodes using the
[`create_distributed_hypertable`][create_distributed_hypertable]
command instead of the regular `create_hypertable` command. Note,
however, that this requires you to first configure a distributed
database by [adding one or more data nodes][add_data_node].


### Best Practices [](best-practices)

Users of TimescaleDB often have two common questions:

1. How large should I configure my intervals for time partitioning?
1. Should I use space partitioning, and how many space partitions should I use?

**Time intervals**:
Users can use the default time interval, which is 7 days starting in v0.11.0
and 1 month prior to v0.11.0.
Alternatively, users can explicitly configure time intervals by
setting `chunk_time_interval` when creating a hypertable.
After the hypertable has been created, the interval used for new chunks can be changed by calling `set_chunk_time_interval`.

The key property of choosing the time interval is that the chunk (including indexes) belonging to the most recent interval (or chunks if using space
partitions) fit into memory.  As such, we typically recommend setting
the interval so that these chunk(s) comprise no more than 25% of main
memory.

>:TIP: Make sure that you are planning for single chunks from _all_ active hypertables fit into 25% of main memory, rather than 25% per hypertable.

To determine this, you need to have a general idea of your data rate.  If
you are writing roughly 2GB of data per day and have 64GB of memory,
setting the time interval to a week would be good.  If you are writing
10GB per day on the same machine, setting the time interval to a day
would be appropriate.  This interval would also hold if data is loaded
more in batches, e.g., you bulk load 70GB of data per week, with data
corresponding to records from throughout the week.

While it's generally safer to make chunks smaller rather than too
large, setting intervals too small can lead to *many* chunks, which
corresponds to increased planning latency for some types of queries.

>:TIP: One caveat is that the total chunk size is actually dependent on
both the underlying data size *and* any indexes, so some care might be
taken if you make heavy use of expensive index types (e.g., some
PostGIS geospatial indexes).  During testing, you might check your
total chunk sizes via the [chunk relation size][chunk_relation_size]
function.

**Space partitions**: Space partitioning is optional but can make
sense for certain types of data and is recommended when using
distributed hypertables.

Space partitions use hashing: Every distinct item is hashed to one of
N buckets. In a distributed hypertable, each bucket of the primary
space dimension corresponds to a specific data node (although two or
more buckets could map to the same node). In non-distributed
hypertables, each bucket can map to a distinct disk (using, e.g., a
tablespace).

>:TIP: TimescaleDB does *not* benefit from a very large number of
space partitions (such as the number of unique items you expect in
partition field).  A very large number of such partitions leads both
to poorer per-partition load balancing (the mapping of items to
partitions using hashing), as well as increased planning latency
for some types of queries. We recommend tying the number of space
partitions to the number of disks and/or data nodes.

Spreading chunks along disks and nodes in the space dimension allows
for increased I/O parallelization, either by (a) having multiple
concurrent client processes, or, by (b) splitting the work of a single
client across multiple worker processes on a single node or multiple
concurrent requests across several data nodes.

In summary, to benefit from parallel I/O, one can do one of the
following:

- For each physical disk on a single instance, add a separate
tablespace to the database.  TimescaleDB actually allows you to add
multiple tablespaces to a *single* hypertable (although under the
covers, each underlying chunk will be mapped by TimescaleDB to a
single tablespace / physical disk).

- Configure a distributed hypertable that spreads inserts and queries
across multiple data nodes.

Apart from the built-in parallel I/O support in the database, a more
transparent way to increase I/O performance is to use a RAID setup
across multiple physical disks, and expose a single logical disk to
the hypertable (i.e., via a single tablespace). With a RAID setup, *no
spatial partitioning is required* on a single node.


[postgres-createtable]: https://www.postgresql.org/docs/9.6/static/sql-createtable.html
[add_data_node]: /api#add_data_node
[create_hypertable]: /api#create_hypertable
[create_distributed_hypertable]: /api#create_distributed_hypertable
[migrate-from-postgresql]: /getting-started/migrating-data
[chunk_relation_size]: /api#chunk_relation_size
