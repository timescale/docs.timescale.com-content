# Tutorials
We've created a host of code-focused tutorials that will help you get
started with *TimescaleDB*.

For most of these tutorials, you will also need a working instance of *TimescaleDB*. The fastest way
to get started with *TimescaleDB* is [setting up *Timescale Cloud*][timescale-cloud-install].
*Timescale Cloud* is a hosted version of *TimescaleDB*. If you prefer,
you can download the [TimescaleDB Community Edition][timescale-community-install]
and run it on your desktop or your own cloud infrastructure.

### Common scenarios for using TimescaleDB

- **[Start Here - Hello Timescale][Hello Timescale]**: If you are new to TimescaleDB
or even SQL, check out our tutorial with NYC taxicab data to get an idea of the
capabilities our database has to offer.
- **[Time-series Forecasting][Forecasting]**: Use R, Apache MADlib and Python to perform
data analysis and make forecasts on your data.
- **[Analyze Cryptocurrency Data][Crypto]**: Use TimescaleDB to analyze historic cryptocurrency data. Learn how to build your own schema, ingest data, and analyze information in TimescaleDB.

### How to use specific TimescaleDB features

- **[Replication][]**: TimescaleDB takes advantage of well established PostgreSQL methods for replication.  Here we provide a detailed guide along with additional resources for setting up streaming replicas.
- **[Continuous Aggregates][]**: Getting started with continuous aggregates.

### Integrating with other products

- **[Setup TimescaleDB and Prometheus][prometheus-setup]**: Setup Prometheus to store long-term metrics data in TimescaleDB.
- **[Visualize Prometheus long-term metrics using Grafana][prometheus-grafana]**: Build visualizations in Grafana to obtain insight into your long-term Prometheus metrics stored in TimescaleDB.
- **[Setup a Prometheus endpoint to monitor Timescale Cloud][prometheus-tsc-endpoint]**: Configure Prometheus to collect monitoring data about your Timescale Cloud instance.
- **[Prometheus adapter][]**: Integrate TimescaleDB with Prometheus monitoring for scalability and SQL powers.
- **[Monitoring Django with Prometheus][monitor-django-prometheus]**:
Learn how to monitor your Django application using Prometheus.
- **[Collecting metrics with Telegraf][Telegraf Output Plugin]**: Collecting metrics with the PostgreSQL and TimescaleDB output plugin for Telegraf.
- **[Visualizing Data with Grafana][grafana]**: Visualize time-series data with this primer on getting started with Grafana.
- **[Visualizing Missing Data with Grafana][grafana-missing-data]**: Learn how to visualize and aggregate missing time-series data in Grafana.
- **[Visualize Time-Series Data using Tableau][Tableau]**: Learn how to configure Tableau to connect to TimescaleDB and visualize your time-series data.
- **[Migrate from InfluxDB with Outflux][Outflux]**: Use our open-source migration tool to transfer your data from InfluxDB to TimescaleDB.

### Additional resources

- **[Sample data sets][Data Sets]**: And if you want to explore on your own
with some sample data, we have some ready-made data sets for you to explore.
- **[Simulate IoT Sensor Data][simul-iot-data]**: Simulate a basic IoT sensor dataset
on PostgreSQL or TimescaleDB.
- **[psql installation][psql]**: `psql` is a terminal-based front-end for PostgreSQL.
Learn how to install `psql` on Mac, Ubuntu, Debian, Windows,
and pick up some valuable `psql` tips and tricks along the way.

[Hello Timescale]: /tutorials/tutorial-hello-timescale
[Forecasting]: /tutorials/tutorial-forecasting
[Replication]: /tutorials/replication
[Continuous Aggregates]: /tutorials/continuous-aggs-tutorial
[Outflux]: /tutorials/outflux
[Prometheus adapter]: /tutorials/prometheus-adapter
[Grafana]: /tutorials/tutorial-grafana
[grafana-missing-data]: /tutorials/tutorial-howto-visualize-missing-data-grafana
[Telegraf Output Plugin]: /tutorials/telegraf-output-plugin
[Data Sets]: /tutorials/other-sample-datasets
[timescale-cloud]: https://www.timescale.com/products
[timescale-cloud-install]: /getting-started/installation/timescale-cloud/installation-timescale-cloud
[timescale-community-install]: /getting-started/installation
[psql]: /getting-started/install-psql-tutorial
[Crypto]: /tutorials/analyze-cryptocurrency-data
[Tableau]: /tutorials/visualizing-time-series-data-in-tableau
[prometheus-tsc-endpoint]: /tutorials/tutorial-setting-up-timescale-cloud-endpoint-for-prometheus
[prometheus-setup]: /tutorials/tutorial-setup-timescale-prometheus
[prometheus-grafana]: /tutorials/tutorial-use-timescale-prometheus-grafana
[monitor-django-prometheus]: /tutorials/tutorial-howto-monitor-django-prometheus
[simul-iot-data]: /tutorials/tutorial-howto-simulate-iot-sensor-data
