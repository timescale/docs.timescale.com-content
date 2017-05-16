# Architecture and concepts

## Terminology

### Hypertables
The primary point of interaction with your data is a **hypertable**,
the abstraction of a single continuous table across all
space and time
intervals, such that one can query it via vanilla SQL.

A hypertable is
defined by a standard schema with column names and types, with at
least one column specifying a time value, and one (optional) column specifying a “partitioning key” over which the
dataset can be additionally partitioned.

A single TimescaleDB deployment can store multiple hypertables, each
with different schemas.

Creating a hypertable in TimescaleDB is two SQL commands: `CREATE TABLE`
(with standard SQL syntax), followed by `SELECT create_hypertable()`.

### Chunks

Internally, TimescaleDB automatically splits each
hypertable into **chunks**, where a chunk corresponds to a
“two-dimensional” split according to a specific time interval and a region of the partition key’s space (e.g., using hashing).

Each chunk is
implemented using a standard database table that is automatically placed
on one of the database nodes (or replicated between multiple nodes),
although this detail is largely hidden from users.

Chunks are right-sized, ensuring that all of the B-trees for a table’s
indexes can reside in memory during inserts to avoid thrashing while
modifying arbitrary locations in those trees.

Further, by avoiding
overly large chunks, we can avoid expensive “vacuuming” operations when
removing deleted data according to automated retention policies, as the
runtime can perform such operations by simply dropping chunks (internal
tables), rather than deleting individual rows.

<!-- Illustration of reading/writing goes here -->

## Single node vs. clustering

## Motivation behind architecture choices

### Storing data on disk vs. in memory

A common problem with scaling database performance on a single machine is the significant cost/performance trade-off between memory and disk. While memory is faster than disk, it is much more expensive: about 20x costlier than solid-state storage like Flash, 100x more expensive than hard drives. Eventually, our entire dataset will not fit in memory, which is why we’ll need to write our data and indexes to disk.

This is an old, common problem for relational databases. In most cases, a table is stored as a collection of fixed-size pages of data (e.g., 8KB pages in PostgreSQL), on top of which the system builds data structures (such as B-trees) to index the data. With an index, a query can quickly find a row with a specified ID (e.g., bank account number) without scanning the entire table or “walking” the table in some sorted order.

Now, if the working set of data and indexes is small, we can keep it in memory.
But if the data is sufficiently large that we can’t fit all (similarly fixed-size) pages of our B-tree in memory, then updating a random part of the tree can involve significant disk I/O as we read pages from disk into memory, modify in memory, and then write back out to disk (when evicted to make room for other B-tree pages). And a relational database like PostgreSQL keeps a B-tree (or other data structure) for each table index, in order for values in that index to be found efficiently. So, the problem compounds as you index more columns.

In fact, because the database only accesses the disk in page-sized boundaries, even seemingly small updates can cause these swaps to occur: To change one cell, the database may need to swap out an existing 8KB page and write it back to disk, then read in the new page before modifying it.

Time-series data is treated very differently from standard online transaction processing (OLTP) data.

#### OLTP Writes
- Primarily UPDATES
- Randomly distributed (over the set of primary keys)
- Often transactions across multiple primary keys

#### Time-series Writes
- Primarily INSERTs
- Primarily to a recent time interval
- Primarily associated with both a timestamp and a separate primary key (e.g., server ID, device ID, security/account ID, vehicle/asset ID, etc.)

Each of the _chunks_ created by TimescaleDB is stored as a database table itself, and the DB query planner is aware of every chunk’s ranges (in time and keyspace). The query planner can now immediately tell to which chunk(s) an operation’s data belongs. (This applies both for inserting rows, as well as for pruning the set of chunks that need to be touched when executing queries.)
The key benefit of this approach is that now all of our indexes are built only across these much smaller chunks (tables), rather than a single table representing the entire dataset. So if we size these chunks properly, we can fit the latest tables (and their B-trees) completely in memory, and avoid this swap-to-disk problem, while maintaining support for multiple indexes.
