# Architecture and concepts

TimescaleDB is implemented as an extension on PostgreSQL that provides hooks
deep into Postgres' query planner, data model, and execution engine.  This
allows TimescaleDB to expose what look like regular tables, but are actually
only an abstraction or a virtual view of many individual tables comprising the
actual data.

This single-table view, which we call a **hypertable**, is thus comprised of
many **chunks**.  Chunks are created by partitioning the hypertable's data in
either one or two dimensions:
by a time interval, and by an (optional) "partition key" such as
device ID, location, user id, etc.  We sometimes refer to this as
partitioning across "time and space".

## Terminology

### Hypertables
The primary point of interaction with your data is a hypertable,
the abstraction of a single continuous table across all space and time intervals,
such that one can query it via vanilla SQL.  

Virtually all user interactions with TimescaleDB are with hypertables. Creating
tables and indexes, altering tables, inserting data, selecting data, etc. can
(and should) all be executed on the hypertable.
[[Jump to basic SQL operations](/getting-started/basic-operations)]

A hypertable is defined by a standard schema with column names and
types, with at least one column specifying a time value, and
one (optional) column specifying an additional partitioning key.
See [data model](/introduction/data-model) for a further discussion of various
ways to organize data, depending on your use cases;
the simplest and most natural is in a "wide row" like many
relational databases.

A single TimescaleDB deployment can store multiple hypertables, each
with different schemas.

Creating a hypertable in TimescaleDB takes two simple SQL commands: 
`CREATE TABLE` (with standard SQL syntax), followed by `SELECT create_hypertable()`.  

Indexes on time and the partitioning key are automatically created on hypertables,
although additional indexes can also be created (and TimescaleDB supports the
full range of PostgreSQL index types).

### Chunks

Internally, TimescaleDB automatically splits each
hypertable into **chunks**, with each chunk corresponding to a specific time
interval and a region of the partition key’s space (using hashing).  
These partitions are disjoint (non-overlapping), which helps the query planner
to minimize the set of chunks it must touch to resolve a query.

Each chunk is implemented using a standard database table.  (In PostgreSQL
internals, the chunk is actually a a "child table" of the "parent" hypertable.)

Chunks are right-sized, ensuring that all of the B-trees for a table’s
indexes can reside in memory during inserts to avoid thrashing while
modifying arbitrary locations in those trees.

Further, by avoiding
overly large chunks, we can avoid expensive "vacuuming" operations when
removing deleted data according to automated retention policies, as the
runtime can perform such operations by simply dropping chunks (internal
tables), rather than deleting individual rows.


## Single node vs. clustering


TimescaleDB performs this extensive partitioning both on 
**single-node** deployments as well as **clustered** deployments (in
development).  While
partitioning is traditionally only used for scaling out across multiple
machines, it also allows us to scale up to high write rates (and improved
parallelized queries) even on single machines.

The current open-source release of TimescaleDB only supports single-node
deployments. Of note is that the single-node version of TimescaleDB has been
benchmarked to over 10-billion-row hypertables on commodity machines without
a loss in insert performance.

## Benefits of single-node partitioning <a id="benefits-chunking"></a>

A common problem with scaling database performance on a single machine
is the significant cost/performance trade-off between memory and disk.
Eventually, our entire dataset will not fit in memory, and we’ll need
to write our data and indexes to disk.

Once the data is sufficiently large that we can’t fit all pages of our indexes
(e.g., B-trees) in memory, then updating a random part of the tree can involve
swapping in data from disk.  And databases like PostgreSQL keep a B-tree (or
other data structure) for each table index, in order for values in that
index to be found efficiently. So, the problem compounds as you index more
columns.

But because each of the chunks created by TimescaleDB is itself stored as a
separate database table, all of its indexes are built only across these much
smaller tables rather than a single table representing the entire
dataset. So if we size these chunks properly, we can fit the latest tables
(and their B-trees) completely in memory, and avoid this swap-to-disk problem,
while maintaining support for multiple indexes.

For more on the motivation and design of TimescaleDB's adaptive space/time
chunking, please see our [technical blog post][chunking].

[hypertables]: /introduction/architecture#hypertables-and-chunks
[chunking]: https://blog.timescale.com/time-series-data-why-and-how-to-use-a-relational-database-instead-of-nosql-d0cd6975e87c#2362

<!--- Picture of blog post -->

**Next:** Benefits of this architecture design? [TimescaleDB vs. PostgreSQL](/introduction/timescaledb-vs-postgres)
