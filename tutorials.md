# Tutorials
We've created a host of code-focused tutorials that will help you get
started with *TimescaleDB*.

Most of these tutorials require a working [installation of TimescaleDB][install-timescale].

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

### Integrating with Prometheus

- **[Setup TimescaleDB and Prometheus][prometheus-setup]**: Setup Prometheus to store long-term metrics data in TimescaleDB.
- **[Visualize Prometheus long-term metrics using Grafana][prometheus-grafana]**: Build visualizations in Grafana to obtain insight into your long-term Prometheus metrics stored in TimescaleDB.
- **[Setup a Prometheus endpoint to monitor Timescale Cloud][prometheus-tsc-endpoint]**: Configure Prometheus to collect monitoring data about your Timescale Cloud instance.
- **[Prometheus adapter][]**: Integrate TimescaleDB with Prometheus monitoring for scalability and SQL powers.
- **[Monitoring Django with Prometheus][monitor-django-prometheus]**:
Learn how to monitor your Django application using Prometheus.

### Integrating with Grafana

- **[Creating a Grafana dashboard and panel][tutorial-grafana-dashboards]**: Basic tutorial on using Grafana to visualize data in TimescaleDB.
- **[Visualize Geospatial data in Grafana][tutorial-grafana-geospatial]**: Use the Grafana WorldMap visualization to view your TimescaleDB data.
- **[Use Grafana variables][tutorial-grafana-variables]**: Filter and customize your Grafana visualizations.
- **[Visualizing Missing Data with Grafana][tutorial-grafana-missing-data]**: Learn how to visualize and aggregate missing time-series data in Grafana.

### Integrating with other products

- **[Collecting metrics with Telegraf][Telegraf Output Plugin]**: Collecting metrics with the PostgreSQL and TimescaleDB output plugin for Telegraf.
- **[Visualize Time-Series Data using Tableau][Tableau]**: Learn how to configure Tableau to connect to TimescaleDB and visualize your time-series data.
- **[Migrate from InfluxDB with Outflux][Outflux]**: Use our open-source migration tool to transfer your data from InfluxDB to TimescaleDB.

### Language quick-starts

- **[Python and TimescaleDB][python-quickstart]**: A quick start guide for Python developers looking to use TimescaleDB.
- **[Ruby on Rails and TimescaleDB][ruby-quickstart]**: A quick start guide for Ruby on Rails developers looking to use TimescaleDB.

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
[Telegraf Output Plugin]: /tutorials/telegraf-output-plugin
[Data Sets]: /tutorials/other-sample-datasets
[install-timescale]: /getting-started/installation
[psql]: /getting-started/install-psql-tutorial
[Crypto]: /tutorials/analyze-cryptocurrency-data
[Tableau]: /tutorials/visualizing-time-series-data-in-tableau
[prometheus-tsc-endpoint]: /tutorials/tutorial-setting-up-timescale-cloud-endpoint-for-prometheus
[prometheus-setup]: /tutorials/tutorial-setup-timescale-prometheus
[prometheus-grafana]: /tutorials/tutorial-use-timescale-prometheus-grafana
[monitor-django-prometheus]: /tutorials/tutorial-howto-monitor-django-prometheus
[tutorial-grafana-dashboards]: /tutorials/tutorial-grafana-dashboard
[tutorial-grafana-geospatial]: /tutorials/tutorial-grafana-geospatial
[tutorial-grafana-variables]: /tutorials/tutorial-grafana-variables
[tutorial-grafana-missing-data]: /tutorials/tutorial-howto-visualize-missing-data-grafana
[python-quickstart]: /tutorials/quickstart-python
[ruby-quickstart]: /tutorials/quickstart-ruby
[simul-iot-data]: /tutorials/tutorial-howto-simulate-iot-sensor-data

