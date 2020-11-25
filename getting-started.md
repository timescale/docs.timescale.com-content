# Getting Started

TimescaleDB is PostgreSQL for time-series data. TimescaleDB provides all 
the benefits of PostgreSQL, including:

- Ability to coexist with other TimescaleDB databases and PostgreSQL databases on a PostgreSQL server
- Full SQL as its primary interface language
- All the standard database objects (like tables, indexes, triggers, and more)
- Ability to use the entire PostgreSQL ecosystem of third-party tools

The way the database accomplishes this synchronicity is through its packaging 
as a PostgreSQL extension, whereby a standard PostgreSQL database is 
transformed into a TimescaleDB database.

<img class="main-content__illustration" style="width: 100%" src="//assets.iobeam.com/images/docs/illustration-hierarchy.svg" alt="hierarchy illustration"/>

But TimescaleDB improves upon PostgreSQL for handling time-series data. 
These advantages are most easily seen when interacting with 
[hypertables][hypertables], which behave like normal tables yet maintain 
high performance even while scaling storage to normally prohibitive amounts of data. 
Hypertables can engage in normal table operations, including JOINs with standard 
tables.

If you know PostgreSQL, you are 90% of the way to knowing TimescaleDB. If 
you want to learn more, here are some additional resources:

- [Learn more about time-series data][time-series-data] and how you can best use it for your applications.
- Learn more about [the TimescaleDB architecture][timescaledb-architecture].
- Learn more about [the unique features of TimescaleDB][using-timescaledb]. 

### Options for installing TimescaleDB

The best way to get TimescaleDB is through our hosted offering. You can 
[try TimecaleDB for free][try-for-free] and get started in seconds. Hosted 
TimescaleDB lets you focus on your workloads while we handle the operations 
and management of your critical time-series data. TimescaleDB is available in 
the three top cloud providers (Amazon Web Services, Microsoft Azure, and 
Google Cloud Platform) across 75+ regions and over 2000 different configurations.

You can also [install TimescaleDB][install-timescale] on your desktop or 
self-managed in your own infrastructure for free.

### Getting familiar with TimescaleDB

There are a lot of things TimescaleDB can do for you and your time-series data. 
Here are some of our favorite features, along with links to learn more:

- [Migrating your data to a hypertable][migrate] (optional)
- Analyze your data using advanced [time-series analytical functions][time-series-functions] (e.g., gap filling, LOCF, interpolation)
- [Native compression][using-compression] can reduce storage by up to 90%, saving you a significant amount of money on your time-series deployment
- [Continuous aggregates][using-continuous-aggregates] automatically calculate the results of a query in the background and materialize the results
- [Data retention][using-data-retention] policies help you decide when to store old data based on its relevance to your use case
- Achieve petabyte scale with [Multi-node][multinode] (distributed hypertables)
- Support for [high cardinality][high-cardinality] datasets
- Support for all PostgreSQL extensions, such as [PostGIS][hello-timescale]
- Compatibility with [Grafana][grafana-tutorials], [Tableau][tableau-tutorials], and most visualization tools
- Support for [VPC Peering][vpc-peering] (in Timescale Cloud)
- [SSL Support for database connections][ssl-support] and better security

### Using TimescaleDB

The best way to gain familiarity with TimescaleDB is to use it. The following 
tutorials (complete with sample data) will help you learn how to harness the 
power of your time-series data and give you a guided tour of TimescaleDB.

- Start with [Hello Timescale][hello-timescale], our 20-minute guided tour of TimescaleDB
- Many people use visualization tools with their time-series data, and our [Grafana tutorials][grafana-tutorials] will walk you through these steps
- We’ve also built [other tutorials][all-tutorials] for language-specific developers, data migration, and more

### Need help?

Our world-class support team is here to support you through multiple channels:

- Join our [Community Slack][slack-community] and get to know your fellow time-series developers
- Consider [paid support options][paid-support] for a deeper relationship with Timescale engineers
- Join our [worldwide TimescaleDB community][community-options] and stay on top of the latest developments in time-series data


[time-series-data]: /introduction/time-series-data
[timescaledb-architecture]: /introduction/architecture
[hypertables]: /introduction/architecture#hypertables
[using-timescaledb]: /using-timescaledb
[try-for-free]: https://www.timescale.com/timescale-signup
[install-timescale]: /getting-started/installation
[migrate]: /getting-started/migrating-data
[time-series-functions]: https://blog.timescale.com/blog/sql-functions-for-time-series-analysis/
[using-compression]: /using-timescaledb/compression
[using-continuous-aggregates]: /using-timescaledb/continuous-aggregates
[using-data-retention]: /using-timescaledb/data-retention
[multinode]: /getting-started/setup-multi-node-basic
[high-cardinality]: https://blog.timescale.com/blog/what-is-high-cardinality-how-do-time-series-databases-influxdb-timescaledb-compare/
[vpc-peering]: https://kb.timescale.cloud/en/articles/2752394-using-vpc-peering
[ssl-support]: https://kb.timescale.cloud/en/articles/2752457-ssl-tls-certificates
[hello-timescale]: /tutorials/tutorial-hello-timescale
[grafana-tutorials]: /tutorials/tutorial-grafana
[tableau-tutorials]: /tutorials/visualizing-time-series-data-in-tableau
[telegraf-tutorials]: /tutorials/telegraf-output-plugin
[all-tutorials]: /tutorials
[slack-community]: https://slack.timescale.com/
[paid-support]: https://www.timescale.com/support
[community-options]: https://www.timescale.com/community
