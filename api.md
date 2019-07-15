# TimescaleDB API Reference

>:TOPLIST:
> ### Command List (A-Z)
> - [add_dimension](#add_dimension)
> - [add_data_node](#add_data_node)
> - [add_drop_chunks_policy](#add_drop_chunks_policy)
> - [add_reorder_policy](#add_reorder_policy)
> - [alter_job_schedule](#alter_job_schedule)
> - [alter view (continuous aggregate)](#continuous_aggregate-alter_view)
> - [attach_data_node](#attach_data_node)
> - [attach_tablespace](#attach_tablespace)
> - [chunk_relation_size](#chunk_relation_size)
> - [chunk_relation_size_pretty](#chunk_relation_size_pretty)
> - [create_distributed_hypertable](#create_distributed_hypertable)
> - [create_hypertable](#create_hypertable)
> - [create index (transaction per chunk)](#create_index)
> - [create view (continuous aggregate)](#continuous_aggregate-create_view)
> - [detach_data_node](#detach_data_node)
> - [delete_data_node](#delete_data_node)
> - [detach_tablespace](#detach_tablespace)
> - [detach_tablespaces](#detach_tablespaces)
> - [drop_chunks](#drop_chunks)
> - [drop view (continuous aggregate)](#continuous_aggregate-drop_view)
> - [first](#first)
> - [get_telemetry_report](#get_telemetry_report)
> - [histogram](#histogram)
> - [hypertable_approximate_row_count](#hypertable_approximate_row_count)
> - [hypertable_relation_size](#hypertable_relation_size)
> - [hypertable_relation_size_pretty](#hypertable_relation_size_pretty)
> - [indexes_relation_size](#indexes_relation_size)
> - [indexes_relation_size_pretty](#indexes_relation_size_pretty)
> - [interpolate](#interpolate)
> - [last](#last)
> - [locf](#locf)
> - [refresh materialized view (continuous aggregate)](#continuous_aggregate-refresh_view)
> - [remove_drop_chunks_policy](#remove_drop_chunks_policy)
> - [remove_reorder_policy](#remove_reorder_policy)
> - [reorder_chunk](#reorder_chunk)
> - [set_adaptive_chunking](#set_adaptive_chunking)
> - [set_chunk_time_interval](#set_chunk_time_interval)
> - [set_number_partitions](#set_number_partitions)
> - [show_chunks](#show_chunks)
> - [show_tablespaces](#show_tablespaces)
> - [time_bucket](#time_bucket)
> - [time_bucket_gapfill](#time_bucket_gapfill)
> - [timescaledb_information.data_node](#timescaledb_information-datanode)
> - [timescaledb_information.hypertable](#timescaledb_information-hypertable)
> - [timescaledb_information.license](#timescaledb_information-license)
> - [timescaledb_information.continuous_aggregates](#timescaledb_information-continuous_aggregate)
> - [timescaledb_information.continuous_aggregate_stats](#timescaledb_information-continuous_aggregate_stats)
> - [timescaledb_information.drop_chunks_policies](#timescaledb_information-drop_chunks_policies)
> - [timescaledb_information.policy_stats](#timescaledb_information-policy_stats)
> - [timescaledb_information.reorder_policies](#timescaledb_information-reorder_policies)
> - [timescaledb.license_key](#timescaledb_license-key)
> - [timescaledb_pre_restore](#timescaledb_pre_restore)
> - [timescaledb_post_restore](#timescaledb_post_restore)

## Hypertable management [](hypertable-management)

### add_dimension() [](add_dimension)

Add an additional partitioning dimension to a TimescaleDB hypertable.
The column selected as the dimension can either use interval
partitioning (e.g., for a second time partition) or hash partitioning.

<!-- -->
>:WARNING: The `add_dimension` command can only be executed after a table has been
converted to a hypertable (via `create_hypertable`), but must similarly
be run only on an empty hypertable.

**Space partitions**: The use of additional partitioning is a very
specialized use case.  **Most users will not need to use it.**

Space partitions use hashing: Every distinct item is hashed to one of
*N* buckets.  Remember that we are already using (flexible) time
intervals to manage chunk sizes; the main purpose of space
partitioning is to enable parallel I/O to the same time interval.

Parallel I/O can benefit in two scenarios: (a) two or more concurrent
queries should be able to read from different disks in parallel, or
(b) a single query should be able to use query parallelization to read
from multiple disks in parallel.

Note that queries to multiple chunks can be executed in parallel when TimescaleDB is running on Postgres 11, but PostgreSQL 9.6 or 10 does not support such parallel chunk execution.

Thus, users looking for parallel I/O have two options:

1. Use a RAID setup across multiple physical disks, and expose a
single logical disk to the hypertable (i.e., via a single tablespace).

1. For each physical disk, add a separate tablespace to the
database.  TimescaleDB allows you to actually add multiple tablespaces
to a *single* hypertable (although under the covers, a hypertable's
chunks are spread across the tablespaces associated with that hypertable).

We recommend a RAID setup when possible, as it supports both forms of
parallelization described above (i.e., separate queries to separate
disks, single query to multiple disks in parallel).  The multiple
tablespace approach only supports the former.  With a RAID setup,
*no spatial partitioning is required*.

That said, when using space partitions, we recommend using 1
space partition per disk.

TimescaleDB does *not* benefit from a very large number of space
partitions (such as the number of unique items you expect in partition
field).  A very large number of such partitions leads both to poorer
per-partition load balancing (the mapping of items to partitions using
hashing), as well as much increased planning latency for some types of
queries.

#### Required Arguments [](add_dimension-required-arguments)

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to add the dimension to.|
| `column_name` | Name of the column to partition by.|

#### Optional Arguments [](add_dimension-optional-arguments)

|Name|Description|
|---|---|
| `number_partitions` | Number of hash partitions to use on `column_name`. Must be > 0.|
| `chunk_time_interval` | Interval that each chunk covers. Must be > 0.|
| `partitioning_func` | The function to use for calculating a value's partition (see `create_hypertable` [instructions](#create_hypertable)).|
| `if_not_exists` | Set to true to avoid throwing an error if a dimension for the column already exists. A notice is issued instead. Defaults to false. |

#### Returns

|Column|Description|
|---|---|
| `dimension_id` | ID of the dimension in the TimescaleDB internal catalog. |
| `schema_name` | Schema name of the hypertable.|
| `table_name` | Table name of the hypertable. |
| `column_name` | Column name of the column to partition by. |
| `created` | True if the dimension was added, false when `if_not_exists` is true and no dimension was added. |

When executing this function, either `number_partitions` or
`chunk_time_interval` must be supplied, which will dictate if the
dimension will use hash or interval partitioning.

The `chunk_time_interval` should be specified as follows:

- If the column to be partitioned is a TIMESTAMP, TIMESTAMPTZ, or
DATE, this length should be specified either as an INTERVAL type or
an integer value in *microseconds*.

- If the column is some other integer type, this length
should be an integer that reflects
the column's underlying semantics (e.g., the
`chunk_time_interval` should be given in milliseconds if this column
is the number of milliseconds since the UNIX epoch).

>:WARNING: Supporting more than **one** additional dimension is currently
 experimental.  For any production environments, users are recommended
 to use at most one "space" dimension (in addition to the required
 time dimension specified in `create_hypertable`).

#### Sample Usage [](add_dimension-examples)

First convert table `conditions` to hypertable with just time
partitioning on column `time`, then add an additional partition key on `location` with four partitions:
```sql
SELECT create_hypertable('conditions', 'time');
SELECT add_dimension('conditions', 'location', number_partitions => 4);
```

Convert table `conditions` to hypertable with time partitioning on `time` and
space partitioning (2 partitions) on `location`, then add two additional dimensions.

```sql
SELECT create_hypertable('conditions', 'time', 'location', 2);
SELECT add_dimension('conditions', 'time_received', chunk_time_interval => interval '1 day');
SELECT add_dimension('conditions', 'device_id', number_partitions => 2);
SELECT add_dimension('conditions', 'device_id', number_partitions => 2, if_not_exists => true);
```

---
## attach_data_node() [](attach_data_node)

Attach a data node to a hypertable. The data node should have been
previously created using [`add_data_node`](#add_data_node).

When a distributed hypertable is created it will by default use all
available data nodes for the hypertable, but if a data node is added
*after* a hypertable is created, the data node will not automatically
be used by existing distributed hypertables.

If you want a hypertable to use a data node that was created later,
you must attach the data node to the hypertable using this
function.

#### Required Arguments [](attach_data_node-required-arguments)

| Name              | Description                                   |
|-------------------|-----------------------------------------------|
| `node_name`       | Name of data node to attach             |
| `hypertable`      | Name of distributed hypertable to attach node to          |

#### Optional Arguments [](attach_data_node-optional-arguments)

| Name              | Description                                   |
|-------------------|-----------------------------------------------|
| `if_not_attached` | Prevents error if data node is already attached to the hypertable. A notice will be printed that the data node is attached. |

#### Returns

| Column               | Description                              |
|-------------------|-----------------------------------------------|
| `hypertable_id`      | Hypertable id of the modified hypertable |
| `node_hypertable_id` | Hypertable id on the remote data node    |
| `node_name`          | Name of the attached data node     |

#### Sample Usage [](attach_data_node-examples)

Attach a data node `dn3` to a distributed hypertable `conditions`
previously created with
[`create_distributed_hypertable`](#create_distributed_hypertable).

```sql
SELECT * FROM attach_data_node('dn3','conditions');

hypertable_id | node_hypertable_id |  node_name  
--------------+--------------------+-------------
            5 |                  3 | dn3

(1 row)
```

>:TIP: You must add a data node to your distributed database first
with [`add_data_node`](#add_data_node) first before attaching it.

---
## attach_tablespace() [](attach_tablespace)
=======
## add_data_node() [](add_data_node)

Add a new data node to the database to be used for creating
distributed hypertables.

Newly created distributed hypertables will be able to make use of this
data node for apportioning data across the distributed database. Note that existing
distributed hypertables will not automatically use the newly added
data node. For existing distributed hypertables to use added data
nodes, use [`attach_data_node`](#attach_data_node).

The function will attempt to bootstrap the data node by:
1. Connecting to a specified postgres instance
2. Creating the database that will serve as the new data node
3. Loading the TimescaleDB extension on the new database

#### Errors

An error will be given if:
* an attempt is made to run the function inside a transaction _or_
* the remote database already exists on the data node and
  `if_not_exists` is not set.

#### Required Arguments [](add_data_node-required-arguments)

| Name        | Description                         |
| ----------- | -----------                         |
| `node_name` | Name for the data node.             |

#### Optional Arguments [](add_data_node-optional-arguments)

| Name                 | Description                                           |
|----------------------|-------------------------------------------------------|
| `host`               | Host name for the remote data node. The default is `'localhost'`. |
| `port`               | Port to use on the remote data node. The default is the PostgreSQL port used by the access node on which the function is executed. |
| `database`           | Database name where remote hypertables will be created. The default is the current database name. |
| `password`           | Password to be used when connecting to the remote data node. Note that the user name will be the same as the current user. The default is to not use a password. |
| `if_not_exists`      | Do not fail if the data node already exists. The data node will not be overwritten, but the command will not generate an error and instead generate a notice. |
| `bootstrap_database` | Database to use when bootstrapping as described above. The default is `'postgres'`. |
| `bootstrap_user`     | User to be used for bootstrapping. This user needs to have `SUPERUSER` permissions on the remote database server, unless the remote database already exists with the timescaledb extension. The default is the current user. |
| `bootstrap_password` | Password to be used when bootstrapping. The default is the password provided in `password`. |

#### Returns [](add_data_node-returns)

| Column              | Description                                       |
|---------------------|---------------------------------------------------|
| `node_name`         | Local name to use for the data node               |
| `host`              | Host name for the remote data node                |
| `port`              | Port for the remote data node                     |
| `database`          | Database name used on the remote data node        |
| `node_created`      | Was the data node created locally                 |
| `database_created`  | Was the database created on the remote data node  |
| `extension_created` | Was the extension created on the remote data node |

#### Sample usage [](add_data_node-examples)

Let's assume that you have an existing hypertable `conditions` and
want to use `time` as the time partitioning column and `location` as
the space partitioning column. You also want to distribute the chunks
of the hypertable on two data nodes `dn1.example.com` and
`dn2.example.com`:

```sql
SELECT add_data_node('dn1', host => 'dn1.example.com');
SELECT add_data_node('dn2', host => 'dn2.example.com');
SELECT create_distributed_hypertable('conditions', 'time', 'location');
```

Note that the previous example will only succeed if the current user
has `SUPERUSER` permission on the two remote systems and doesn't
require a password to connect.  If the current user doesn't have the
appropriate permissions, you'll have to provide a bootstrap user as
described above:

```sql
SELECT add_data_node('dn1', host => 'dn1.example.com', password => 'mydn1password', bootstrap_user => 'dn1_superuser', bootstrap_password => 'dn1_su_password');
```

---
### attach_tablespace() [](attach_tablespace)

Attach a tablespace to a hypertable and use it to store chunks. A
[tablespace][postgres-tablespaces] is a directory on the filesystem
that allows control over where individual tables and indexes are
stored on the filesystem. A common use case is to create a tablespace
for a particular storage disk, allowing tables to be stored
there. Please review the standard PostgreSQL documentation for more
[information on tablespaces][postgres-tablespaces].

TimescaleDB can manage a set of tablespaces for each hypertable,
automatically spreading chunks across the set of tablespaces attached
to a hypertable. If a hypertable is hash partitioned, TimescaleDB will
try to place chunks that belong to the same partition in the same
tablespace. Changing the set of tablespaces attached to a hypertable
may also change the placement behavior. A hypertable with no attached
tablespaces will have its chunks placed in the database's default
tablespace.

#### Required Arguments [](attach_tablespace-required-arguments)

|Name|Description|
|---|---|
| `tablespace` | Name of the tablespace to attach.|
| `hypertable` | Identifier of hypertable to attach the tablespace to.|

Tablespaces need to be [created][postgres-createtablespace] before
being attached to a hypertable. Once created, tablespaces can be
attached to multiple hypertables simultaneously to share the
underlying disk storage. Associating a regular table with a tablespace
using the `TABLESPACE` option to `CREATE TABLE`, prior to calling
`create_hypertable`, will have the same effect as calling
`attach_tablespace` immediately following `create_hypertable`.

#### Optional Arguments [](attach_tablespace-optional-arguments)

|Name|Description|
|---|---|
| `if_not_attached` | Set to true to avoid throwing an error if the tablespace is already attached to the table. A notice is issued instead. Defaults to false. |

#### Sample Usage [](attach_tablespace-examples)

Attach the tablespace `disk1` to the hypertable `conditions`:


```sql
SELECT attach_tablespace('disk1', 'conditions');
SELECT attach_tablespace('disk2', 'conditions', if_not_attached => true);
 ```

>:WARNING: The management of tablespaces on hypertables is currently an
experimental feature.

---

## create_hypertable() [](create_hypertable)

Creates a TimescaleDB hypertable from a PostgreSQL table (replacing the
latter), partitioned on time and with the option to partition
on one or more other columns (i.e., space).
All actions, such as `ALTER TABLE`, `SELECT`, etc.,
still work on the resulting hypertable.

#### Required Arguments [](create_hypertable-required-arguments)

|Name|Description|
|---|---|
| `main_table` | Identifier of table to convert to hypertable |
| `time_column_name` | Name of the column containing time values as well as the primary column to partition by. |

#### Optional Arguments [](create_hypertable-optional-arguments)

|Name|Description|
|---|---|
| `partitioning_column` | Name of an additional column to partition by. If provided, the `number_partitions` argument must also be provided. |
| `number_partitions` | Number of hash partitions to use for `partitioning_column`. Must be > 0. |
| `chunk_time_interval` | Interval in event time that each chunk covers. Must be > 0. As of TimescaleDB v0.11.0, default is 7 days, unless adaptive chunking (DEPRECATED)  is enabled, in which case the interval starts at 1 day. For previous versions, default is 1 month. |
| `create_default_indexes` | Boolean whether to create default indexes on time/partitioning columns. Default is TRUE. |
| `if_not_exists` | Boolean whether to print warning if table already converted to hypertable or raise exception. Default is FALSE. |
| `partitioning_func` | The function to use for calculating a value's partition.|
| `associated_schema_name` | Name of the schema for internal hypertable tables. Default is "_timescaledb_internal". |
| `associated_table_prefix` | Prefix for internal hypertable chunk names. Default is "_hyper". |
| `migrate_data` | Set to `true` to migrate any existing `main_table` data to chunks in the new hypertable. A non-empty table will generate an error without this option. Note that, for large tables, the migration might take a long time. Defaults to false. |
| `time_partitioning_func` | Function to convert incompatible primary time column values to compatible ones. The function must be `IMMUTABLE`. |
| `replication_factor` | If set to 1 or greater, will create a distributed hypertable. Values greater than 1 are currently not recommended. The default value is NULL. When creating a distributed hypertable, consider using [`create_distributed_hypertable`](#create_distributed_hypertable) in place of `create_hypertable`. |
| `data_nodes` | This is the set of data nodes that will be used for this table if it is distributed. This has no impact on non-distributed hypertables. If no data nodes are specified, a distributed hypertable will use all data nodes known by this instance. |
| `chunk_target_size` | DEPRECATED - The target size of a chunk (including indexes) in `kB`, `MB`, `GB`, or `TB`. Setting this to `estimate` or a non-zero chunk size, e.g., `2GB` will enable adaptive chunking (a DEPRECATED feature). The `estimate` setting will estimate a target chunk size based on system information. Adaptive chunking is disabled by default. |
| `chunk_sizing_func` | DEPRECATED - Allows setting a custom chunk sizing function for adaptive chunking (a DEPRECATED feature). The built-in chunk sizing function will be used by default. Note that `chunk_target_size` needs to be set to use this function.  |

#### Returns

|Column|Description|
|---|---|
| `hypertable_id` | ID of the hypertable in TimescaleDB. |
| `schema_name` | Schema name of the table converted to hypertable. |
| `table_name` | Table name of the table converted to hypertable. |
| `created` | True if the hypertable was created, false when `if_not_exists` is true and no hypertable was created. |

>:TIP: If you use `SELECT * FROM create_hypertable(...)` you will get the return value formatted
as a table with column headings.

>:WARNING: The use of the `migrate_data` argument to convert a non-empty table can
lock the table for a significant amount of time, depending on how much data is
in the table.
>
>If you would like finer control over index formation and other aspects
    of your hypertable, [follow these migration instructions instead][migrate-from-postgresql].
>
>When converting a normal SQL table to a hypertable, pay attention
to how you handle constraints. A hypertable can contain foreign keys to normal SQL table
columns, but the reverse is not allowed. UNIQUE and PRIMARY constraints must include the
partitioning key.
<!-- -->

#### Units [](create_hypertable-units)

The 'time' column supports the following data types:

| Types |
|---|
| Timestamp (TIMESTAMP, TIMESTAMPTZ) |
| DATE |
| Integer (SMALLINT, INT, BIGINT) |

>:TIP: The type flexibility of the 'time' column allows the use of non-time-based values as the primary chunk partitioning column, as long as those values can increment.

>:TIP: For incompatible data types (e.g. `jsonb`) you can specify a function to the
`time_partitioning_func` argument which can extract a compatible data type

The units of `chunk_time_interval` should be set as follows:

- For time columns having timestamp or DATE types, the
`chunk_time_interval` should be specified either as an `interval` type
or an integral value in *microseconds*.

- For integer types, the `chunk_time_interval` **must** be set
explicitly, as the database does not otherwise understand the
semantics of what each integer value represents (a second,
millisecond, nanosecond, etc.).  So if your time column is the number
of milliseconds since the UNIX epoch, and you wish to each chunk to
cover 1 day, you should specify `chunk_time_interval => 86400000`.

<!-- -->

In case of hash partitioning (i.e., `number_partitions` is greater
than zero), it is possible to optionally specify a custom partitioning
function. If no custom partitioning function is specified, the default
partitioning function is used. The default partitioning function calls
PostgreSQL's internal hash function for the given type, if one
exists. Thus, a custom partitioning function can be used for value
types that do not have a native PostgreSQL hash function. A
partitioning function should take a single `anyelement` type argument
and return a positive `integer` hash value. Note that this hash value
is _not_ a partition ID, but rather the inserted value's position in
the dimension's key space, which is then divided across the partitions.

The adaptive chunking feature is now deprecated and so we strongly
discourage people from using the `chunk_target_size` and
`chunk_sizing_func` parameters. These may be removed altogether in
the future.

<!-- -->
>:TIP: The time column in `create_hypertable` must be defined as `NOT
 NULL`.  If this is not already specified on table creation,
 `create_hypertable` will automatically add this constraint on the
 table when it is executed.

#### Sample Usage [](create_hypertable-examples)

Convert table `conditions` to hypertable with just time partitioning on column `time`:
```sql
SELECT create_hypertable('conditions', 'time');
```

Convert table `conditions` to hypertable, setting `chunk_time_interval` to 24 hours.
```sql
SELECT create_hypertable('conditions', 'time', chunk_time_interval => 86400000000);
SELECT create_hypertable('conditions', 'time', chunk_time_interval => interval '1 day');
```

Convert table `conditions` to hypertable with time partitioning on `time` and
space partitioning (4 partitions) on `location`:
```sql
SELECT create_hypertable('conditions', 'time', 'location', 4);
```

The same as above, but using a custom partitioning function:

```sql
SELECT create_hypertable('conditions', 'time', 'location', 4, partitioning_func => 'location_hash');
```

Convert table `conditions` to hypertable. Do not raise a warning
if `conditions` is already a hypertable:
```sql
SELECT create_hypertable('conditions', 'time', if_not_exists => TRUE);
```

Time partition table `measurements` on a composite column type `report` using a time partitioning function:
Requires an immutable function that can convert the column value into a supported column value:
```sql
CREATE TYPE report AS (reported timestamp with time zone, contents jsonb);

CREATE FUNCTION report_reported(report)
  RETURNS timestamptz
  LANGUAGE SQL
  IMMUTABLE AS
  'SELECT $1.reported';

SELECT create_hypertable('measurements', 'report', time_partitioning_func => 'report_reported');
```

Time partition table `events`, on a column type `jsonb` (`event`), which has
a top level key (`started`) containing an ISO 8601 formatted timestamp:
```sql
CREATE FUNCTION event_started(jsonb)
  RETURNS timestamptz
  LANGUAGE SQL
  IMMUTABLE AS
  $func$SELECT ($1->>'started')::timestamptz$func$;

SELECT create_hypertable('events', 'event', time_partitioning_func => 'event_started');
```


#### Best Practices [](create_hypertable-best-practices)

One of the most common questions users of TimescaleDB have revolves around
configuring `chunk_time_interval`.

**Time intervals:** The current release of TimescaleDB enables both
the manual and automated adaption of its time intervals. With
manually-set intervals, users should specify a `chunk_time_interval`
when creating their hypertable (the default value is 1 week). The
interval used for new chunks can be changed by calling [`set_chunk_time_interval()`](#set_chunk_time_interval).

The key property of choosing the time interval is that the chunk (including indexes) belonging to the most recent interval (or chunks if using space
partitions) fit into memory.  As such, we typically recommend setting
the interval so that these chunk(s) comprise no more than 25% of main
memory.

>:TIP: Make sure that you are planning for recent chunks from _all_ active hypertables to fit into 25% of main memory, rather than 25% per hypertable.

To determine this, you roughly need to understand your data rate.  If
you are writing roughly 2GB of data per day and have 64GB of memory,
setting the time interval to a week would be good.  If you are writing
10GB per day on the same machine, setting the time interval to a day
would be appropriate.  This interval would also hold if data is loaded
more in batches, e.g., you bulk load 70GB of data per week, with data
corresponding to records from throughout the week.

While it's generally safer to make chunks smaller rather than too
large, setting intervals too small can lead to *many* chunks, which
corresponds to increased planning latency for some types of queries.

>:TIP: One caveat is that the total chunk size is actually dependent on
both the underlying data size *and* any indexes, so some care might be
taken if you make heavy use of expensive index types (e.g., some
PostGIS geospatial indexes).  During testing, you might check your
total chunk sizes via the [`chunk_relation_size`](#chunk_relation_size)
function.

**Space partitions:** In most cases, it is advised for users not to use
space partitions. The rare cases in which space partitions may be useful
are described in the [add dimension][] section.

---

## create_distributed_hypertable() [](create_distributed_hypertable)

Creates a TimescaleDB hypertable distributed across a multinode
environment.  Use this function in place of [`create_hypertable`](#create_hypertable)
when creating distributed hypertables.

#### Required Arguments [](create_distributed_hypertable-required-arguments)

|Name|Description|
|---|---|
| `main_table` | Identifier of table to convert to hypertable |
| `time_column_name` | Name of the column containing time values as well as the primary column to partition by. |

#### Optional Arguments [](create_distributed_hypertable-optional-arguments)

|Name|Description|
|---|---|
| `partitioning_column` | Name of an additional column to partition by. If provided, the `number_partitions` argument must also be provided. |
| `number_partitions` | Number of hash partitions to use for `partitioning_column`. Must be > 0. |
| `chunk_time_interval` | Interval in event time that each chunk covers. Must be > 0. As of TimescaleDB v0.11.0, default is 7 days, unless adaptive chunking (DEPRECATED)  is enabled, in which case the interval starts at 1 day. For previous versions, default is 1 month. |
| `create_default_indexes` | Boolean whether to create default indexes on time/partitioning columns. Default is TRUE. |
| `if_not_exists` | Boolean whether to print warning if table already converted to hypertable or raise exception. Default is FALSE. |
| `partitioning_func` | The function to use for calculating a value's partition.|
| `associated_schema_name` | Name of the schema for internal hypertable tables. Default is "_timescaledb_internal". |
| `associated_table_prefix` | Prefix for internal hypertable chunk names. Default is "_hyper". |
| `migrate_data` | Set to `true` to migrate any existing `main_table` data to chunks in the new hypertable. A non-empty table will generate an error without this option. Note that, for large tables, the migration might take a long time. Defaults to false. |
| `time_partitioning_func` | Function to convert incompatible primary time column values to compatible ones. The function must be `IMMUTABLE`. |
| `replication_factor` | This will determine the number of data nodes each incoming write is written to.  The default value is 1 and this is required to be 1 or greater, but note that values greater than 1 are not recommended in the current implementation. |
| `data_nodes` | This is the set of data nodes that will be used for this table.  If this is not present then all data nodes known by this instance will be used to distribute the hypertable. | 
| `chunk_target_size` | DEPRECATED - The target size of a chunk (including indexes) in `kB`, `MB`, `GB`, or `TB`. Setting this to `estimate` or a non-zero chunk size, e.g., `2GB` will enable adaptive chunking (a DEPRECATED feature). The `estimate` setting will estimate a target chunk size based on system information. Adaptive chunking is disabled by default. |
| `chunk_sizing_func` | DEPRECATED - Allows setting a custom chunk sizing function for adaptive chunking (a DEPRECATED feature). The built-in chunk sizing function will be used by default. Note that `chunk_target_size` needs to be set to use this function.  |

#### Returns

|Column|Description|
|---|---|
| `hypertable_id` | ID of the hypertable in TimescaleDB. |
| `schema_name` | Schema name of the table converted to hypertable. |
| `table_name` | Table name of the table converted to hypertable. |
| `created` | True if the hypertable was created, false when `if_not_exists` is true and no hypertable was created. |

#### Sample Usage [](create_distributed_hypertable-examples)

Create a table `conditions` which will be partitioned across data
nodes by the 'location' column.  Note that the number of space
partitions is automatically equal to the number of data nodes assigned
to this hypertable (all configured data nodes in this case, as
`data_nodes` is not specified).
```sql
SELECT create_distributed_hypertable('conditions', 'time', 'location');
```

Create a table `conditions` using a specific set of data nodes.
```sql
SELECT create_distributed_hypertable('conditions', 'time', 'location',
    data_nodes => '{ "data_node_1", "data_node_2", "data_node_4", "data_node_7" }');
```

#### Best Practices [](create_distributed_hypertable-best-practices)

**Space partitions:** As opposed to the normal [`create_hypertable` best practices](#create_hypertable-best-practices),
space partitions are highly recommended for distributed hypertables.
Incoming data will be divided among data nodes based upon the space
partition (the first one if multiple space partitions have been
defined).  If there is no space partition, all the data for each time
slice will be written to a single data node.

**Time intervals:** Follow the same guideline in setting the `chunk_time_interval`
as with [`create_hypertable`](#create_hypertable-best-practices),
bearing in mind that the calculation needs to be based on the memory
capacity of the data nodes.  However, one additional thing to
consider, assuming space partitioning is being used, is that the
hypertable will be evenly distributed across the data nodes, allowing
a larger time interval.

For example, assume you are ingesting 10GB of data per day and you
have five data nodes, each with 64GB of memory.  If this is the only
table being served by these data nodes, then you should use a time 
interval of 1 week (7 * 10GB / 5 * 64GB ~= 22% main memory used for
most recent chunks).

If space partitioning is not being used, the `chunk_time_interval`
should be the same as the non-distributed case, as all of the incoming
data will be handled by a single node.

---

### CREATE INDEX (Transaction Per Chunk) [](create_index)

```SQL
CREATE INDEX ... WITH (timescaledb.transaction_per_chunk, ...);
```

This option extends [`CREATE INDEX`][postgres-createindex] with the
ability to use a separate transaction for each chunk it creates an
index on, instead of using a single transaction for the entire hypertable.
This allows `INSERT`s, and other operations to to be performed concurrently
during most of the duration of the `CREATE INDEX` command.
While the index is being created on an individual chunk, it functions as
if a regular `CREATE INDEX` were called on that chunk, however other chunks are
completely un-blocked.

>:TIP: This version of `CREATE INDEX` can be used as an alternative to `CREATE INDEX CONCURRENTLY`, which is not currently supported on hypertables.

>:WARNING: If the operation fails partway through, indexes may not be created on all hypertable chunks. If this occurs, the index on the root table of the hypertable will be marked as invalid (this can be seen by running `\d+` on the hypertable). The index will still work, and will be created on new chunks, but if you wish to ensure _all_ chunks have a copy of the index, drop and recreate it.

#### Sample Usage [](create_index-examples)

Anonymous index
```SQL
CREATE INDEX ON conditions(time, device_id) WITH (timescaledb.transaction_per_chunk);
```
Other index methods
```SQL
CREATE INDEX ON conditions(time, location) USING brin
  WITH (timescaledb.transaction_per_chunk);
```

## delete_data_node() [](delete_data_node)

This function will remove the data node locally. This will *not*
affect the remote database in any way, it will just update the local
index over all existing data nodes.

The data node will be detached from all hypertables that are using
it if permissions and data integrity requirements are satisfied. For
more information, see [`detach_data_node`](#detach_data_node).

#### Errors

An error will be generated if the data node cannot be detached from
all attached hypertables.

#### Required Arguments [](delete_data_node-required-arguments)

| Name        | Description            |
| ----------- | -----------            |
| `node_name` | Name of the data node. |

#### Optional Arguments [](delete_data_node-optional-arguments)

| Name        | Description                                           |
|-------------|-------------------------------------------------------|
| `if_exists` | Prevent error if the data node does not exist. Defaults to false. |
| `cascade`   | Cascade the delete so that all objects dependent on the data node are deleted as well. Defaults to false. |
| `force`     | Force removal of data nodes from hypertables unless that would result in data loss.  Defaults to false. |

#### Returns [](delete_data_node-returns)

A boolean indicating if the operation was successful or not.

#### Sample usage [](delete_data_node-examples)

To delete a data node named `dn1`:
```sql
SELECT delete_data_node('dn1');
```

---
## detach_data_node() [](detach_data_node)

Detach a data node from one hypertable or from all hypertables.

Reasons for detaching a data node:

- A data node should no longer be used by a hypertable and needs to be
removed from all hypertables that use it
- You want to have fewer data nodes for a distributed hypertable to
partition across

#### Required Arguments [](detach_data_node-required-arguments)

| Name        | Description                       |
|-------------|-----------------------------------|
| `node_name` | Name of data node to detach from the distributed hypertable |

#### Optional Arguments [](detach_data_node-optional-arguments)

| Name         | Description                            |
|--------------|----------------------------------------|
| `hypertable` | Name of the distributed hypertable where the data node should be attached. If NULL, the data node will be detached from all hypertables. |
| `force`      | Force detach of the data node even if that means that the replication factor is reduced below what was set. Note that it will never be allowed to reduce the replication factor below 1 since that would cause data loss.         |

#### Returns

| Column               | Description                              |
|----------------------|------------------------------------------|
| `hypertable_id`      | Hypertable id of the modified hypertable |
| `node_hypertable_id` | Hypertable id on the remote data node    |
| `node_name`          | Name of the attached data node     |

#### Errors

Detaching a node is not permitted:
- If it would result in data loss for the hypertable due to the data node
containing chunks that are not replicated on other data nodes
- If it would result in under-replicated chunks for the distributed hypertable
(without the `force` argument)

>:TIP: Replication is currently experimental, and not a supported feature

Detaching a data node is under no circumstances possible if that would
mean data loss for the hypertable. Nor is it possible to detach a data node,
unless forced, if that would mean that the distributed hypertable would end
up with under-replicated chunks.

The only safe way to detach a data node is to first safely delete any
data on it or replicate it to another data node.

#### Sample Usage [](detach_data_node-examples)

Detach data node `dn3` from `conditions`:

```sql
SELECT detach_data_node('conditions', 'dn3');
```

---
### detach_tablespace() [](detach_tablespace)

Detach a tablespace from one or more hypertables. This _only_ means
that _new_ chunks will not be placed on the detached tablespace. This
is useful, for instance, when a tablespace is running low on disk
space and one would like to prevent new chunks from being created in
the tablespace. The detached tablespace itself and any existing chunks
with data on it will remain unchanged and will continue to work as
before, including being available for queries. Note that newly
inserted data rows may still be inserted into an existing chunk on the
detached tablespace since existing data is not cleared from a detached
tablespace. A detached tablespace can be reattached if desired to once
again be considered for chunk placement.

#### Required Arguments [](detach_tablespace-required-arguments)

|Name|Description|
|---|---|
| `tablespace` | Name of the tablespace to detach.|

When giving only the tablespace name as argument, the given tablespace
will be detached from all hypertables that the current role has the
appropriate permissions for. Therefore, without proper permissions,
the tablespace may still receive new chunks after this command
is issued.


#### Optional Arguments [](detach_tablespace-optional-arguments)

|Name|Description|
|---|---|
| `hypertable` | Identifier of hypertable to detach a the tablespace from.|
| `if_attached` | Set to true to avoid throwing an error if the tablespace is not attached to the given table. A notice is issued instead. Defaults to false. |


When specifying a specific hypertable, the tablespace will only be
detached from the given hypertable and thus may remain attached to
other hypertables.

#### Sample Usage [](detach_tablespace-examples)

Detach the tablespace `disk1` from the hypertable `conditions`:

```sql
SELECT detach_tablespace('disk1', 'conditions');
SELECT detach_tablespace('disk2', 'conditions', if_attached => true);
```

Detach the tablespace `disk1` from all hypertables that the current
user has permissions for:

```sql
SELECT detach_tablespace('disk1');
```

---

### detach_tablespaces() [](detach_tablespaces)

Detach all tablespaces from a hypertable. After issuing this command
on a hypertable, it will no longer have any tablespaces attached to
it. New chunks will instead be placed in the database's default
tablespace.

#### Required Arguments [](detach_tablespaces-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | Identifier of hypertable to detach a the tablespace from.|

#### Sample Usage [](detach_tablespaces-examples)

Detach all tablespaces from the hypertable `conditions`:

```sql
SELECT detach_tablespaces('conditions');
```

---

### drop_chunks() [](drop_chunks)

Removes data chunks whose time range falls completely before (or after) a
specified time, operating either across all hypertables or for a specific one.

Chunks are defined by a certain start and end time.  If `older_than` is
specified, a chunk is dropped if its end time is older than the specified
timestamp. Alternatively, if `newer_than` is specified, a chunk is dropped if
its start time is newer than the specified timestamp.  Note that, because
chunks are removed if and only if their time range falls fully before (or
after) the specified timestamp, the remaining data may still contain timestamps
that are before (or after) the specified one.

#### Required Arguments [](drop_chunks-required-arguments)

Function requires at least one of the following arguments. These arguments have
the same semantics as the `show_chunks` [function][show chunks].

|Name|Description|
|---|---|
| `older_than` | Specification of cut-off point where any full chunks older than this timestamp should be removed. |
| `newer_than` | Specification of cut-off point where any full chunks newer than this timestamp should be removed. |

#### Optional Arguments [](drop_chunks-optional-arguments)

|Name|Description|
|---|---|
| `table_name` | Hypertable name from which to drop chunks. If not supplied, all hypertables are affected.
| `schema_name` | Schema name of the hypertable from which to drop chunks. Defaults to `public`.
| `cascade` | Boolean on whether to `CASCADE` the drop on chunks, therefore removing dependent objects on chunks to be removed. Defaults to `FALSE`.
| `cascade_to_materializations` | Set to `TRUE` to delete chunk data in associated continuous aggregates. Defaults to `NULL`. `FALSE` is not yet supported.

The `older_than` and `newer_than` parameters can be specified in two ways:

- **interval type:** The cut-off point is computed as `now() -
    older_than` and similarly `now() - newer_than`.  An error will be returned if an INTERVAL is supplied
    and the time column is not one of a TIMESTAMP, TIMESTAMPTZ, or
    DATE.

- **timestamp, date, or integer type:** The cut-off point is
    explicitly given as a TIMESTAMP / TIMESTAMPTZ / DATE or as a
    SMALLINT / INT / BIGINT. The choice of timestamp or integer must follow the type of the hypertable's time column.


>:WARNING: When using just an interval type, the function assumes that
you are are removing things _in the past_. If you want to remove data
in the future (i.e., erroneous entries), use a timestamp.

When both arguments are used, the function returns the intersection of the resulting two ranges. For example,
specifying `newer_than => 4 months` and `older_than => 3 months` will drop all full chunks that are between 3 and
4 months old. Similarly, specifying `newer_than => '2017-01-01'` and `older_than => '2017-02-01'` will drop
all full chunks between '2017-01-01' and '2017-02-01'. Specifying parameters that do not result in an overlapping
intersection between two ranges will result in an error.

>:TIP: By default, calling `drop_chunks` on a table that has a continuous aggregate will throw an error. This can be resolved by setting `cascade_to_materializations` to `TRUE`, which will cause the corresponding aggregated data to also be dropped.

#### Sample Usage [](drop_chunks-examples)

Drop all chunks older than 3 months ago:
```sql
SELECT drop_chunks(interval '3 months');
```

The expected output:

```sql
 drop_chunks
-------------

(1 row)
```

Drop all chunks more than 3 months in the future. This is useful for correcting data ingested with incorrect clocks:
```sql
SELECT drop_chunks(newer_than => now() + interval '3 months');
```

Drop all chunks from hypertable `conditions` older than 3 months:
```sql
SELECT drop_chunks(interval '3 months', 'conditions');
```

Drop all chunks from hypertable `conditions` before 2017:
```sql
SELECT drop_chunks('2017-01-01'::date, 'conditions');
```

Drop all chunks from hypertable `conditions` before 2017, where time column is given in milliseconds from the UNIX epoch:
```sql
SELECT drop_chunks(1483228800000, 'conditions');
```

Drop all chunks from hypertable `conditions` older than 3 months, including dependent objects (e.g., views):
```sql
SELECT drop_chunks(interval '3 months', 'conditions', cascade => TRUE);
```

Drop all chunks newer than 3 months ago:
```sql
SELECT drop_chunks(newer_than => interval '3 months');
```

Drop all chunks older than 3 months ago and newer than 4 months ago:
```sql
SELECT drop_chunks(older_than => interval '3 months', newer_than => interval '4 months', table_name => 'conditions')
```

Drop all chunks older than 3 months, and delete this data from any continuous aggregates based on it:
```sql
SELECT drop_chunks(interval '3 months', 'conditions', cascade_to_materializations => true);
```

---

### set_chunk_time_interval() [](set_chunk_time_interval)
Sets the chunk_time_interval on a hypertable. The new interval is used
when new chunks are created but the time intervals on existing chunks are
not affected.

#### Required Arguments [](set_chunk_time_interval-required-arguments)

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to update interval for.|
| `chunk_time_interval` | Interval in event time that each new chunk covers. Must be > 0.|

#### Optional Arguments [](set_chunk_time_interval-optional-arguments)
| Name | Description |
|---|---|
| `dimension_name` | The name of the time dimension to set the number of partitions for.  Only used when hypertable has multiple time dimensions. |

The valid types for the `chunk_time_interval` depend on the type of
hypertable time column:

- **TIMESTAMP, TIMESTAMPTZ, DATE:** The specified
    `chunk_time_interval` should be given either as an INTERVAL type
    (`interval '1 day'`) or as an
    integer or bigint value (representing some number of microseconds).

- **INTEGER:** The specified `chunk_time_interval` should be an
    integer (smallint, int, bigint) value and represent the underlying
    semantics of the hypertable's time column, e.g., given in
    milliseconds if the time column is expressed in milliseconds
    (see `create_hypertable` [instructions](#create_hypertable)).

#### Sample Usage [](set_chunk_time_interval-examples)

For a TIMESTAMP column, set `chunk_time_interval` to 24 hours.
```sql
SELECT set_chunk_time_interval('conditions', interval '24 hours');
SELECT set_chunk_time_interval('conditions', 86400000000);
```

For a time column expressed as the number of milliseconds since the
UNIX epoch, set `chunk_time_interval` to 24 hours.
```sql
SELECT set_chunk_time_interval('conditions', 86400000);
```

---

### DEPRECATED set_adaptive_chunking() [](set_adaptive_chunking)

>:WARNING: The adaptive chunking feature is now deprecated and should not be used.

Changes the settings for adaptive chunking. The
function returns the configured chunk sizing function and the target
chunk size in bytes. This change will impact how and when new chunks
are created; it does not modify the intervals of existing chunks.

#### Required Arguments [](set_adaptive_chunking-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | Identifier of hypertable to update the settings for.|
| `chunk_target_size` | The target size of a chunk (including indexes) in `kB`, `MB`, `GB`, or `TB`. Setting this to `estimate` or a non-zero chunk size, e.g., `2GB` will enable adaptive chunking. The `estimate` setting will estimate a target chunk size based on system information. Adaptive chunking is disabled by default. |

#### Optional Arguments [](set_adaptive_chunking-optional-arguments)
| Name | Description |
|---|---|
| `chunk_sizing_func` | Allows setting a custom chunk sizing function for adaptive chunking. The built-in chunk sizing function will be used by default. Note that `chunk_target_size` needs to be set to use this function. |


---

## set_number_partitions() [](set_number_partitions)
Sets the number of partitions (slices) of a space dimension on a
hypertable. The new partitioning only affects new chunks.

#### Required Arguments [](set_number_partitions-required-arguments)

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to update the number of partitions for.|
| `number_partitions` | The new number of partitions for the dimension. Must be greater than 0 and less than 32,768.|

#### Optional Arguments [](set_number_partitions-optional-arguments)

|Name|Description|
|---|---|
| `dimension_name` | The name of the space dimension to set the number of partitions for.|

The `dimension_name` needs to be explicitly specified only if the
hypertable has more than one space dimension. An error will be thrown
otherwise.

#### Sample Usage [](set_number_partition-examples)

For a table with a single space dimension:
```sql
SELECT set_number_partitions('conditions', 2);
```

For a table with more than one space dimension:
```sql
SELECT set_number_partitions('conditions', 2, 'device_id');
```

---

### show_chunks() [](show_chunks)
Get list of chunks associated with hypertables.

#### Optional Arguments [](show_chunks-optional-arguments)

Function accepts the following arguments. These arguments have
the same semantics as the `drop_chunks` [function][drop chunks].

|Name|Description|
|---|---|
| `hypertable` | Hypertable name from which to select chunks. If not supplied, all chunks are shown. |
| `older_than` | Specification of cut-off point where any full chunks older than this timestamp should be shown. |
| `newer_than` | Specification of cut-off point where any full chunks newer than this timestamp should be shown. |

The `older_than` and `newer_than` parameters can be specified in two ways:

- **interval type:** The cut-off point is computed as `now() -
    older_than` and similarly `now() - newer_than`.  An error will be returned if an INTERVAL is supplied
    and the time column is not one of a TIMESTAMP, TIMESTAMPTZ, or
    DATE.

- **timestamp, date, or integer type:** The cut-off point is
    explicitly given as a TIMESTAMP / TIMESTAMPTZ / DATE or as a
    SMALLINT / INT / BIGINT. The choice of timestamp or integer must follow the type of the hypertable's time column.

When both arguments are used, the function returns the intersection of the resulting two ranges. For example,
specifying `newer_than => 4 months` and `older_than => 3 months` will show all full chunks that are between 3 and
4 months old. Similarly, specifying `newer_than => '2017-01-01'` and `older_than => '2017-02-01'` will show
all full chunks between '2017-01-01' and '2017-02-01'. Specifying parameters that do not result in an overlapping
intersection between two ranges will result in an error.

#### Sample Usage [](show_chunks-examples)

Get list of all chunks. Returns 0 if there are no hypertables:
```sql
SELECT show_chunks();
```

The expected output:
```sql
 show_chunks
---------------------------------------
 _timescaledb_internal._hyper_1_10_chunk
 _timescaledb_internal._hyper_1_11_chunk
 _timescaledb_internal._hyper_1_12_chunk
 _timescaledb_internal._hyper_1_13_chunk
 _timescaledb_internal._hyper_1_14_chunk
 _timescaledb_internal._hyper_1_15_chunk
 _timescaledb_internal._hyper_1_16_chunk
 _timescaledb_internal._hyper_1_17_chunk
 _timescaledb_internal._hyper_1_18_chunk
```

Get list of all chunks associated with a table:
```sql
SELECT show_chunks('conditions');
```

Get all chunks older than 3 months:
```sql
SELECT show_chunks(older_than => interval '3 months');
```

Get all chunks more than 3 months in the future. This is useful for showing data ingested with incorrect clocks:
```sql
SELECT show_chunks(newer_than => now() + interval '3 months');
```

Get all chunks from hypertable `conditions` older than 3 months:
```sql
SELECT show_chunks('conditions', older_than => interval '3 months');
```

Get all chunks from hypertable `conditions` before 2017:
```sql
SELECT show_chunks('conditions', older_than => '2017-01-01'::date);
```

Get all chunks newer than 3 months:
```sql
SELECT show_chunks(newer_than => interval '3 months');
```

Get all chunks older than 3 months and newer than 4 months:
```sql
SELECT show_chunks(older_than => interval '3 months', newer_than => interval '4 months');
```

---
### reorder_chunk() :community_function: [](reorder_chunk)

Reorder a single chunk's heap to follow the order of an index. This function
acts similarly to the [PostgreSQL CLUSTER command][postgres-cluster] , however
it uses lower lock levels so that, unlike with the CLUSTER command,  the chunk
and hypertable are able to be read for most of the process. It does use a bit
more disk space during the operation.

This command can be particularly useful when data is often queried in an order
different from that in which it was originally inserted. For example, data is
commonly inserted into a hypertable in loose time order (e.g., many devices
concurrently sending their current state), but one might typically query the
hypertable about a _specific_ device. In such cases, reordering a chunk using an
index on `(device_id, time)` can lead to significant performance improvement for
these types of queries.

One can call this function directly on individual chunks of a hypertable, but
using [add_reorder_policy](#add_reorder_policy) is often much more convenient.

#### Required Arguments [](reorder_chunk-required-arguments)

|Name|Description|
|---|---|
| `chunk` | (REGCLASS) Name of the chunk to reorder. |

#### Optional Arguments [](reorder_chunk-optional-arguments)

|Name|Description|
|---|---|
| `index` | (REGCLASS) The name of the index (on either the hypertable or chunk) to order by.|
| `verbose` | (BOOLEAN) Setting to true will display messages about the progress of the reorder command. Defaults to false.|

#### Returns [](reorder_chunk-returns)

This function returns void.


#### Sample Usage [](reorder_chunk-examples)


```sql
SELECT reorder_chunk('_timescaledb_internal._hyper_1_10_chunk', 'conditions_device_id_time_idx');
```

runs a reorder on the `_timescaledb_internal._hyper_1_10_chunk` chunk using the `conditions_device_id_time_idx` index.

---
## Continuous Aggregates :community_function: [](continuous-aggregates)
TimescaleDB allows users the ability to automatically recompute aggregates
at predefined intervals and materialize the results. This is suitable for
frequently used queries. For a more detailed discussion of this capability,
please see [using TimescaleDB Continuous Aggregates][using-continuous-aggs].

*  [CREATE VIEW](#continuous_aggregate-create_view)
*  [ALTER VIEW](#continuous_aggregate-alter_view)
*  [REFRESH MATERIALIZED VIEW](#continuous_aggregate-refresh_view)
*  [DROP VIEW](#continuous_aggregate-drop_view)

## CREATE VIEW (Continuous Aggregate) :community_function: [](continuous_aggregate-create_view)
`CREATE VIEW` statement is used to create continuous aggregates.

The syntax is:
``` sql
CREATE VIEW <view_name> [ ( column_name [, ...] ) ]
WITH ( timescaledb.continuous [, timescaledb.<option> = <value> ] )
AS
<select_query>
```

`<select_query>` is of the form :

```sql
SELECT <grouping_exprs>, <aggregate_functions>
    FROM <hypertable>
[WHERE ... ]
GROUP BY <time_bucket( <const_value>, <partition_col_of_hypertable> ),
         [ optional grouping exprs>]
[HAVING ...]
```

#### Parameters
|Name|Description|
|---|---|
| `<view_name>` | Name (optionally schema-qualified) of continuous aggregate view to be created.|
| `<column_name>`| Optional list of names to be used for columns of the view. If not given, the column names are deduced from the query.|
| `WITH` clause | This clause specifies [options](#create-view-with) for the continuous aggregate view.|
| `<select_query>`| A `SELECT` query that uses the specified syntax. |

#### `WITH` clause options [](create-view-with)
|Name|Description|Type|Default|
|---|---|---|---|
|**Required**|
|`timescaledb.continuous`|If timescaledb.continuous is not specified, then this is a regular PostgresSQL view. |||
|**Optional**|
|`timescaledb.refresh_lag`|Refresh lag controls the amount by which the materialization will lag behind the maximum current time value. The continuous aggregate view lags behind by `bucket_width` + `refresh_lag` value. `refresh_lag` can be set to positive and negative values. | Same datatype as the `bucket_width` argument from the `time_bucket` expression.| The default value is twice the bucket width (as specified by the `time_bucket` expression).|
|`timescaledb.refresh_interval`|Refresh interval controls how often the background materializer is run. Note that if `refresh_lag` is set to `-<bucket_width>`, the continuous aggregate will run whenever new data is received, regardless of what the `refresh_interval` value is. | `INTERVAL`|By default, this is set to twice the bucket width (if the datatype of the bucket_width argument from the `time_bucket` expression is an `INTERVAL`), otherwise it is set to 12 hours.|
|`timescaledb.max_interval_per_job`|Max interval per job specifies the amount of data processed by the background materializer job when the continuous aggregate is updated. | Same datatype as the `bucket_width` argument from the `time_bucket` expression.| The default value is `20 * bucket width`.|
|`timescaledb.create_group_indexes`|Create indexes on the materialization table for the group by columns (specified by the `GROUP BY` clause of the `SELECT` query). | `BOOLEAN` | Indexes are created by default for every group by expression + time_bucket expression pair.|

>:TIP: Say, the continuous aggregate uses time_bucket('2h', time_column) and we want to keep the view up to date with the data. We can do this by modifying the `refresh_lag` setting. Set refresh_lag to `-2h`. E.g. `ALTER VIEW contview set (timescaledb.refresh_lag = '-2h');` Please refer to the [caveats][].

#### Restrictions
- Only one continuous aggregate is permitted per hypertable. Multiple continuous aggregates will be supported
in future versions.
- `SELECT` query should be of the form specified in the syntax above.
- The hypertable used in the `SELECT` may not have [row-level-security policies][postgres-rls] enabled.
-  `GROUP BY` clause must include a time_bucket expression. The [`time_bucket`][time-bucket] expression must use the time dimension column of the hypertable.
- [`time_bucket_gapfill`][time-bucket-gapfill] is not allowed in continuous
  aggs, but may be run in a `SELECT` from the continuous aggregate view.
- In general, aggregates which can be [parallelized by PostgreSQL][postgres-parallel-agg] are allowed in the view definition, this
  includes most aggregates distributed with PostgreSQL. Aggregates with `ORDER BY`,
  `DISTINCT` and `FILTER` clauses are not permitted.
* All functions and their arguments included in `SELECT`, `GROUP BY` and `HAVING` clauses must be [immutable][postgres-immutable].
- Queries with `ORDER BY` are disallowed.
- The view is not allowed to be a [security barrier view][postgres-security-barrier].

[time-bucket]: /api#time_bucket
[time-bucket-gapfill]: /api#time_bucket_gapfill
[postgres-immutable]:https://www.postgresql.org/docs/current/xfunc-volatility.html
[postgres-parallel-agg]:https://www.postgresql.org/docs/current/parallel-plans.html#PARALLEL-AGGREGATION
[postgres-rls]:https://www.postgresql.org/docs/current/ddl-rowsecurity.html
[postgres-security-barrier]:https://www.postgresql.org/docs/current/rules-privileges.html

>:TIP: You can find the [settings for continuous aggregates](#timescaledb_information-continuous_aggregate) and
[statistics](#timescaledb_information-continuous_aggregate_stats) in `timescaledb_information` views.

#### Examples [](continuous_aggregate-create-examples)
Create a continuous aggregate view.
```sql
CREATE VIEW continuous_aggregate_view( timec, minl, sumt, sumh )
WITH ( timescaledb.continuous,
    timescaledb.refresh_lag = '5 hours',
    timescaledb.refresh_interval = '1h' )
AS
    SELECT time_bucket('1day', timec), min(location), sum(temperature), sum(humidity)
        FROM conditions
        GROUP BY time_bucket('1day', timec), location, humidity, temperature;
```

>:TIP: In order to keep the continuous aggregate up to date with incoming data,
the refresh lag can be set to `-<bucket_width>`. Please note that by doing so,
you will incur higher write amplification and incur performance penalties.

```sql
CREATE VIEW continuous_aggregate_view( timec, minl, sumt, sumh )
WITH (timescaledb.continuous,
    timescaledb.refresh_lag = '-1h',
    timescaledb.refresh_interval = '30m')
AS
  SELECT time_bucket('1h', timec), min(location), sum(temperature), sum(humidity)
    FROM conditions
    GROUP BY time_bucket('1h', timec), location, humidity, temperature;
```

---

### ALTER VIEW (Continuous Aggregate) :community_function: [](continuous_aggregate-alter_view)
`ALTER VIEW` statement can be used to modify the `WITH` clause [options](#create-view-with) for the continuous aggregate view.

``` sql
ALTER VIEW <view_name> SET ( timescaledb.option =  <value> )
```
#### Parameters
|Name|Description|
|---|---|
| `<view_name>` | Name (optionally schema-qualified) of continuous aggregate view to be created.|

#### Examples [](continuous_aggregate-alter-examples)
Set the max interval processed by a materializer job (that updates the continuous aggregate) to 1 week.
```sql
ALTER VIEW contagg_view SET (timescaledb.max_interval_per_job = '1 week');
```
Set the refresh lag to 1 hour, the refresh interval to 30 minutes and the max
interval processed by a job to 1 week for the continuous aggregate.
```sql
ALTER VIEW contagg_view SET (timescaledb.refresh_lag = '1h', timescaledb.max_interval_per_job = '1 week', timescaledb.refresh_interval = '30m');

```
>:TIP: Only WITH options can be modified using the ALTER statment. If
you need to change any other parameters, drop the view and create a new one.

---

## REFRESH MATERIALIZED VIEW (Continuous Aggregate) :community_function: [](continuous_aggregate-refresh_view)
The continuous aggregate view can be manually updated by using `REFRESH MATERIALIZED VIEW` statement. A background materializer job will run immediately and update the
 continuous aggregate.
``` sql
REFRESH MATERIALIZED VIEW <view_name>
```
#### Parameters
|Name|Description|
|---|---|
| `<view_name>` | Name (optionally schema-qualified) of continuous aggregate view to be created.|

#### Examples [](continuous_aggregate-refresh-examples)
Update the continuous aggregate view immediately.
```sql
REFRESH MATERIALIZED VIEW contagg_view;
```
---

>:TIP: Note that max_interval_per_job and refresh_lag parameter settings are used by the materialization job
when the REFRESH is run. So the materialization (of the continuous aggregate) does not necessarily include
all the updates to the hypertable.


### DROP VIEW (Continuous Aggregate) :community_function: [](continuous_aggregate-drop_view)
Continuous aggregate views can be dropped using `DROP VIEW` statement.

This deletes the hypertable that stores the materialized data for the
continuous aggregate; it does not affect the data in the underlying hypertable
from which the continuous aggregate is derived (i.e., the raw data).  The
`CASCADE` parameter is required for this command.

``` sql
DROP VIEW <view_name> CASCADE;
```
#### Parameters
|Name|Description|
|---|---|
| `<view_name>` | Name (optionally schema-qualified) of continuous aggregate view to be created.|

#### Examples [](continuous_aggregate-drop-examples)
Drop existing continuous aggregate.
```sql
DROP VIEW contagg_view CASCADE;
```
>:WARNING: `CASCADE` will drop those objects that depend on the continuous
aggregate, such as views that are built on top of the continuous aggregate view.```


---
## Automation policies :enterprise_function: [](automation-policies)
TimescaleDB includes an automation framework for allowing background tasks to
run inside the database, controllable by user-supplied policies. These tasks
currently include capabilities around data retention and data reordering for
improving query performance.

The following functions allow the administrator to create/remove/alter policies
that schedule administrative actions to take place on a hypertable. The actions
are meant to implement data retention or perform tasks that will improve query
performance on older chunks. Each policy is assigned a scheduled job
which will be run in the background to enforce it.

## add_drop_chunks_policy() :enterprise_function: [](add_drop_chunks_policy)
Create a policy to drop chunks older than a given interval of a particular
hypertable on a schedule in the background. (See [drop_chunks](#drop_chunks)).
This implements a data retention policy and will remove data on a schedule. Only
one drop_chunks policy may exist per hypertable.

#### Required Arguments [](add_drop_chunks_policy-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Name of the hypertable to create the policy for. |
| `older_than` | (INTERVAL) Chunks fully older than this interval when the policy is run will be dropped|

#### Optional Arguments [](add_drop_chunks_policy-optional-arguments)

|Name|Description|
|---|---|
| `cascade` | (BOOLEAN) Set to true to drop objects dependent upon chunks being dropped. Defaults to false.|
| `if_not_exists` | (BOOLEAN) Set to true to avoid throwing an error if the drop_chunks_policy already exists. A notice is issued instead. Defaults to false. |
| `cascade_to_materializations` | (BOOLEAN) Set to `TRUE` to delete chunk data in associated continuous aggregates. Defaults to `NULL`. `FALSE` is not yet supported. |

>:WARNING: If a drop chunks policy is setup which does not set `cascade_to_materializations` to `TRUE` on a hypertable that has a continuous aggregate, the policy will not drop any chunks.

#### Returns [](add_drop_chunks_policy-returns)

|Column|Description|
|---|---|
|`job_id`| (INTEGER)  TimescaleDB background job id created to implement this policy|


#### Sample Usage [](add_drop_chunks_policy-examples)


```sql
SELECT add_drop_chunks_policy('conditions', INTERVAL '6 months');
```

creates a data retention policy to discard chunks greater than 6 months old.

---
## remove_drop_chunks_policy() :enterprise_function: [](remove_drop_chunks_policy)
Remove a policy to drop chunks of a particular hypertable.

#### Required Arguments [](remove_drop_chunks_policy-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Name of the hypertable to create the policy for. |


#### Optional Arguments [](remove_drop_chunks_policy-optional-arguments)

|Name|Description|
|---|---|
| `if_exists` | (BOOLEAN)  Set to true to avoid throwing an error if the drop_chunks_policy does not exist. Defaults to false.|


#### Sample Usage [](remove_drop_chunks_policy-examples)


```sql
SELECT remove_drop_chunks_policy('conditions');
```

removes the existing data retention policy for the `conditions` table.


---
### add_reorder_policy() :enterprise_function: [](add_reorder_policy)
Create a policy to reorder chunks older on a given hypertable index in the
background. (See [reorder_chunk](#reorder_chunk)). Only one reorder policy may
exist per hypertable. Only chunks that are the 3rd from the most recent will be
reordered to avoid reordering chunks that are still being inserted into.

>:TIP: Once a chunk has been reordered by the background worker it will not be
reordered again. So if one were to insert significant amounts of data in to
older chunks that have already been reordered, it might be necessary to manually
re-run the [reorder_chunk](#reorder_chunk) function on older chunks, or to drop
and re-create the policy if many older chunks have been affected.

#### Required Arguments [](add_reorder_policy-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Name of the hypertable to create the policy for. |
| `index_name` | (NAME) Existing index by which to order rows on disk. |

#### Optional Arguments [](add_reorder_policy-optional-arguments)

|Name|Description|
|---|---|
| `if_not_exists` | (BOOLEAN)  Set to true to avoid throwing an error if the reorder_policy already exists. A notice is issued instead. Defaults to false. |

#### Returns [](add_reorder_policy-returns)

|Column|Description|
|---|---|
|`job_id`| (INTEGER) TimescaleDB background job id created to implement this policy|


#### Sample Usage [](add_reorder_policy-examples)


```sql
SELECT add_reorder_policy('conditions', 'conditions_device_id_time_idx');
```

creates a policy to reorder completed chunks by the existing `(device_id, time)` index. (See [reorder_chunk](#reorder_chunk)).

---
## remove_reorder_policy() :enterprise_function: [](remove_reorder_policy)
Remove a policy to reorder a particular hypertable.

#### Required Arguments [](remove_reorder_policy-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Name of the hypertable from which to remove the policy. |


#### Optional Arguments [](remove_reorder_policy-optional-arguments)

|Name|Description|
|---|---|
| `if_exists` | (BOOLEAN)  Set to true to avoid throwing an error if the reorder_policy does not exist. A notice is issued instead. Defaults to false. |


#### Sample Usage [](remove_reorder_policy-examples)


```sql
SELECT remove_reorder_policy('conditions', if_exists => true);
```

removes the existing reorder policy for the `conditions` table if it exists.

---


### alter_job_schedule() :enterprise_function: [](alter_job_schedule)

Policy jobs are scheduled to run periodically via a job run in a background
worker. You can change the schedule using `alter_job_schedule`. To alter an
existing job, you must refer to it by `job_id`. The `job_id` which implements a
given policy and its current schedule can be found in views in the
`timescaledb_information` schema corresponding to different types of policies or
in the general `timescaledb_information.policy_stats` view. This view
additionally contains information about when each job was last run and other
useful statistics for deciding what the new schedule should be.

>:TIP: Altering the schedule will only change the frequency at which the
background worker checks the policy. If you need to change the data retention
interval or reorder by a different index, you'll need to remove the policy and
add a new one.

#### Required Arguments [](alter_job_schedule-required-arguments)

|Name|Description|
|---|---|
| `job_id` | (INTEGER) the id of the policy job being modified |


#### Optional Arguments [](alter_job_schedule-optional-arguments)

|Name|Description|
|---|---|
| `schedule_interval` | (INTERVAL)  The interval at which the job runs |
| `max_runtime` | (INTERVAL) The maximum amount of time the job will be allowed to run by the background worker scheduler before it is stopped |
| `max_retries` | (INTEGER)  The number of times the job will be retried should it fail |
| `retry_period` | (INTERVAL) The amount of time the scheduler will wait between retries of the job on failure |
| `if_exists` | (BOOLEAN)  Set to true to avoid throwing an error if the job does not exist, a notice will be issued instead. Defaults to false. |

#### Returns [](alter_job_schedule-returns)

|Column|Description|
|---|---|
| `schedule_interval` | (INTERVAL)  The interval at which the job runs |
| `max_runtime` | (INTERVAL) The maximum amount of time the job will be allowed to run by the background worker scheduler before it is stopped |
| `max_retries` | (INTEGER)  The number of times the job will be retried should it fail |
| `retry_period` | (INTERVAL) The amount of time the scheduler will wait between retries of the job on failure |

#### Sample Usage [](alter_job_schedule-examples)

```sql
SELECT alter_job_schedule(job_id, schedule_interval => INTERVAL '2 days')
FROM timescaledb_information.reorder_policies
WHERE hypertable = 'conditions';
```
reschedules the reorder policy job for the `conditions` table so that it runs every two days.

---
## Analytics [](analytics)

### first() [](first)

The `first` aggregate allows you to get the value of one column
as ordered by another. For example, `first(temperature, time)` will return the
earliest temperature value based on time within an aggregate group.

#### Required Arguments [](first-required-arguments)

|Name|Description|
|---|---|
| `value` | The value to return (anyelement) |
| `time` | The timestamp to use for comparison (TIMESTAMP/TIMESTAMPTZ or integer type)  |

#### Examples [](first-examples)

Get the earliest temperature by device_id:
```sql
SELECT device_id, first(temp, time)
FROM metrics
GROUP BY device_id;
```

>:WARNING: The `last` and `first` commands do **not** use indexes, and instead
 perform a sequential scan through their groups.  They are primarily used
 for ordered selection within a `GROUP BY` aggregate, and not as an
 alternative to an `ORDER BY time DESC LIMIT 1` clause to find the
 latest value (which will use indexes).

---

### histogram() [](histogram)

The `histogram()` function represents the distribution of a set of
values as an array of equal-width buckets. It partitions the dataset
into a specified number of buckets (`nbuckets`) ranging from the
inputted `min` and `max` values.

The return value is an array containing `nbuckets`+2 buckets, with the
middle `nbuckets` bins for values in the stated range, the first
bucket at the head of the array for values under the lower `min` bound,
and the last bucket for values greater than or equal to the `max` bound.
Each bucket is inclusive on its lower bound, and exclusive on its upper
bound. Therefore, values equal to the `min` are included in the bucket
starting with `min`, but values equal to the `max` are in the last bucket.

#### Required Arguments [](histogram-required-arguments)

|Name|Description|
|---|---|
| `value` | A set of values to partition into a histogram |
| `min` | The histogram’s lower bound used in bucketing (inclusive) |
| `max` | The histogram’s upper bound used in bucketing (exclusive) |
| `nbuckets` | The integer value for the number of histogram buckets (partitions) |

#### Sample Usage [](histogram-examples)

A simple bucketing of device's battery levels from the `readings` dataset:

```sql
SELECT device_id, histogram(battery_level, 20, 60, 5)
FROM readings
GROUP BY device_id
LIMIT 10;
```

The expected output:
```sql
 device_id  |          histogram
------------+------------------------------
 demo000000 | {0,0,0,7,215,206,572}
 demo000001 | {0,12,173,112,99,145,459}
 demo000002 | {0,0,187,167,68,229,349}
 demo000003 | {197,209,127,221,106,112,28}
 demo000004 | {0,0,0,0,0,39,961}
 demo000005 | {12,225,171,122,233,80,157}
 demo000006 | {0,78,176,170,8,40,528}
 demo000007 | {0,0,0,126,239,245,390}
 demo000008 | {0,0,311,345,116,228,0}
 demo000009 | {295,92,105,50,8,8,442}
```

---

## interpolate() :community_function: [](interpolate)

The `interpolate` function does linear interpolation for missing values.
It can only be used in an aggregation query with [time_bucket_gapfill](#time_bucket_gapfill).
The `interpolate` function call cannot be nested inside other function calls.

#### Required Arguments [](interpolate-required-arguments)

|Name|Description|
|---|---|
| `value` | The value to interpolate (int2/int4/int8/float4/float8) |

#### Optional Arguments [](interpolate-optional-arguments)

|Name|Description|
|---|---|
| `prev` | The lookup expression for values before the gapfill time range (record) |
| `next` | The lookup expression for values after the gapfill time range (record) |

Because the interpolation function relies on having values before and after
each bucketed period to compute the interpolated value, it might not have
enough data to calculate the interpolation for the first and last time bucket
if those buckets do not otherwise contain valid values.
For example, the interpolation would require looking before this first
time bucket period, yet the query's outer time predicate WHERE time > ...
normally restricts the function to only evaluate values within this time range.
Thus, the `prev` and `next` expression tell the function how to look for
values outside of the range specified by the time predicate.
These expressions will only be evaluated when no suitable value is returned by the outer query
(i.e., the first and/or last bucket in the queried time range is empty).
The returned record for `prev` and `next` needs to be a time, value tuple.
The datatype of time needs to be the same as the time datatype in the `time_bucket_gapfill` call.
The datatype of value needs to be the same as the `value` datatype of the `interpolate` call.

#### Sample Usage [](interpolate-examples)

Get the temperature every day for each device over the last week interpolating for missing readings:
```sql
SELECT
  time_bucket_gapfill('1 day', time, now() - interval '1 week', now()) AS day,
  device_id,
  avg(temperature) AS value,
  interpolate(avg(temperature))
FROM metrics
WHERE time > now () - interval '1 week'
GROUP BY day, device_id
ORDER BY day;

           day          | device_id | value | interpolate
------------------------+-----------+-------+-------------
 2019-01-10 01:00:00+01 |         1 |       |
 2019-01-11 01:00:00+01 |         1 |   5.0 |         5.0
 2019-01-12 01:00:00+01 |         1 |       |         6.0
 2019-01-13 01:00:00+01 |         1 |   7.0 |         7.0
 2019-01-14 01:00:00+01 |         1 |       |         6.5
 2019-01-15 01:00:00+01 |         1 |   8.0 |         8.0
 2019-01-16 01:00:00+01 |         1 |   9.0 |         9.0
(7 row)
```

Get the average temperature every day for each device over the last 7 days interpolating for missing readings with lookup queries for values before and after the gapfill time range:
```sql
SELECT
  time_bucket_gapfill('1 day', time, now() - interval '1 week', now()) AS day,
  device_id,
  interpolate(avg(temperature),
    (SELECT (time,temperature) FROM metrics m2 WHERE m2.time < now() - interval '1 week' AND m.device_id = m2.device_id) ORDER BY time DESC LIMIT 1,
    (SELECT (time,temperature) FROM metrics m2 WHERE m2.time > now() AND m.device_id = m2.device_id ORDER BY time DESC LIMIT 1)
  ) AS value
FROM metrics
WHERE time > now () - interval '1 week'
GROUP BY day, device_id
ORDER BY day;

           day          | device_id | value | interpolate
------------------------+-----------+-------+-------------
 2019-01-10 01:00:00+01 |         1 |       |         3.0
 2019-01-11 01:00:00+01 |         1 |   5.0 |         5.0
 2019-01-12 01:00:00+01 |         1 |       |         6.0
 2019-01-13 01:00:00+01 |         1 |   7.0 |         7.0
 2019-01-14 01:00:00+01 |         1 |       |         7.5
 2019-01-15 01:00:00+01 |         1 |   8.0 |         8.0
 2019-01-16 01:00:00+01 |         1 |   9.0 |         9.0
(7 row)
```

---
## last() [](last)

The `last` aggregate allows you to get the value of one column
as ordered by another. For example, `last(temperature, time)` will return the
latest temperature value based on time within an aggregate group.

#### Required Arguments [](last-required-arguments)

|Name|Description|
|---|---|
| `value` | The value to return (anyelement) |
| `time` | The timestamp to use for comparison (TIMESTAMP/TIMESTAMPTZ or integer type)  |

#### Sample Usage [](last-examples)

Get the temperature every 5 minutes for each device over the past day:
```sql
SELECT device_id, time_bucket('5 minutes', time) AS interval,
  last(temp, time)
FROM metrics
WHERE time > now () - interval '1 day'
GROUP BY device_id, interval
ORDER BY interval DESC;
```

>:WARNING: The `last` and `first` commands do **not** use indexes, and instead
 perform a sequential scan through their groups.  They are primarily used
 for ordered selection within a `GROUP BY` aggregate, and not as an
 alternative to an `ORDER BY time DESC LIMIT 1` clause to find the
 latest value (which will use indexes).

---
### locf() :community_function: [](locf)

The `locf` function (last observation carried forward) allows you to carry the last seen value in an aggregation group forward.
It can only be used in an aggregation query with [time_bucket_gapfill](#time_bucket_gapfill).
The `locf` function call cannot be nested inside other function calls.

#### Required Arguments [](locf-required-arguments)

|Name|Description|
|---|---|
| `value` | The value to carry forward (anyelement) |

#### Optional Arguments [](locf-optional-arguments)

|Name|Description|
|---|---|
| `prev` | The lookup expression for values before gapfill start (anyelement) |
| `treat_null_as_missing` | Ignore NULL values in locf and only carry non-NULL values forward |

Because the locf function relies on having values before each bucketed period
to carry forward, it might not have enough data to fill in a value for the first
bucket if it does not contain a value.
For example, the function would need to look before this first
time bucket period, yet the query's outer time predicate WHERE time > ...
normally restricts the function to only evaluate values within this time range.
Thus, the `prev` expression tell the function how to look for
values outside of the range specified by the time predicate.
The `prev` expression will only be evaluated when no previous value is returned
by the outer query (i.e., the first bucket in the queried time range is empty).

#### Sample Usage [](locf-examples)

Get the average temperature every day for each device over the last 7 days carrying forward the last value for missing readings:
```sql
SELECT
  time_bucket_gapfill('1 day', time, now() - interval '1 week', now()) AS day,
  device_id,
  avg(temperature) AS value,
  locf(avg(temperature))
FROM metrics
WHERE time > now () - interval '1 week'
GROUP BY day, device_id
ORDER BY day;

           day          | device_id | value | locf
------------------------+-----------+-------+------
 2019-01-10 01:00:00+01 |         1 |       |
 2019-01-11 01:00:00+01 |         1 |   5.0 |  5.0
 2019-01-12 01:00:00+01 |         1 |       |  5.0
 2019-01-13 01:00:00+01 |         1 |   7.0 |  7.0
 2019-01-14 01:00:00+01 |         1 |       |  7.0
 2019-01-15 01:00:00+01 |         1 |   8.0 |  8.0
 2019-01-16 01:00:00+01 |         1 |   9.0 |  9.0
(7 row)
```

Get the average temperature every day for each device over the last 7 days carrying forward the last value for missing readings with out-of-bounds lookup
```sql
SELECT
  time_bucket_gapfill('1 day', time, now() - interval '1 week', now()) AS day,
  device_id,
  avg(temperature) AS value,
  locf(
    avg(temperature),
    (SELECT temperature FROM metrics m2 WHERE m2.time < now() - interval '2 week' AND m.device_id = m2.device_id ORDER BY time DESC LIMIT 1)
  )
FROM metrics m
WHERE time > now () - interval '1 week'
GROUP BY day, device_id
ORDER BY day;

           day          | device_id | value | locf
------------------------+-----------+-------+------
 2019-01-10 01:00:00+01 |         1 |       |  1.0
 2019-01-11 01:00:00+01 |         1 |   5.0 |  5.0
 2019-01-12 01:00:00+01 |         1 |       |  5.0
 2019-01-13 01:00:00+01 |         1 |   7.0 |  7.0
 2019-01-14 01:00:00+01 |         1 |       |  7.0
 2019-01-15 01:00:00+01 |         1 |   8.0 |  8.0
 2019-01-16 01:00:00+01 |         1 |   9.0 |  9.0
(7 row)
```

---

### time_bucket() [](time_bucket)

This is a more powerful version of the standard PostgreSQL `date_trunc` function.
It allows for arbitrary time intervals instead of the second, minute, hour, etc.
provided by `date_trunc`. The return value is the bucket's start time.
Below is necessary information for using it effectively.

>:TIP: TIMESTAMPTZ arguments are
bucketed by the time at UTC. So the alignment of buckets is
on UTC time. One consequence of this is that daily buckets are
aligned to midnight UTC, not local time.
>
>If the user wants buckets aligned by local time, the TIMESTAMPTZ input should be
cast to TIMESTAMP (such a cast converts the value to local time) before being
passed to time_bucket (see example below).  Note that along daylight savings
time boundaries the amount of data aggregated into a bucket after such a cast is
irregular: for example if the bucket_width is 2 hours, the number of UTC hours
bucketed by local time on daylight savings time boundaries can be either 3 hours
or 1 hour.

#### Required Arguments [](time_bucket-required-arguments)

|Name|Description|
|---|---|
| `bucket_width` | A PostgreSQL time interval for how long each bucket is (interval) |
| `time` | The timestamp to bucket (timestamp/timestamptz/date)|

#### Optional Arguments [](time_bucket-optional-arguments)

|Name|Description|
|---|---|
| `offset` | The time interval to offset all buckets by (interval) |
| `origin` | Buckets are aligned relative to this timestamp (timestamp/timestamptz/date) |

### For Integer Time Inputs

#### Required Arguments [](time_bucket-integer-required-arguments)

|Name|Description|
|---|---|
| `bucket_width` | The bucket width (integer) |
| `time` | The timestamp to bucket (integer) |

#### Optional Arguments [](time_bucket-integer-optional-arguments)

|Name|Description|
|---|---|
| `offset` | The amount to offset all buckets by (integer) |


#### Sample Usage [](time_bucket-examples)

Simple 5-minute averaging:

```sql
SELECT time_bucket('5 minutes', time) AS five_min, avg(cpu)
FROM metrics
GROUP BY five_min
ORDER BY five_min DESC LIMIT 10;
```

To report the middle of the bucket, instead of the left edge:
```sql
SELECT time_bucket('5 minutes', time) + '2.5 minutes'
  AS five_min, avg(cpu)
FROM metrics
GROUP BY five_min
ORDER BY five_min DESC LIMIT 10;
```

For rounding, move the alignment so that the middle of the bucket is at the
5 minute mark (and report the middle of the bucket):
```sql
SELECT time_bucket('5 minutes', time, '-2.5 minutes') + '2.5 minutes'
  AS five_min, avg(cpu)
FROM metrics
GROUP BY five_min
ORDER BY five_min DESC LIMIT 10;
```

To shift the alignment of the buckets you can use the origin parameter
(passed as a timestamp, timestamptz, or date type).
In this example, we shift the start of the week to a Sunday (the default is a Monday).
```sql
SELECT time_bucket('1 week', timetz, TIMESTAMPTZ '2017-12-31')
  AS one_week, avg(cpu)
FROM metrics
GROUP BY one_week
WHERE time > TIMESTAMPTZ '2017-12-01'  AND time < TIMESTAMPTZ '2018-01-03'
ORDER BY one_week DESC LIMIT 10;
```

The value of the origin parameter we used in this example was `2017-12-31`, a Sunday within the
period being analyzed. However, the origin provided to the function can be before, during, or
after the data being analyzed. All buckets are calculated relative to this origin. So, in this example,
any Sunday could have been used. Note that because `time < TIMESTAMPTZ '2018-01-03'` in this example,
the last bucket would have only 4 days of data.

Bucketing a TIMESTAMPTZ at local time instead of UTC(see note above):
```sql
SELECT time_bucket('2 hours', timetz::TIMESTAMP)
  AS five_min, avg(cpu)
FROM metrics
GROUP BY five_min
ORDER BY five_min DESC LIMIT 10;
```

Note that the above cast to TIMESTAMP converts the time to local time according
to the server's timezone setting.

>:WARNING: For users upgrading from a version before 1.0.0, please note
 that the default origin was moved from 2000-01-01 (Saturday) to 2000-01-03 (Monday)
 between versions 0.12.1 and 1.0.0. This change was made  to make time_bucket compliant
 with the ISO standard for Monday as the start of a week. This should only affect
 multi-day calls to time_bucket. The old behavior can be reproduced by passing
 2000-01-01 as the origin parameter to time_bucket.

---
### time_bucket_gapfill() :community_function: [](time_bucket_gapfill)

The `time_bucket_gapfill` function works similar to `time_bucket` but also activates gap
filling for the interval between `start` and `finish`. It can only be used with an aggregation
query. Values outside of `start` and `finish` will pass through but no gap filling will be
done outside of the specified range.

#### Required Arguments [](time_bucket_gapfill-required-arguments)

|Name|Description|
|---|---|
| `bucket_width` | A PostgreSQL time interval for how long each bucket is (interval) |
| `time` | The timestamp to bucket (timestamp/timestamptz/date)|

#### Optional Arguments [](time_bucket_gapfill-optional-arguments)

|Name|Description|
|---|---|
| `start` | The start of the gapfill period (timestamp/timestamptz/date)|
| `finish` | The end of the gapfill period (timestamp/timestamptz/date)|

Starting with version 1.3.0 `start` and `finish` are optional arguments and will
be inferred from the WHERE clause if not supplied as arguments.

### For Integer Time Inputs

#### Required Arguments [](time_bucket_gapfill-integer-required-arguments)

|Name|Description|
|---|---|
| `bucket_width` | integer interval for how long each bucket is (int2/int4/int8) |
| `time` | The timestamp to bucket (int2/int4/int8)|

#### Optional Arguments [](time_bucket_gapfill-integer-optional-arguments)

|Name|Description|
|---|---|
| `start` | The start of the gapfill period (int2/int4/int8)|
| `finish` | The end of the gapfill period (int2/int4/int8)|

Starting with version 1.3.0 `start` and `finish` are optional arguments and will
be inferred from the WHERE clause if not supplied as arguments.

#### Sample Usage [](time_bucket_gapfill-examples)

Get the metric value every day over the last 7 days:

```sql
SELECT
  time_bucket_gapfill('1 day', time) AS day,
  device_id,
  avg(value) AS value
FROM metrics
WHERE time > now() - interval '1 week' AND time < now()
GROUP BY day, device_id
ORDER BY day;

           day          | device_id | value
------------------------+-----------+-------
 2019-01-10 01:00:00+01 |         1 |
 2019-01-11 01:00:00+01 |         1 |   5.0
 2019-01-12 01:00:00+01 |         1 |
 2019-01-13 01:00:00+01 |         1 |   7.0
 2019-01-14 01:00:00+01 |         1 |
 2019-01-15 01:00:00+01 |         1 |   8.0
 2019-01-16 01:00:00+01 |         1 |   9.0
(7 row)
```

Get the metric value every day over the last 7 days carrying forward the previous seen value if none is available in an interval:

```sql
SELECT
  time_bucket_gapfill('1 day', time) AS day,
  device_id,
  avg(value) AS value,
  locf(avg(value))
FROM metrics
WHERE time > now() - interval '1 week' AND time < now()
GROUP BY day, device_id
ORDER BY day;

           day          | device_id | value | locf
------------------------+-----------+-------+------
 2019-01-10 01:00:00+01 |         1 |       |
 2019-01-11 01:00:00+01 |         1 |   5.0 |  5.0
 2019-01-12 01:00:00+01 |         1 |       |  5.0
 2019-01-13 01:00:00+01 |         1 |   7.0 |  7.0
 2019-01-14 01:00:00+01 |         1 |       |  7.0
 2019-01-15 01:00:00+01 |         1 |   8.0 |  8.0
 2019-01-16 01:00:00+01 |         1 |   9.0 |  9.0
```

Get the metric value every day over the last 7 days interpolating missing values:

```sql
SELECT
  time_bucket_gapfill('5 minutes', time) AS day,
  device_id,
  avg(value) AS value,
  interpolate(avg(value))
FROM metrics
WHERE time > now() - interval '1 week' AND time < now()
GROUP BY day, device_id
ORDER BY day;

           day          | device_id | value | interpolate
------------------------+-----------+-------+-------------
 2019-01-10 01:00:00+01 |         1 |       |
 2019-01-11 01:00:00+01 |         1 |   5.0 |         5.0
 2019-01-12 01:00:00+01 |         1 |       |         6.0
 2019-01-13 01:00:00+01 |         1 |   7.0 |         7.0
 2019-01-14 01:00:00+01 |         1 |       |         7.5
 2019-01-15 01:00:00+01 |         1 |   8.0 |         8.0
 2019-01-16 01:00:00+01 |         1 |   9.0 |         9.0
```

---

## Utilities/Statistics [](utilities)

### timescaledb_information.data_node [](timescaledb_information-datanode)

Get information on data nodes. This function is specific to running
TimescaleDB in a multi-node setup.

#### Available Columns

|Name|Description|
|---|---|
| `node_name` | Data node name. |
| `owner` | Oid of the user, who added the data node. |
| `options` | Options used when creating the data node. |
| `node_up` | (BOOLEAN) Data node responds to ping. |
| `num_dist_tables` | Number of distributed hypertables that use this data node. This metric is only available if a node is up. |
| `num_dist_chunks` | Total number of distributed chunks associated with distributed hypertables stored in data node. This metric is only available if a node is up. |
| `total_dist_size` | Total amount of distributed data stored in data node. Data and chunks in non-distributed hypertables are not included in this metric. |

#### Sample Usage

Get liveness and metrics from data nodes.

```sql
SELECT * FROM timescaledb_information.data_node;

 node_name    | owner      | options                        | server_up | num_dist_tables | num_dist_chunks | total_dist_size
--------------+------------+--------------------------------+-----------+-----------------+-----------------+----------------
 dn_1         | 16388      | {host=localhost,port=15432}    |  t        |               1 | 50              | 96 MB      
 dn_2         | 16388      | {host=localhost,port=15432}    |  t        |               1 | 50              | 400 MB      
(2 rows)
```

### timescaledb_information.hypertable [](timescaledb_information-hypertable)

Get information about hypertables. If the hypertable is distributed, the
hypertable statistics reflect the sum of statistics across all distributed chunks.

#### Available Columns

|Name|Description|
|---|---|
| `table_schema` | Schema name of the hypertable |
| `table_name` | Table name of the hypertable |
| `table_owner` | Owner of the hypertable |
| `num_dimensions` | Number of dimensions |
| `num_chunks` | Number of chunks. |
| `table_size` | Disk space used by hypertable |
| `index_size` | Disk space used by indexes |
| `toast_size` | Disk space of toast tables |
| `total_size` | Total disk space used by the specified table, including all indexes and TOAST data|
| `distributed` | (BOOLEAN) Distributed status of the hypertable |

#### Sample Usage

Get information about all hypertables.

```sql
SELECT * FROM timescaledb_information.hypertable;

 table_schema | table_name | table_owner | num_dimensions | num_chunks | table_size | index_size | toast_size | total_size | distributed
--------------+------------+-------------+----------------+------------+------------+------------+------------+------------+--------------
 public       | metrics    | postgres    |              1 |          5 | 99 MB      | 96 MB      |            | 195 MB     | t
 public       | devices    | postgres    |              1 |          1 | 8192 bytes | 16 kB      |            | 24 kB      | f
(2 rows)
```

Check whether a table is a hypertable.

```sql
SELECT * FROM timescaledb_information.hypertable
WHERE table_schema='public' AND table_name='metrics';

 table_schema | table_name | table_owner | num_dimensions | num_chunks | table_size | index_size | toast_size | total_size | distributed
--------------+------------+-------------+----------------+------------+------------+------------+------------+------------+--------------
 public       | metrics    | postgres    |              1 |          5 | 99 MB      | 96 MB      |            | 195 MB     | t
(1 row)
```

### timescaledb_information.license [](timescaledb_information-license)

Get information about current license.

#### Available Columns

|Name|Description|
|---|---|
| `edition` | License key type (apache_only, community, enterprise) |
| `expired` | Expiration status of license key (bool) |
| `expiration_time` | Time of license key expiration |

#### Sample Usage

Get information about current license.

```sql
SELECT * FROM timescaledb_information.license;

edition   | expired |    expiration_time
------------+---------+------------------------
enterprise | f       | 2019-02-15 13:44:53-05
(1 row)
```

---
### timescaledb_information.continuous_aggregates [](timescaledb_information-continuous_aggregate)

Get metadata and settings information for continuous aggregates.

#### Available Columns

|Name|Description|
|---|---|
|`view_name` | User supplied name for continuous aggregate view |
|`view_owner` | Owner of the continuous aggregate view|
|`refresh_lag` | Amount by which the materialization for the continuous aggregate lags behind the current max value for the column used in the `time_bucket` expression of the continuous aggregate query|
|`refresh_interval` | Interval between updates of the continuous aggregate materialization|
|`max_interval_per_job` | Maximum amount of data processed by a materialization job in a single run|
|`materialization_hypertable` | Name of the underlying materialization table|
|`view_definition` | `SELECT` query for continuous aggregate view|

#### Sample Usage
```sql
select * from timescaledb_information.continuous_aggregates;
-[ RECORD 1 ]--------------+-------------------------------------------------
view_name                  | contagg_view
view_owner                 | postgres
refresh_lag                | 2
refresh_interval           | 12:00:00
max_interval_per_job       | 20
materialization_hypertable | _timescaledb_internal._materialized_hypertable_2
view_definition            |  SELECT foo.a,                                  +
                           |     count(foo.b) AS countb                      +
                           |    FROM foo                                     +
                           |   GROUP BY (time_bucket(1, foo.a)), foo.a;

-- description of foo
\d foo
                Table "public.foo"
 Column |  Type   | Collation | Nullable | Default
--------+---------+-----------+----------+---------
 a      | integer |           | not null |
 b      | integer |           |          |
 c      | integer |           |          |

```
---
### timescaledb_information.continuous_aggregate_stats [](timescaledb_information-continuous_aggregate_stats)

Get information about background jobs and statistics related to continuous aggregates.

#### Available Columns

|Name|Description|
|---|---|
|`view_name`| User supplied name for continuous aggregate. |
|`completed_threshold`| Completed threshold for the last materialization job.|
|`invalidation_threshold`| Invalidation threshold set by the latest materialization job|
|`last_run_started_at`| Start time of the last job|
|`job_status`| Status of the materialization job . Valid values are ‘Running’ and ‘Scheduled’|
|`last_run_duration`| Time taken by the last materialization job|
|`next_scheduled_run` | Start time of the next materialization job |

#### Sample Usage

```sql
select * from timescaledb_information.continuous_aggregate_stats;
-[ RECORD 1 ]----------+------------------------------
view_name              | contagg_view
completed_threshold    | 1
invalidation_threshold | 1
job_id                 | 1003
last_run_started_at    | 2019-05-02 12:34:27.941868-04
job_status             | scheduled
last_run_duration      | 00:00:00.038291
next_scheduled_run     | 2019-05-03 00:34:27.980159-04
```
---
### timescaledb_information.drop_chunks_policies[](timescaledb_information-drop_chunks_policies)
Shows information about drop_chunks policies that have been created by the user.
(See [add_drop_chunks_policy](#add_drop_chunks_policy) for more information
about drop_chunks policies).


#### Available Columns

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) The name of the hypertable on which the policy is applied |
| `older_than` | (INTERVAL) Chunks fully older than this amount of time will be dropped when the policy is run |
| `cascade` | (BOOLEAN) Whether the policy will be run with the cascade option turned on, which will cause dependent objects to be dropped as well as chunks. |
| `job_id` | (INTEGER) The id of the background job set up to implement the drop_chunks policy|
| `schedule_interval` | (INTERVAL)  The interval at which the job runs |
| `max_runtime` | (INTERVAL) The maximum amount of time the job will be allowed to run by the background worker scheduler before it is stopped |
| `max_retries` | (INTEGER)  The number of times the job will be retried should it fail |
| `retry_period` | (INTERVAL) The amount of time the scheduler will wait between retries of the job on failure |

#### Sample Usage

Get information about drop_chunks policies.
```sql
SELECT * FROM timescaledb_information.drop_chunks_policies;

       hypertable       | older_than | cascade | job_id | schedule_interval | max_runtime | max_retries | retry_period
------------------------+------------+---------+--------+-------------------+-------------+-------------+--------------
       conditions       | @ 4 mons   | t       |   1001 | @ 1 sec           | @ 5 mins    |          -1 | @ 12 hours
(1 row)
```

---
### timescaledb_information.reorder_policies[](timescaledb_information-reorder_policies)
Shows information about reorder policies that have been created by the user.
(See [add_reorder_policy](#add_reorder_policy) for more information about
reorder policies).


#### Available Columns

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) The name of the hypertable on which the policy is applied |
| `index` | (NAME) Chunks fully older than this amount of time will be dropped when the policy is run |
| `job_id` | (INTEGER) The id of the background job set up to implement the reorder policy|
| `schedule_interval` | (INTERVAL)  The interval at which the job runs |
| `max_runtime` | (INTERVAL) The maximum amount of time the job will be allowed to run by the background worker scheduler before it is stopped |
| `max_retries` | (INTEGER)  The number of times the job will be retried should it fail |
| `retry_period` | (INTERVAL) The amount of time the scheduler will wait between retries of the job on failure |

#### Sample Usage

Get information about reorder policies.
```sql
SELECT * FROM timescaledb_information.reorder_policies;

     hypertable   |     hypertable_index_name     | job_id | schedule_interval | max_runtime | max_retries | retry_period
--------------------+-----------------------------+--------+-------------------+-------------+-------------+--------------
     conditions   | conditions_device_id_time_idx |   1000 | @ 4 days          | @ 0         |          -1 | @ 1 day
(1 row)
```

---
### timescaledb_information.policy_stats[](timescaledb_information-policy_stats)

Shows information and statistics about policies created to manage data retention
and other administrative tasks on hypertables. (See [policies](#automation-policies)). The
statistics include information useful for administering jobs and determining
whether they ought be rescheduled, such as: when and whether the background job
used to implement the policy succeeded and when it is scheduled to run next.

#### Available Columns

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) The name of the hypertable on which the policy is applied |
| `job_id` | (INTEGER) The id of the background job created to implement the policy |
| `job_type` | (TEXT) The type of policy the job was created to implement |
| `last_run_success` | (BOOLEAN) Whether the last run succeeded or failed |
| `last_finish` | (TIMESTAMPTZ) The time the last run finished |
| `last_start` | (TIMESTAMPTZ) The time the last run started |
| `next_start` | (TIMESTAMPTZ) The time the next run will start |
| `total_runs` | (INTEGER) The total number of runs of this job |
| `total_failures` | (INTEGER) The total number of times this job failed |

#### Sample Usage

Get information about statistics on created policies.
```sql
SELECT * FROM timescaledb_information.policy_stats;

       hypertable       | job_id |  job_type   | last_run_success |         last_finish          |          last_start          |          next_start          | total_runs | total_failures
------------------------+--------+-------------+------------------+------------------------------+------------------------------+------------------------------+------------+----------------
 conditions             |   1001 | drop_chunks | t                | Fri Dec 31 16:00:01 1999 PST | Fri Dec 31 16:00:01 1999 PST | Fri Dec 31 16:00:02 1999 PST |          2 |              0
(1 row)
```

---
### timescaledb.license_key [](timescaledb_license-key)

#### Sample Usage

View current license key.

```sql
SHOW timescaledb.license_key;
```
---

### chunk_relation_size() [](chunk_relation_size)

Get relation size of the chunks of an hypertable.

#### Required Arguments [](chunk_relation_size-required-arguments)

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get chunk relation sizes for.|

#### Returns [](chunk_relation_size-returns)
|Column|Description|
|---|---|
|chunk_id|TimescaleDB id of a chunk|
|chunk_table|Table used for the chunk|
|partitioning_columns|Partitioning column names|
|partitioning_column_types|Types of partitioning columns|
|partitioning_hash_functions|Hash functions of partitioning columns|
|dimensions|Partitioning dimension names|
|ranges|Partitioning ranges for each dimension|
|table_bytes|Disk space used by main_table|
|index_bytes|Disk space used by indexes|
|toast_bytes|Disk space of toast tables|
|total_bytes|Disk space used in total|

#### Sample Usage [](chunk_relation_size-examples)
```sql
SELECT * FROM chunk_relation_size('conditions');
```
or, to reduce the output, a common use is:
```sql
SELECT chunk_table, table_bytes, index_bytes, total_bytes
FROM chunk_relation_size('conditions');
```
The expected output:
```
                 chunk_table                 | table_bytes | index_bytes | total_bytes
---------------------------------------------+-------------+-------------+-------------
 "_timescaledb_internal"."_hyper_1_1_chunk"  |    29220864 |    37773312 |    67002368
 "_timescaledb_internal"."_hyper_1_2_chunk"  |    59252736 |    81297408 |   140558336
 ...
```

Where `chunk_table` is the table that contains the data, `table_bytes` is the size of that table, `index_bytes` is the size of the indexes of the table, and `total_bytes` is the size of the table with indexes.

---

### chunk_relation_size_pretty() [](chunk_relation_size_pretty)

Get relation size of the chunks of an hypertable.

#### Required Arguments [](chunk_relation_size_pretty-required-arguments)

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get chunk relation sizes for.|

#### Returns [](chunk_relation_size_pretty-returns)
|Column|Description|
|---|---|
|chunk_id|TimescaleDB id of a chunk|
|chunk_table|Table used for the chunk|
|partitioning_columns|Partitioning column names|
|partitioning_column_types|Types of partitioning columns|
|partitioning_hash_functions|Hash functions of partitioning columns|
|ranges|Partitioning ranges for each dimension|
|table_size|Pretty output of table_bytes|
|index_size|Pretty output of index_bytes|
|toast_size|Pretty output of toast_bytes|
|total_size|Pretty output of total_bytes|

#### Sample Usage [](chunk_relation_size_pretty-examples)
```sql
SELECT * FROM chunk_relation_size_pretty('conditions');
```
or, to reduce the output, a common use is:
```sql
SELECT chunk_table, table_size, index_size, total_size
FROM chunk_relation_size_pretty('conditions');
```
The expected output:
```
                chunk_table                  | table_size | index_size | total_size
---------------------------------------------+------------+------------+------------
 "_timescaledb_internal"."_hyper_1_1_chunk"  | 28 MB      | 36 MB      | 64 MB
 "_timescaledb_internal"."_hyper_1_2_chunk"  | 57 MB      | 78 MB      | 134 MB
 ...
```
Where `chunk_table` is the table that contains the data, `table_size` is the size of that table, `index_size` is the size of the indexes of the table, and `total_size` is the size of the table with indexes.

---

### get_telemetry_report() [](get_telemetry_report)

If background [telemetry][] is enabled, returns the string sent to our servers.
If telemetry is not enabled, outputs INFO message affirming telemetry is disabled
and returns a NULL report.

#### Optional Arguments [](get_telemetry_report-optional-arguments)

|Name|Description|
|---|---|
| `always_display_report` | Set to true to always view the report, even if telemetry is disabled |

#### Sample Usage [](get_telemetry_report-examples)
If telemetry is enabled, view the telemetry report.
```sql
SELECT get_telemetry_report();
```
If telemetry is disabled, view the telemetry report locally.
```sql
SELECT get_telemetry_report(always_display_report := true);
```

---

### hypertable_approximate_row_count() [](hypertable_approximate_row_count)

Get approximate row count for hypertable(s) based on catalog estimates.

#### Optional Arguments [](hypertable_approximate_row_count-optional-arguments)

|Name|Description|
|---|---|
| `main_table` | Hypertable to get row count for. If omitted, all hypertabls are returned. |

#### Sample Usage [](hypertable_approximate_row_count-examples)

Get the approximate row count for a single hypertable.
```sql
SELECT * FROM hypertable_approximate_row_count('conditions');
```

Get the approximate row count for all hypertables.
```sql
SELECT * FROM hypertable_approximate_row_count();
```

The expected output:
```
 schema_name | table_name | row_estimate
-------------+------------+--------------
  public     | conditions |      240000
```

---

### hypertable_relation_size() [](hypertable_relation_size)

Get relation size of hypertable like `pg_relation_size(hypertable)`.

#### Required Arguments [](hypertable_relation_size-required-arguments)

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get relation size for.|

#### Returns [](hypertable_relation_size-returns)
|Column|Description|
|---|---|
|table_bytes|Disk space used by main_table (like pg_relation_size(main_table))|
|index_bytes|Disk space used by indexes|
|toast_bytes|Disk space of toast tables|
|total_bytes|Total disk space used by the specified table, including all indexes and TOAST data|

#### Sample Usage [](hypertable_relation_size-examples)
```sql
SELECT * FROM hypertable_relation_size('conditions');
```
or, to reduce the output, a common use is:
```sql
SELECT table_bytes, index_bytes, toast_bytes, total_bytes
FROM hypertable_relation_size('conditions');
```
The expected output:
```
 table_bytes | index_bytes | toast_bytes | total_bytes
-------------+-------------+-------------+-------------
  1227661312 |  1685979136 |      180224 |  2913820672
```
---

### hypertable_relation_size_pretty() [](hypertable_relation_size_pretty)

Get relation size of hypertable like `pg_relation_size(hypertable)`.

#### Required Arguments [](hypertable_relation_size_pretty-required-arguments)

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get relation size for.|

#### Returns [](hypertable_relation_size_pretty-returns)
|Column|Description|
|---|---|
|table_size|Pretty output of table_bytes|
|index_size|Pretty output of index_bytes|
|toast_size|Pretty output of toast_bytes|
|total_size|Pretty output of total_bytes|

#### Sample Usage [](hypertable_relation_size_pretty-examples)
```sql
SELECT * FROM hypertable_relation_size_pretty('conditions');
```
or, to reduce the output, a common use is:
```sql
SELECT table_size, index_size, toast_size, total_size
FROM hypertable_relation_size_pretty('conditions');
```
The expected output:
```
 table_size | index_size | toast_size | total_size
------------+------------+------------+------------
 1171 MB    | 1608 MB    | 176 kB     | 2779 MB
```

---

### indexes_relation_size() [](indexes_relation_size)

Get sizes of indexes on a hypertable.

#### Required Arguments [](hypertable_relation_size_pretty-required-arguments)

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get indexes size for.|

#### Returns [](hypertable_relation_size_pretty-returns)
|Column|Description|
|---|---|
|index_name|Index on hypertable|
|total_bytes|Size of index on disk|

#### Sample Usage [](hypertable_relation_size_pretty-examples)
```sql
SELECT * FROM indexes_relation_size('conditions');
```
The expected output:
```
              index_name              | total_bytes
--------------------------------------+-------------
 public.conditions_device_id_time_idx |  1198620672
 public.conditions_time_idx           |   487358464

```

---

### indexes_relation_size_pretty() [](indexes_relation_size_pretty)

Get sizes of indexes on a hypertable.

#### Required Arguments [](indexes_relation_size_pretty-required-arguments)

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get indexes size for.|

#### Returns [](indexes_relation_size_pretty-returns)
|Column|Description|
|---|---|
|index_name|Index on hypertable|
|total_size|Pretty output of total_bytes|

#### Sample Usage [](indexes_relation_size_pretty-examples)
```sql
SELECT * FROM indexes_relation_size_pretty('conditions');
```
The expected output:
```

             index_name_              | total_size
--------------------------------------+------------
 public.conditions_device_id_time_idx | 1143 MB
 public.conditions_time_idx           | 465 MB

```

---

### show_tablespaces() [](show_tablespaces)

Show the tablespaces attached to a hypertable.

#### Required Arguments [](show_tablespaces-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | Identifier of hypertable to show attached tablespaces for.|


#### Sample Usage [](show_tablespaces-examples)

```sql
SELECT * FROM show_tablespaces('conditions');

 show_tablespaces
------------------
 disk1
 disk2
```

---

## timescaledb_pre_restore() [](timescaledb_pre_restore)

Perform the proper operations to allow restoring of the database via `pg_restore` to commence.
Specifically this sets the `timescaledb.restoring` GUC to `on` and stops any
background workers which may have been performing tasks until the [`timescaledb_post_restore`](#timescaledb_post_restore)
fuction is run following the restore. See [backup/restore docs][backup-restore] for more information.

>:WARNING: After running `SELECT timescaledb_pre_restore()` you must run the
  [`timescaledb_post_restore`](#timescaledb_post_restore) function before using the database normally.

#### Sample Usage  [](timescaledb_pre_restore-examples)

```sql
SELECT timescaledb_pre_restore();
```

---

### timescaledb_post_restore() [](timescaledb_post_restore)
Perform the proper operations after restoring the database has completed.
Specifically this sets the `timescaledb.restoring` GUC to `off` and restarts any
background workers. See [backup/restore docs][backup-restore] for more information.

#### Sample Usage  [](timescaledb_pre_restore-examples)

```sql
SELECT timescaledb_post_restore();
```
---

## Dump TimescaleDB meta data [](dump-meta-data)

To help when asking for support and reporting bugs,
TimescaleDB includes a SQL script that outputs metadata
from the internal TimescaleDB tables as well as version information.
The script is available in the source distribution in `scripts/`
but can also be [downloaded separately][].
To use it, run:

```bash
psql [your connect flags] -d your_timescale_db < dump_meta_data.sql > dumpfile.txt
```

and then inspect `dump_file.txt` before sending it together with a bug report or support question.

[Slack]: https://slack-login.timescale.com
[chunk relation size]: #chunk_relation_size
[best practices]: #create_hypertable-best-practices
[using-continuous-aggs]: /using-timescaledb/continuous-aggregates
[downloaded separately]: https://raw.githubusercontent.com/timescale/timescaledb/master/scripts/dump_meta_data.sql
[postgres-tablespaces]: https://www.postgresql.org/docs/current/manage-ag-tablespaces.html
[postgres-createindex]: https://www.postgresql.org/docs/current/sql-createindex.html
[postgres-createtablespace]: https://www.postgresql.org/docs/current/sql-createtablespace.html
[postgres-cluster]: https://www.postgresql.org/docs/current/sql-cluster.html
[migrate-from-postgresql]: /getting-started/migrating-data
[memory-units]: https://www.postgresql.org/docs/current/static/config-setting.html#CONFIG-SETTING-NAMES-VALUES
[telemetry]: /using-timescaledb/telemetry
[drop chunks]: #drop_chunks
[show chunks]: #show_chunks
[caveats]: /using-timescaledb/continuous-aggregates
[backup-restore]: /using-timescaledb/backup#pg_dump-pg_restore
