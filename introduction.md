# What is TimescaleDB?
TimescaleDB is an open source time-series database engineered up from
PostgreSQL, optimized for fast ingest and complex queries. Unlike
traditional RDBMS, TimescaleDB transparently scales-out horizontally
across multiple servers; unlike NoSQL databases, TimescaleDB natively
supports all of SQL. TimescaleDB is distributed under the [Apache 2
license](https://github.com/timescaledb/timescaledb/blob/master/LICENSE).

For more information, please check the [Frequently Asked Questions][FAQ].

For the source, please
check [our Github](https://github.com/timescaledb/timescaledb).

## Key Features
- **Transparent time/space partitioning** for horizontal scale-out
- **Full SQL interface** that can process all SQL natively supported by
PostgreSQL (including secondary indexes, non-time based aggregates,
JOINs, window functions)
- **High data write rates** (including batched commits, in-memory
indexes, transactional support, support for data backfill)
- **Right-sized chunks** (two-dimensional data partitions) on single-nodes
- **Parallelized operations** across chunks and servers
- **Flexible management options** (compatible with existing PostgreSQL
ecosystem and tooling)
- **Proven reliability** benefiting from 20+ years of PostgreSQL
research (including streaming replication, backups)
- **Data retention policies**

## Installation
TimescaleDB is packaged as a PostgreSQL extension. Installation within
an existing PostgreSQL node only requires two simple SQL commands:
```sql
-- Install the extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Run initialization function
select setup_timescaledb();
```

More information in our [Getting Started][] section.

[Getting Started]: /getting-started
[FAQ]: /faq

## Key Concepts

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

### Standard SQL

All data query, insert, and update actions in TimescaleDB can be
achieved via standard `SELECT`, `INSERT`, `UPDATE`, etc., SQL commands.


## Support

For help with topics not covered in this documentation, feel free to
reach out at <hello@timescaledb.com>.<!-- or join the Google Group[LINK].-->
