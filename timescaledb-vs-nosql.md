# Why Use TimescaleDB over NoSQL?

Compared to general NoSQL databases (e.g., MongoDB, Cassandra) or even
more specialized time-oriented ones (e.g., InfluxDB, KairosDB),
TimescaleDB provides both qualitative and quantitative differences:

- **Normal SQL**: TimescaleDB gives you the power of standard SQL
  queries on time-series data, even at scale.  Most (all?) NoSQL
  databases require learning either a new query language or using
  something that's at best "SQL-ish" (which still breaks compatibility
  with existing tools).
- **Operational simplicity**:  With TimescaleDB, you only need to manage one
  database for your relational and time-series data.  Otherwise, users
  often need to silo data into two databases: a "normal" relational
  one, and a second time-series one.
- **JOINs** can be performed across relational and time-series data.
- **Query performance** is faster for a varied set
  of queries.  More complex queries are often slow or full table scans
  on NoSQL databases, while some databases can't even support many
  natural queries.
- **Manage like PostgreSQL** and inherit its support for varied datatypes and
  indexes (B-tree, hash, range, BRIN, GiST, GIN).
- **Native support for geospatial data**: Data stored in TimescaleDB
  can leverage PostGIS's geometric datatypes, indexes, and queries.
- **Third-party tools**: TimescaleDB supports anything that speaks
  SQL, including BI tools like Tableau.

## When *Not* to Use TimescaleDB?

Then again, if any of the following is true, you might not want to use TimescaleDB:

- **Simple read requirements**: If you simply want fast key-value
lookups or single column rollups, an in-memory or column-oriented
database might be more appropriate.  The former clearly does not scale
to the same data volumes, however, while the latter's performance
significantly underperforms for more complex queries.
- **Very sparse or unstructured data**: While TimescaleDB leverages PostgreSQL
support for JSON/JSONB formats and handles sparsity quite efficiently (bitmaps
for NULL values), schema-less architectures may be more appropriate in
certain scenarios.
- **Heavy compression is a priority**:  Benchmarks show TimescaleDB running on
ZFS getting around 4x compression, but compression-optimized column stores might
be more appropriate for higher compression rates.
- **Infrequent or offline analysis**: If slow response times are
acceptable (or fast response times limited to a small number of
pre-computed metrics), and if you don't expect many applications/users
to access that data concurrently, you might avoid using a database at
all and instead just store data in an distributed file system.
