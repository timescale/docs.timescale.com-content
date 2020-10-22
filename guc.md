# TimescaleDB Configuration

## Hypertables [](hypertables)

#### timescaledb.enable_constraint_aware_append (bool) [](#enable_constraint_aware_append)

Enable constraint exclusion at execution time. It is by default enabled.

#### timescaledb.enable_ordered_append (bool) [](#enable_ordered_append)

Enable ordered append optimization for queries that are ordered by the
time dimension. It is by default enabled.

#### timescaledb.enable_chunk_append (bool) [](#enable_chunk_append)

Enable chunk append node. It is by default enabled.

#### timescaledb.enable_parallel_chunk_append (bool) [](#enable_parallel_chunk_append)

Enable parallel aware chunk append node. It is by default enabled.

#### timescaledb.enable_runtime_exclusion (bool) [](#enable_runtime_exclusion)

Enable runtime chunk exclusion in chunk append node. It is by default enabled.

#### timescaledb.enable_constraint_exclusion (bool) [](#enable_constraint_exclusion)

Enable planner constraint exclusion. It is by default enabled.

## Compression [](compression)

#### timescaledb.enable_transparent_decompression (bool) [](#enable_transparent_decompression)

Enable transparent decompression when querying hypertable. It is by default enabled.

## Continuous Aggregates [](continuous-aggregates)

#### timescaledb.enable_cagg_reorder_groupby (bool) [](#enable_cagg_reorder_groupby)

Enable group-by clause reordering for continuous aggregates. It is by default enabled.

## Policies [](policies)

#### timescaledb.max_background_workers (int) [](#max_background_workers)

Max background worker processes allocated to TimescaleDB.  Set to at
least 1 + number of databases in Postgres instance to use background
workers. Default value is 8.

## Distributed Hypertables [](multinode)

#### timescaledb.enable_2pc (bool) [](#enable_2pc)

Enables two-phase commit for distributed hypertables. If disabled, it
will use a one-phase commit instead, which is faster but can result in
inconsistent data. It is by default enabled.

#### timescaledb.enable_per_data_node_queries (bool) [](#enable_per_data_node_queries)

If enabled, TimescaleDB will combine different chunks belonging to the
same hypertable into a single query per data node. It is by default enabled.

#### timescaledb.max_insert_batch_size (int) [](#max_insert_batch_size)

When acting as a access node, TimescaleDB splits batches of inserted
tuples across multiple data nodes. It will batch up to
`max_insert_batch_size` tuples per data node before flushing. Setting
this to 0 disables batching, reverting to tuple-by-tuple inserts. The
default value is 1000.

#### timescaledb.enable_connection_binary_data (bool) [](#enable_connection_binary_data)

Enables binary format for data exchanged between nodes in the
cluster. It is by default enabled.

#### timescaledb.enable_client_ddl_on_data_nodes (bool) [](#enable_client_ddl_on_data_nodes)

Enables DDL operations on data nodes by a client and do not restrict
execution of DDL operations only by access node. It is by default disabled.

#### timescaledb.enable_async_append (bool) [](#enable_async_append)

Enables optimization that runs remote queries asynchronously across
data nodes. It is by default enabled.

#### timescaledb.enable_remote_explain (bool) [](#enable_remote_explain)

Enable getting and showing `EXPLAIN` output from remote nodes. This
will require sending the query to the data node, so it can be affected
by the network connection and availability of data nodes. It is by default disabled.

#### timescaledb.remote_data_fetcher (enum) [](#remote_data_fetcher)

Pick data fetcher type based on type of queries you plan to run, which
can be either `rowbyrow` or `cursor`. The default is `rowbyrow`.

#### timescaledb.ssl_dir (string) [](#ssl_dir)

Specifies the path used to search user certificates and keys when
connecting to data nodes using certificate authentication. Defaults to
`timescaledb/certs` under the PostgreSQL data directory.

#### timescaledb.passfile (string) [](#passfile)

Specifies the name of the file where passwords are stored and when
connecting to data nodes using password authentication.

## Administration [](administration)

#### timescaledb.restoring (bool) [](#restoring)

Set TimescaleDB in restoring mode. It is by default disabled.

#### timescaledb.license (string) [](#license)

TimescaleDB license type. Determines which features are enabled. The
variable value defaults to `timescale`.

## timescaledb.telemetry_level (enum) [](#telemetry_level)

Telemetry settings level. Level used to determine which telemetry to
send. Can be set to `off` or `basic`. Defaults to `basic`.

#### timescaledb.last_tuned (string) [](#last_tuned)

Records last time `timescaledb-tune` ran.

#### timescaledb.last_tuned_version (string) [](#last_tuned_version)

Version of `timescaledb-tune` used to tune when it ran.

