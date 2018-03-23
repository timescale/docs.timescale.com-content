# Getting Started

A TimescaleDB behaves in many respects like a standard PostgreSQL database. It:
- Coexists with other TimescaleDBs and PostgreSQL databases on a PostgreSQL
server.
- Uses SQL as its interface language.
- Contains standard database objects like tables, indexes, and triggers.
- Uses common PostgreSQL connectors to third-party tools.

The way the database accomplishes this synchronicity is through its packaging
as a PostgreSQL extension, whereby a standard PostgreSQL database is
transformed into a TimescaleDB.

<img class="main-content__illustration" style="width: 100%" src="//assets.iobeam.com/images/docs/illustration-hierarchy.svg" alt="hierarchy illustration"/>

The advantages that TimescaleDB offers beyond that of PostgreSQL are primarily
related to handling time-series data.  These advantages are most easily seen
when interacting with [hypertables][], which behave like normal tables yet
maintain high performance even while scaling storage to normally prohibitive
amounts of data.  Hypertables can engage in normal table operations, including
JOINs with standard tables.

Getting started with TimescaleDB involves a few steps:

1. [Installing PostgreSQL and TimescaleDB.][install]
1. [Creating a standard PostgreSQL database and enabling the TimescaleDB extension on the database.][setup]
1. [Creating a hypertable to store your data.][create-hypertables]
1. [Migrating your data to a hypertable][migrate] (optional)

[hypertables]: /introduction/architecture#hypertables
[install]: /getting-started/installation
[setup]: /getting-started/setup
[create-hypertables]: /getting-started/creating-hypertables
[migrate]: /getting-started/migrating-data
