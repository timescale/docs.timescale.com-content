# Using TimescaleDB

At Timescale we focus on _simplicity_ when considering our users and how they
prefer to operate and manage their database, infrastructure, and the applications
they're developing, especially at scale.

First and foremost, we decided to develop TimescaleDB as an extension to PostgreSQL,
rather than building a time-series database from scratch. We also chose not to introduce
our own custom query language. Instead, we chose to fully embrace SQL.

TimescaleDB supports all SQL operations and queries one would expect out of vanilla Postgres.
This includes how tables are created, altered and deleted, how schemas are built and indexed,
and how data is inserted and queried. Additionally, Timescale adds necessary and useful query
functions for operational ease-of-use and analytical flexibility. In general, if you are
familiar with SQL, TimescaleDB will be familiar to you.

Yet the most important design aspect for providing users with a simple interface to
the database is the TimescaleDB hypertable, discussed earlier within
[Architecture & Concepts][architecture].

Essentially, hypertables allow for the complexity of TimescaleDB's automatic partitioning
to be abstracted away so that users don't have worry about managing any of the underlying
chunks individually. Instead users can focus on developing and interacting with their data as
they would in a regular PostgreSQL database. The following documentation discusses all of the
operations, and more, for using TimescaleDB. Again, for those coming from the world
of SQL and Postgres, these docs will be refreshingly simple. For those coming from
different database worlds, you will find that while learning more about TimescaleDB
you will also gain an education in PostgreSQL.

Next: [Creating hypertables in TimescaleDB][creating-hypertables].

[architecture]: /v0.8/introduction/architecture
[creating-hypertables]: /v0.8/using-timescaledb/hypertables
