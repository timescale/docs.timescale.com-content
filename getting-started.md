# Getting Started

TimescaleDB behaves in many aspects like a standard PostgreSQL database: It
coexists with other TimescaleDBs and PostgreSQL databases on a PostgreSQL
server; it contains standard database objects like tables,
indexes, and triggers; it uses SQL as its interface language; it uses common
PostgreSQL connectors to third-party tools.  The way the database
accomplishes this synchronicity with PostgreSQL is through its packaging as
a PostgreSQL extension, whereby a standard PostgreSQL database is
transformed into a TimescaleDB.

<img class="main-content__illustration" style="width: 100%" src="//assets.iobeam.com/images/docs/illustration-hierarchy.svg" alt="hierarchy illustration"/>

The advantages that TimescaleDB offers beyond that of PostgreSQL are primarily
related to handling time-series data.  Those advantages are expressed through
hypertables, which act as normal tables and maintain high performance even
while scaling storage to normally prohibitive amounts of data.  Hypertables
can engage in normal table operations, including JOINs with standard tables.

Getting started with TimescaleDB involves a few steps:

1. [Installing PostgreSQL and TimescaleDB.][install]
1. [Creating a standard PostgreSQL database and enabling the TimescaleDB extension on the database.][setup]
1. [Creating a hypertable to store your data.][create-hypertables]
1. [Migrating your data to a hypertable][migrate] (optional)

[install]: /getting-started/installation
[setup]: /getting-started/setup
[create-hypertables]: /getting-started/creating-hypertables
[migrate]: /getting-started/migrating-data
