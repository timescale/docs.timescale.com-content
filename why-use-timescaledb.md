# Why use TimescaleDB?

## Compared to Postgres?

## Compared to NoSQL?

## When *not* to use TimescaleDB?

While TimescaleDB couples the power of SQL with the scale of NoSQL databases, it isn't necessarily the best tool for all time-series settings.

You might consider an alternative if:

- **Simple reads requirements**: If you simply want fast key-value lookups or single column rollups, an in-memory or column-oriented database might be more appropriate.  The former clearly does not scale to the same data volumes, however, while the latter's performance significantly underperforms for more complex queries.

- **Heavy compression** is a priority.  Benchmarks show TimescaleDB running on ZFS getting around 4x compression, but compression-optimized column stores might be more appropriate for higher compression rates.

- **Very sparse or unstructured data**: While TimescaleDB leverages Postgres' support for JSON/JSONB formats and handles sparsity quite efficiently (bitmaps for NULL values), schema-less architectures may be more appropriate in certain scenarios.

You should consider using TimescaleDB if:

- **Full SQL**: You want rich predicates, aggregates, time-oriented functions, windowing, CTEs, JOINs, etc.

- **Rich indexing**: Secondary indexes, various types of indexes (B-tree, hash, range, BRIN, GiST, GIN), geo-spatial indexing (PostGIS)

- **Mostly structured** data, either in a wide or narrow format [[more on data model](/introduction/data-model)]

- **Ecosystem**: Desire reliability, tooling, integrations of Postgres
