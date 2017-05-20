<!---
# Overview
## What is time-series data?  (AK)
## Metrics, sensor data, events.  Regular and irregular.   Narrow vs. wide
## Data model (AK)
## Wide rows
## How to store metrics in Timescale
# Architecture, Concepts  (MJF)
## Terminology:  Hypertable & chunks
## Illustration of reading/writing data
## Single-node vs. clustering
## Why did we take this architecture?  (from blog post)
# Why use timescale (MJF)
## Compared to Postgres?
## Compared to NoSQL
## When not to use timescale?
-->

# TimescaleDB is...

## ⇒ Easy to Use

- **Full SQL interface** for all SQL natively supported by
    PostgreSQL (including secondary indexes, non-time based aggregates, sub-queries,
    JOINs, window functions)

- **Connects** to any client or tool that speaks PostgreSQL, no changes needed

- **Time-oriented** features, API functions, and optimizations

- **Data retention policies** support


## ⇒ Scalable

- **Transparent time/space partitioning** for both scaling up (single node) and scaling out (forthcoming)

- **High data write rates** (including batched commits, in-memory
indexes, transactional support, support for data backfill)

- **Right-sized chunks** (two-dimensional data partitions) on single nodes to ensure fast ingest even at large data sizes

- **Parallelized operations** across chunks and servers

## ⇒ Reliable

- **Engineered up** from PostgreSQL, packaged as an extension

- **Proven foundations** benefiting from 20+ years of PostgreSQL
research (including streaming replication, backups)

- **Flexible management options** (compatible with existing PostgreSQL
ecosystem and tooling)

This section describes the design and motivation around TimescaleDb's architecture, including why time-series data is different, and how we leverage its characteristics when building TimescaleDB.

**Next:**  So in part to understand TimescaleDB's design choices: [What is time-series data?](/introduction/time-series)
