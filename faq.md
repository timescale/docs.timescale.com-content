# FAQ <a id="top"></a>

>toplist
> ### Questions
> - [What is TimescaleDB?](#what)
> - [Why build another time-series database?](#why-build)
> - [Why should I use TimescaleDB?](#why-use)
> - [Do you really support "all of SQL"](#sql-support)
> - [Why SQL?](#why-sql)
> - [What SQL features are supported (JOIN)?](#sql-features)
> - [How do I write data?](#write)
> - [How do I read data?](#read)
> - [Is there a clustered version and how can I try it?](#clustered)
> - [How far can TimescaleDB scale?](#scaling)
> - [How does TimescaleDB scale?](#how-scaling)
> - [What are hypertables and chunks?](#hypertable-chunks)
> - [How are hypertable chunks determined across the space dimension (partition keys)?](#partitions)
> - [How should I configure chunking?](#partitions-best-practice)
> - [Why would I use TimescaleDB over vanilla PostgreSQL?](#vs-postgresql)
> - [How compatible is TimescaleDB with PostgreSQL?](#postgresql-compatibility)
> - [How does TimescaleDB handle geospatial data?](#geo-spatial)
> - [What can I use TimescaleDB for?](#what-for)
> - [When is TimescaleDB a good choice?](#when-good)
> - [When is TimescaleDB not a good choice?](#when-less-good)
> - [What is the TimescaleDB open-source license?](#license)
> - [Is there a TimescaleDB community or group I can join?](#community)
> - [Can I get support or a commercial license?](#license-commercial)
> - [Where can I get TimescaleDB source code?](#where)
> - [How do I install TimescaleDB?](#install)
> - [How do I update an existing installation?](#update)


### **What is TimescaleDB?** <a id="what"></a>

TimescaleDB is an open source time-series database optimized
for fast ingest and complex queries. It speaks "full SQL" and is
correspondingly easy to use like a traditional relational database,
yet scales in ways previously reserved for NoSQL databases.TimescaleDB
is distributed under the Apache 2.0 license. [[Top]](#top)

### **Why build another time-series database?** <a id="why-build"></a>
Time-series data is cropping up in more and more places: monitoring and DevOps,
sensor data and IoT, financial data, logistics data, app usage data, and more.
Often this data is high in volume and complex in nature (e.g., multiple
measurements and labels associated with a single time). This means that storing
time-series data demands both scale and efficient complex queries. Yet achieving
both of these properties has remained elusive. Users have typically been faced
with the trade-off between the horizontally scalability of NoSQL and the query
power of relational databases. We needed something that offered both, so we
built it. [[Top]](#top)

### **Why should I use TimescaleDB?** <a id="why-use"></a>
As time becomes a more critical dimension along which data is measured,
TimescaleDB enables developers and organizations to harness more of its power:
analyzing the past, understanding the present, and predicting the future.
Unifying time-series data and relational data at the query level removes data
silos, and makes demos and prototypes easier to get off the ground. The
combination of scalability and a full SQL interface empowers a broad variety of
people across an organization (e.g., developers, product managers, business
analysts, etc.) to directly ask questions of the data. In other words, by
supporting a query language already in wide use, TimescaleDB ensures that your
questions are limited by your imagination, not the database. [[Top]](#top)

### **Do you really support “all of SQL”?** <a id="sql-support"></a>
Yes, all of SQL, including: secondary indices, JOINs, window functions. In fact,
to the outside world, TimescaleDB looks like a PostgreSQL database: You connect
to the database as if it's PostgreSQL, and you can administer the database as if
it's PostgreSQL. Any tools and libraries that connect with PostgreSQL will
automatically work with TimescaleDB. [[Top]](#top)

### **Why SQL?** <a id="why-sql"></a>
SQL is the most widely-used query language in the world for interacting with a
database and manipulating data. We wanted TimescaleDB to be easy to use and powerful.
Because SQL is so widely-used, it allows an entire organization to access their data,
lending different perspectives to the analysis of that data and empowering people
in their respective roles. It also allows for easy migration of data residing in
a regular PostgreSQL database. Put another way: we wanted to ensure that your
queries were only limited by your imagination, not by the query language. [[Top]](#top)

### **What SQL features are supported?** <a id="sql-features"></a>
We support all of SQL, including secondary indices, complex predicates, JOINs,
window functions, etc. We optimize many SQL queries that are often useful in
time-based analysis as well as
introduce [entirely new SQL queries that are unique to TimescaleDB][api]. [[Top]](#top)

### **How do I write data?** <a id="write"></a>
Just via normal SQL, but here are some [insert examples][INSERT]. [[Top]](#top)
### **How do I read data?** <a id="read"></a>
Just via normal SQL, but here are some [query examples][SELECT]. [[Top]](#top)

### **Is there a clustered version and how can I try it?** <a id="clustered"></a>
A clustered version is actively being developed.
If you'd like to learn more, please contact us at hello@timescale.com.
In the meantime, please read the two questions below about the extent of
TimescaleDB's single-node scalability. [[Top]](#top)

### **How far can TimescaleDB scale?** <a id="scaling"></a>
We've first focused on scaling TimescaleDB up on a single node, which you can read
about in the next question. On our internal benchmarks, we have consistently
scaled TimescaleDB 10+ billion rows, while sustaining insert rates of 100-200k
rows / second (or 1-2 million metric inserts / second). That said, the principal
design decisions implemented
for scaling up are the same for allowing TimescaleDB to scale out horizontally in a
linear fashion across many servers. When clustering is released, all servers can
receive and process queries, and store data; TimescaleDB will not use any specialized
primary server or transaction coordination. It is designed to combine the scalability
of popular NoSQL databases, with the native query complexity supported by RDBMS systems. [[Top]](#top)

### **How does TimescaleDB scale?** <a id="how-scaling"></a>
TimescaleDB's architecture leverages two key properties of time-series data:

* Time-series data is largely immutable. New data continually arrives, typically
as writes (inserts) to the latest time intervals, not as updates to existing records.
* Workloads have a natural partitioning across both time and space.

TimescaleDB leverages these properties by automatically partitioning data into
two-dimensional chunks, performing parallelized operations and optimized query
planning across all chunks, and exposing a single table interface to this
data (a “hypertable”). For more information, see this blog
post: [Time-series data: Why (and how) to use a relational database instead of NoSQL][rdbms > nosql]. [[Top]](#top)

### **What are hypertables and chunks?** <a id="hypertable-chunks"></a>
[Our technical paper goes into these design elements][tech-paper]() as
does [our documentation][docs-architecture]. [[Top]](#top)

### **How are hypertable chunks determined across the space dimension (partition keys)?** <a id="partitions"></a>
All hypertable chunks are partitioned automatically across time, which is necessary for
right-sizing the chunks such that the B-trees for a table's indexes can reside in memory
during inserts to avoid thrashing that would otherwise occur
while modifying arbitrary locations in those trees. In addition, the user has the option when
creating the hypertable to partition across the space dimension (partition key) on something
like a device id, customer id, or other unique id. [[Top]](#top)

### **How should I configure chunking?** <a id="partitions-best-practice"></a>
See our [chunking best practices documentation][hypertable-best-practices]. [[Top]](#top)

### **Why would I use TimescaleDB over vanilla PostgreSQL?** <a id="vs-postgresql"></a>
* Much higher ingest scale: TimescaleDB sees throughput more than 15X that of
PostgreSQL once tables reach moderate size (e.g., 10s of millions of rows).
While vanilla PostgreSQL is suitable for time-series data at low volumes, it does
not scale well to the volume of data that most time-series applications produce, especially
when running on a single server. In particular, vanilla PostgreSQL has poor write performance
for moderate tables, and this problem only becomes worse over time as data volume grows
linearly in time. These problems emerge when table indexes can no longer fit in memory,
as each insert will translate to many disk fetches to swap in portions of the indexes'
B-Trees. TimescaleDB solves this through its heavy (and adaptive) utilization of
time-space partitioning, even when running _on a single machine_. So all writes
to recent time intervals are only to tables that remain in memory, and updating any
secondary indexes is also fast as a result.
* Superior (or similar) query performance: Queries that can reason
specifically about time ordering can be _much_ more performant in TimescaleDB.
On single disk machines, at least, many simple queries that just perform indexed
lookups or table scans are similarly performant between PostgreSQL and TimescaleDB.
* Extended time-oriented features: TimescaleDB includes time-series specific features
not included in vanilla PostgreSQL and entirely unique to TimescaleDB
(e.g., [`time_bucket`][time_bucket],[`first`][first] and [`last`][last]), with more to come. In addition,
vanilla PostgreSQL data deletion (to save space or to
implement data retention policies) will require expensive "vacuuming" operations to defragment
the disk storage associated with such tables.  Through its adaptive-chunking architecture,
TimescaleDB avoids vacuuming operations and easily enforces data retention policies
through the DROP command and specifying the data you wish to be deleted that is older
than a specified time period. [[Top]](#top)

### **How compatible is TimescaleDB with PostgreSQL?** <a id="postgresql-compatibility"></a>
TimescaleDB is implemented as an extension to PostgreSQL that introduces
transparent scalability and performance optimizations, as well as time-series
specific features (e.g., data retention policies). TimescaleDB connects with any
and all third party tools that communicate with standard PostgreSQL connectors.
TimescaleDB supports the same extensions, tools and drivers that PostgreSQL supports.
You can continue to run your existing databases. [[Top]](#top)

### **How does TimescaleDB handle geospatial data?** <a id="geo-spatial"></a>
As an extension of PostgreSQL, TimescaleDB works well with PostGIS. For example,
[see our tutorial][postgis] using PostGIS and
TimescaleDB on NYC taxicab data. We are actively exploring the extent of TimescaleDB's
geospatial capabilities (i.e., partitioning by location). If you have a use case with a
geospatial component, please email us at hello@timescale.com and we'd be happy to discuss.
[[Top]](#top)

### **What can I use TimescaleDB for?** <a id="what-for"></a>
TimescaleDB can be used to store large amounts of time-series data in a
relational model (and alongside relational data in vanilla PostgreSQL tables) while
exposing a full-SQL interface to the user. This allows various teams in an organization
to run performant complex queries in ad-hoc and arbitrary ways, use JOINs to analyze
different sources and types of data at query time, and have an easier time managing data
through the use of one database, instead of two. TimescaleDB is used to monitor the
performance of applications, models, and connected things. To power interactive
analysis of data and visualization tools. For QA and system performance testing.
By product and customer support teams. And more. [[Top]](#top)

### **When is TimescaleDB a good choice?**  <a id="when-good"></a>
TimescaleDB is a good choice:

* If you, and more of your organization, want to make standard SQL queries on time-series data,
even at scale. Most (all?) NoSQL databases require learning either a new query language or using
something that's at best "SQL-ish" (which still breaks compatibility with existing tools and
causes some degree of mental friction).
* If you need to (or would like) only to manage one database for your relational and time-series
data. Otherwise, users often need to silo data into two databases: a "normal" relational one,
and a second time-series one.
* If you want JOINs, which allow you to query relational and time-series data together at the
database layer and might entirely remove the need to develop this capability at the application
layer (read: frees up developer resources).
* If you want query performance for a varied set of queries. More complex queries are often
slow or full table scans on NoSQL databases, while some data stores can't even support many
natural queries.
* If you want to simplify database management. TimescaleDB can be managed just like PostgreSQL
and inherits its support for varied datatypes and indexes (B-tree, hash, range, BRIN, GiST, GIN).
* If support for geospatial data is desirable. Data stored in TimescaleDB can leverage PostGIS's
geometric datatypes, indexes, and queries.
* If you want greater optionality when it comes to using third-party tools. TimescaleDB supports
anything that speaks SQL, including BI tools like Tableau.
* If you already use and like PostgreSQL, and don't want to have to "give it up" and move to a
NoSQL system in order to scale to larger volumes of data.
* If you already chose to abandon PostgreSQL or another relational database for a Hadoop/NoSQL
system due to scaling concerns or issues. We will provide support for the migration back. [[Top]](#top)

### **When is TimescaleDB _not_ a good choice?**  <a id="when-less-good"></a>
TimescaleDB would not be a good choice if you have:

* Simple-read requirements: If you simply want fast key-value lookups or single column
rollups, an in-memory or column-oriented database might be more appropriate. The former
clearly does not scale to the same data volumes, however, while the latter's performance
significantly underperforms for more complex queries.
* Very sparse or unstructured data: While TimescaleDB leverages PostgreSQL support for
JSON/JSONB formats and handles sparsity quite efficiently (bitmaps for NULL values),
schema-less architectures may be more appropriate in certain scenarios.
* Heavy compression is a priority: Benchmarks show TimescaleDB running on ZFS getting around
4x compression, but compression-optimized column stores might be more appropriate for
higher compression rates.
* Infrequent or offline analysis: If slow response times are acceptable (or fast response
times limited to a small number of pre-computed metrics), and if you don't expect many
applications/users to access that data concurrently, you might avoid using a database altogether
and instead just store data in a distributed file system. [[Top]](#top)

### **What is the TimescaleDB open-source license?** <a id="license"></a>
Apache 2.0. [[Top]](#top)
### **Is there a TimescaleDB community or group I can join?** <a id="community"></a>
Yes. We suggest reporting issues first to [GitHub][]
(or by emailing us at support@timescale.com) and joining our Slack group.
See [slack-login.timescale.com][] to sign up. [[Top]](#top)
### **Can I get support or a commercial license?** <a id="license-commercial"></a>
Yes. Please contact us for more information - support@timescale.com. [[Top]](#top)
### **Where can I get TimescaleDB source code?** <a id="where"></a>
See [GitHub][]. [[Top]](#top)
### **How do I install TimescaleDB?** <a id="install"></a>
See our [install documentation][install]. [[Top]](#top)
### **How do I update an existing installation?** <a id="update"></a>
See our [updating documentation][update]. [[Top]](#top)


[[Top]](#top)
[api]: /api
[INSERT]: /using-timescaledb/writing-data#insert
[SELECT]: /using-timescaledb/reading-data#select
[rdbms > nosql]: http://blog.timescale.com/time-series-data-why-and-how-to-use-a-relational-database-instead-of-nosql-d0cd6975e87c
[tech-paper]: http://www.timescaledb.com/papers/timescaledb.pdf
[docs-architecture]: /introduction/architecture
[hypertable-best-practices]: /using-timescaledb/hypertables#best-practices
[time_bucket]: /api#time_bucket
[first]: /api#first
[last]: /api#last
[postgis]: /tutorials/tutorial-hello-nyc#tutorial-postgis
[Github]: https://github.com/timescale/timescaledb/issues
[slack-login.timescale.com]: https://slack-login.timescale.com/
[install]: /getting-started/installation
[update]: /using-timescaledb/update-db
