# What is TimescaleDB?
TimescaleDB is an open source time-series database engineered up from
PostgreSQL, optimized for fast ingest and complex queries. Unlike
traditional RDBMS, TimescaleDB transparently scales-out horizontally
across multiple servers; unlike NoSQL databases, TimescaleDB natively
supports all of SQL. TimescaleDB is distributed under the [Apache 2
license](https://github.com/timescale/timescaledb/blob/master/LICENSE).

For more information, please check the [Frequently Asked Questions][FAQ].

For the source, please
check [our Github](https://github.com/timescale/timescaledb).

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

### Standard SQL

All data query, insert, and update actions in TimescaleDB can be
achieved via standard `SELECT`, `INSERT`, `UPDATE`, etc., SQL commands.


## Support

For help with topics not covered in this documentation, feel free to
reach out at <hello@timescaledb.com>.<!-- or join the Google Group[LINK].-->
