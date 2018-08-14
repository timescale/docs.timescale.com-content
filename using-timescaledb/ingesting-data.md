# Ingesting data

TimescaleDB can support standard SQL inserts. Read more about how to use
SQL to write data into TimescaleDB in our [Writing Data][writing-data] section.

Users often choose to leverage existing 3rd party tools to build data ingest pipelines
that increase ingest rates by performing batch writes into TimescaleDB, as opposed
to inserting data one row or metric at a time. At a high-level, TimescaleDB looks just
like PostgreSQL, so any tool that can read and/or write to PostgreSQL also works with
TimescaleDB.

Below, we discuss some popular frameworks and systems used in conjunction with TimescaleDB.

## Prometheus [](prometheus)

Prometheus is a popular tool used to monitor infrastructure metrics. It can scrape
any endpoints that expose metrics in a Prometheus-compatible format. The metrics are
stored in Prometheus and can be queried using PromQL. Prometheus itself is not built for
long-term metrics storage, and instead, supports a variety of remote storage
solutions.

We developed a [Prometheus adapter][prometheus-adapter] and [Prometheus extension][pg-prometheus]
that allows Prometheus to use TimescaleDB as a remote store for long-term metrics. The adapter and
extension work together to support both inserts and read queries through Prometheus. Queries
run through Prometheus will automatically query TimescaleDB to surface longer term
metrics. You can also expand your [querying capabilities][SQL-monitoring] by using SQL with
TimescaleDB. Read more about how to set up Prometheus with TimescaleDB in our
[Prometheus tutorial][prometheus-tutorial]. You can also consider using [Grafana][grafana]
or [other visualization tools][other-viz-tools] to visualize your metrics.

[writing-data]: /using-timescaledb/writing-data
[prometheus-tutorial]: /tutorials/prometheus-adapter
[grafana]: /using-timescaledb/visualizing-data/grafana
[SQL-monitoring]: https://blog.timescale.com/sql-nosql-data-storage-for-prometheus-devops-monitoring-postgresql-timescaledb-time-series-3cde27fd1e07
[prometheus-adapter]: https://github.com/timescale/prometheus-postgresql-adapter
[pg-prometheus]: https://github.com/timescale/pg_prometheus
[other-viz-tools]: /using-timescaledb/visualizing-data/other-viz-tools
