# Querying data

Something something just like PostgreSQL for most cases.  TimescaleDB's architecture natively enhances the speed of typical queries of time-series data by pre-filtering large chunks of the data depending on the time range being queried.  We also have some custom functions for analyzing time-series data like `time_bucket` which allow time-based queries of higher granularity than you can get from PostgreSQL alone.

Something something else.
