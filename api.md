# TimescaleDB API Reference

>:TOPLIST:
> ### Command List (A-Z)
> - [add_compression_policy](#add_compression_policy)
> - [add_continuous_aggregate_policy](#add_continuous_aggregate_policy)
> - [add_data_node](#add_data_node)
> - [add_dimension](#add_dimension)
> - [add_job](#add_job)
> - [add_reorder_policy](#add_reorder_policy)
> - [add_retention_policy](#add_retention_policy)
> - [alter_job](#alter_job)
> - [alter table (compression)](#compression_alter-table)
> - [alter materialized view (continuous aggregate)](#continuous_aggregate-alter_view)
> - [approximate_row_count](#approximate_row_count)
> - [attach_data_node](#attach_data_node)
> - [attach_tablespace](#attach_tablespace)
> - [chunk_compression_stats](#chunk_compression_stats)
> - [chunks_detailed_size](#chunks_detailed_size)
> - [compress_chunk](#compress_chunk)
> - [create_distributed_hypertable](#create_distributed_hypertable)
> - [create_hypertable](#create_hypertable)
> - [create index (transaction per chunk)](#create_index)
> - [create materialized view (continuous aggregate)](#continuous_aggregate-create_view)
> - [decompress_chunk](#decompress_chunk)
> - [delete_data_node](#delete_data_node)
> - [delete_job](#delete_job)
> - [detach_data_node](#detach_data_node)
> - [detach_tablespace](#detach_tablespace)
> - [detach_tablespaces](#detach_tablespaces)
> - [distributed_exec](#distributed_exec)
> - [drop_chunks](#drop_chunks)
> - [drop materialized view (continuous aggregate)](#continuous_aggregate-drop_view)
> - [first](#first)
> - [get_telemetry_report](#get_telemetry_report)
> - [histogram](#histogram)
> - [hypertable_compression_stats](#hypertable_compression_stats)
> - [hypertable_detailed_size](#hypertable_size)
> - [hypertable_index_size](#hypertable_index_size)
> - [hypertable_size](#hypertable_size)
> - [interpolate](#interpolate)
> - [last](#last)
> - [locf](#locf)
> - [move_chunk](#move_chunk)
> - [refresh_continuous_aggregate](#refresh_continuous_aggregate)
> - [remove_compression_policy](#remove_compression_policy)
> - [remove_continuous_aggregate_policy](#remove_continuous_aggregate_policy)
> - [remove_reorder_policy](#remove_reorder_policy)
> - [remove_retention_policy](#remove_retention_policy)
> - [reorder_chunk](#reorder_chunk)
> - [run_job](#run_job)
> - [set_chunk_time_interval](#set_chunk_time_interval)
> - [set_integer_now_func](#set_integer_now_func)
> - [set_number_partitions](#set_number_partitions)
> - [set_replication_factor](#set_replication_factor)
> - [show_chunks](#show_chunks)
> - [show_tablespaces](#show_tablespaces)
> - [time_bucket](#time_bucket)
> - [time_bucket_gapfill](#time_bucket_gapfill)
> - [timescaledb_information.chunks](#timescaledb_information-chunks)
> - [timescaledb_information.continuous_aggregates](#timescaledb_information-continuous_aggregate)
> - [timescaledb_information.compression_settings](#timescaledb_information-compression_settings)
> - [timescaledb_information.data_nodes](#timescaledb_information-data_nodes)
> - [timescaledb_information.dimensions](#timescaledb_information-dimensions)
> - [timescaledb_information.hypertables](#timescaledb_information-hypertables)
> - [timescaledb_information.jobs](#timescaledb_information-jobs)
> - [timescaledb_information.job_stats](#timescaledb_information-job_stats)
> - [timescaledb.license](#timescaledb_license)
> - [timescaledb_pre_restore](#timescaledb_pre_restore)
> - [timescaledb_post_restore](#timescaledb_post_restore)

## Hypertable management [](hypertable-management)

## add_dimension() [](add_dimension)

Add an additional partitioning dimension to a TimescaleDB hypertable.
The column selected as the dimension can either use interval
partitioning (e.g., for a second time partition) or hash partitioning.

<!-- -->
>:WARNING: The `add_dimension` command can only be executed after a table has been
converted to a hypertable (via `create_hypertable`), but must similarly
be run only on an empty hypertable.

**Space partitions**: Using space partitions is highly recommended
for [distributed hypertables](#create_distributed_hypertable) to achieve
efficient scale-out performance. For [regular hypertables](#create_hypertable)
that exist only on a single node, additional partitioning can be used
for specialized use cases and not recommended for most users.

Space partitions use hashing: Every distinct item is hashed to one of
*N* buckets.  Remember that we are already using (flexible) time
intervals to manage chunk sizes; the main purpose of space
partitioning is to enable parallelization across multiple 
data nodes (in the case of distributed hypertables) or
across multiple disks within the same time interval
(in the case of single-node deployments).

### Parallelizing queries across multiple data nodes [](add_dimension-multi_node)

In a distributed hypertable, space partitioning enables inserts to be
parallelized across data nodes, even while the inserted rows share
timestamps from the same time interval, and thus increases the ingest rate.
Query performance also benefits by being able to parallelize queries 
across nodes, particularly when full or partial aggregations can be
"pushed down" to data nodes (e.g., as in the query
`avg(temperature) FROM conditions GROUP BY hour, location`
when using `location` as a space partition). Please see our
[best practices about partitioning in distributed hypertables][distributed-hypertable-partitioning-best-practices]
for more information.

### Parallelizing disk I/O on a single node [](add_dimension-single_node)

Parallel I/O can benefit in two scenarios: (a) two or more concurrent
queries should be able to read from different disks in parallel, or
(b) a single query should be able to use query parallelization to read
from multiple disks in parallel.

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
| `hypertable` | (REGCLASS) Hypertable to add the dimension to.|
| `column_name` | (NAME)  Column to partition by.|

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
 to use at most one "space" dimension.

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
SELECT add_dimension('conditions', 'time_received', chunk_time_interval => INTERVAL '1 day');
SELECT add_dimension('conditions', 'device_id', number_partitions => 2);
SELECT add_dimension('conditions', 'device_id', number_partitions => 2, if_not_exists => true);
```

Now in a multi-node example for distributed hypertables with a cluster 
of one access node and two data nodes, configure the access node for 
access to the two data nodes. Then, convert table `conditions` to 
a distributed hypertable with just time partitioning on column `time`, 
and finally add a space partitioning dimension on `location`
with two partitions (as the number of the attached data nodes).

```sql
SELECT add_data_node('dn1', host => 'dn1.example.com');
SELECT add_data_node('dn2', host => 'dn2.example.com');
SELECT create_distributed_hypertable('conditions', 'time');
SELECT add_dimension('conditions', 'location', number_partitions => 2);
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
| `if_not_attached` | Prevents error if the data node is already attached to the hypertable. A notice will be printed that the data node is attached. Defaults to `FALSE`. |
| `repartition`     | Change the partitioning configuration so that all the attached data nodes are used. Defaults to `TRUE`. |

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
## add_data_node() [](add_data_node)

Add a new data node on the access node to be used by distributed
hypertables. The data node will automatically be used by distributed
hypertables that are created after the data node has been added, while
existing distributed hypertables require an additional
[`attach_data_node`](#attach_data_node).

If the data node already exists, the command will abort with either an
error or a notice depending on the value of `if_not_exists`.

For security purposes, only superusers or users with necessary
privileges can add data nodes (see below for details). When adding a
data node, the access node will also try to connect to the data node
and therefore needs a way to authenticate with it. TimescaleDB
currently supports several different such authentication methods for
flexibility (including trust, user mappings, password, and certificate
methods). Please refer to [Setting up Multi-Node
TimescaleDB][multinode] for more information about node-to-node
authentication.

Unless `bootstrap` is false, the function will attempt to bootstrap
the data node by:
1. Creating the database given in `database` that will serve as the
   new data node.
2. Loading the TimescaleDB extension in the new database.
3. Setting metadata to make the data node part of the distributed
   database.

Note that user roles are not automatically created on the new data
node during bootstrapping. The [`distributed_exec`](#distributed_exec)
procedure can be used to create additional roles on the data node
after it is added.

#### Required Arguments [](add_data_node-required-arguments)

| Name        | Description                         |
| ----------- | -----------                         |
| `node_name` | Name for the data node.             |
| `host`      | Host name for the remote data node. |

#### Optional Arguments [](add_data_node-optional-arguments)

| Name                 | Description                                           |
|----------------------|-------------------------------------------------------|
| `database`           | Database name where remote hypertables will be created. The default is the current database name. |
| `port`               | Port to use on the remote data node. The default is the PostgreSQL port used by the access node on which the function is executed. |
| `if_not_exists`      | Do not fail if the data node already exists. The default is `FALSE`. |
| `bootstrap`          | Bootstrap the remote data node. The default is `TRUE`. |
| `password`           | Password for authenticating with the remote data node during bootstrapping or validation. A password only needs to be provided if the data node requires password authentication and a password for the user does not exist in a local password file on the access node. If password authentication is not used, the specified password will be ignored. |

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

#### Errors

An error will be given if:
* The function is executed inside a transaction.
* The function is executed in a database that is already a data node.
* The data node already exists and `if_not_exists` is `FALSE`.
* The access node cannot connect to the data node due to a network
  failure or invalid configuration (e.g., wrong port, or there is no
  way to authenticate the user).
* If `bootstrap` is `FALSE` and the database was not previously
  bootstrapped.

#### Privileges

To add a data node, you must be a superuser or have the `USAGE`
privilege on the `timescaledb_fdw` foreign data wrapper. To grant such
privileges to a regular user role, do:

```sql
GRANT USAGE ON FOREIGN DATA WRAPPER timescaledb_fdw TO <newrole>;
```

Note, however, that superuser privileges might still be necessary on
the data node in order to bootstrap it, including creating the
TimescaleDB extension on the data node unless it is already installed.

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

If you want to create a distributed database with the two data nodes
local to this instance, you can write:

```sql
SELECT add_data_node('dn1', host => 'localhost', database => 'dn1');
SELECT add_data_node('dn2', host => 'localhost', database => 'dn2');
SELECT create_distributed_hypertable('conditions', 'time', 'location');
```

Note that this does not offer any performance advantages over using a
regular hypertable, but it can be useful for testing.

---
## attach_tablespace() [](attach_tablespace)

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
| `tablespace` | (NAME) Name of the tablespace to attach.|
| `hypertable` | (REGCLASS) Hypertable to attach the tablespace to.|

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

---

## create_hypertable() [](create_hypertable)

Creates a TimescaleDB hypertable from a PostgreSQL table (replacing
the latter), partitioned on time and with the option to partition on
one or more other columns (i.e., space). The PostgreSQL table cannot
be an already partitioned table (declarative partitioning or
inheritance). In case of a non-empty table, it is possible to migrate
the data during hypertable creation using the `migrate_data` option,
although this might take a long time and has certain limitations when
the table contains foreign key constraints (see below).

After creation, all actions, such as `ALTER TABLE`, `SELECT`, etc.,
still work on the resulting hypertable.

#### Required Arguments [](create_hypertable-required-arguments)

|Name|Description|
|---|---|
| `relation` | Identifier of table to convert to hypertable. |
| `time_column_name` | Name of the column containing time values as well as the primary column to partition by. |

#### Optional Arguments [](create_hypertable-optional-arguments)

|Name|Description|
|---|---|
| `partitioning_column` | Name of an additional column to partition by. If provided, the `number_partitions` argument must also be provided. |
| `number_partitions` | Number of [hash partitions][] to use for `partitioning_column`. Must be > 0. |
| `chunk_time_interval` | Interval in event time that each chunk covers. Must be > 0. As of TimescaleDB v0.11.0, default is 7 days. For previous versions, default is 1 month. |
| `create_default_indexes` | Boolean whether to create default indexes on time/partitioning columns. Default is TRUE. |
| `if_not_exists` | Boolean whether to print warning if table already converted to hypertable or raise exception. Default is FALSE. |
| `partitioning_func` | The function to use for calculating a value's partition.|
| `associated_schema_name` | Name of the schema for internal hypertable tables. Default is "_timescaledb_internal". |
| `associated_table_prefix` | Prefix for internal hypertable chunk names. Default is "_hyper". |
| `migrate_data` | Set to TRUE to migrate any existing data from the `relation` table to chunks in the new hypertable. A non-empty table will generate an error without this option. Large tables may take significant time to migrate. Defaults to FALSE. |
| `time_partitioning_func` | Function to convert incompatible primary time column values to compatible ones. The function must be `IMMUTABLE`. |
| `replication_factor` | If set to 1 or greater, will create a distributed hypertable. Default is NULL. When creating a distributed hypertable, consider using [`create_distributed_hypertable`](#create_distributed_hypertable) in place of `create_hypertable`. |
| `data_nodes` | This is the set of data nodes that will be used for this table if it is distributed. This has no impact on non-distributed hypertables. If no data nodes are specified, a distributed hypertable will use all data nodes known by this instance. |

#### Returns [](create_hypertable-returns)

|Column|Description|
|---|---|
| `hypertable_id` | ID of the hypertable in TimescaleDB. |
| `schema_name` | Schema name of the table converted to hypertable. |
| `table_name` | Table name of the table converted to hypertable. |
| `created` | TRUE if the hypertable was created, FALSE when `if_not_exists` is true and no hypertable was created. |

>:TIP: If you use `SELECT * FROM create_hypertable(...)` you will get the return value formatted
as a table with column headings.

>:WARNING: The use of the `migrate_data` argument to convert a non-empty table can
lock the table for a significant amount of time, depending on how much data is
in the table. It can also run into deadlock if foreign key constraints exist to other
tables.
>
>If you would like finer control over index formation and other aspects
    of your hypertable, [follow these migration instructions instead][migrate-from-postgresql].
>
>When converting a normal SQL table to a hypertable, pay attention
to how you handle constraints. A hypertable can contain foreign keys to normal SQL table
columns, but the reverse is not allowed. UNIQUE and PRIMARY constraints must include the
partitioning key.
>
>The deadlock is likely to happen when concurrent transactions simultaneously try
to insert data into tables that are referenced in the foreign key constraints and into the
converting table itself. The deadlock can be prevented by manually obtaining `SHARE ROW EXCLUSIVE` lock
on the referenced tables before calling `create_hypertable` in the same transaction,
see [PostgreSQL documentation][postgres-lock] for the syntax.
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
SELECT create_hypertable('conditions', 'time', chunk_time_interval => INTERVAL '1 day');
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
total chunk sizes via the [`chunks_detailed_size`](#chunks_detailed_size)
function.

**Space partitions:** In most cases, it is advised for users not to use
space partitions. However, if you create a distributed hypertable, it is 
important to create space partitioning, see 
[create_distributed_hypertable](#create_distributed_hypertable). 
The rare cases in which space partitions may be useful for non-distributed
hypertables are described in the [add_dimension](#add_dimension) section.

---

## create_distributed_hypertable() [](create_distributed_hypertable)

Creates a TimescaleDB hypertable distributed across multiple data
nodes. Use this function in place of
[`create_hypertable`](#create_hypertable) when creating a distributed
hypertable. Creating a distributed hypertable is governed by the same
basic limitations as when creating a regular hypertable, e.g., the
PostgreSQL table turned into a distributed hypertable cannot already
be partitioned. Further, it is not possible to turn a regular
hypertable into a distributed hypertable and data migration (via the
`migrate_data` option) is currently unsupported.

#### Required Arguments [](create_distributed_hypertable-required-arguments)

|Name|Description|
|---|---|
| `relation` | Identifier of table to convert to hypertable. |
| `time_column_name` | Name of the column containing time values as well as the primary column to partition by. |

#### Optional Arguments [](create_distributed_hypertable-optional-arguments)

|Name|Description|
|---|---|
| `partitioning_column` | Name of an additional column to partition by. |
| `number_partitions` | Number of hash partitions to use for `partitioning_column`. Must be > 0. Default is the number of `data_nodes`. |
| `associated_schema_name` | Name of the schema for internal hypertable tables. Default is "_timescaledb_internal". |
| `associated_table_prefix` | Prefix for internal hypertable chunk names. Default is "_hyper". |
| `chunk_time_interval` | Interval in event time that each chunk covers. Must be > 0. As of TimescaleDB v0.11.0, default is 7 days, unless adaptive chunking (DEPRECATED)  is enabled, in which case the interval starts at 1 day. For previous versions, default is 1 month. |
| `create_default_indexes` | Boolean whether to create default indexes on time/partitioning columns. Default is TRUE. |
| `if_not_exists` | Boolean whether to print warning if table already converted to hypertable or raise exception. Default is FALSE. |
| `partitioning_func` | The function to use for calculating a value's partition.|
| `migrate_data` | Currently, this option is not supported for distributed hypertables and will generate an error if set to TRUE. |
| `time_partitioning_func` | Function to convert incompatible primary time column values to compatible ones. The function must be `IMMUTABLE`. |
| `replication_factor` | The number of data nodes to which the same data is written to. This is done by creating chunk copies on this amount of data nodes.  Must be >= 1; default is 1.  Read [the best practices](#create_distributed_hypertable-best-practices) before changing the default. |
| `data_nodes` | The set of data nodes used for the distributed hypertable.  If not present, defaults to all data nodes known by the access node (the node on which the distributed hypertable is created). |

#### Returns

|Column|Description|
|---|---|
| `hypertable_id` | ID of the hypertable in TimescaleDB. |
| `schema_name` | Schema name of the table converted to hypertable. |
| `table_name` | Table name of the table converted to hypertable. |
| `created` | TRUE if the hypertable was created, FALSE when `if_not_exists` is TRUE and no hypertable was created. |

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

**Replication factor:**  The hypertable's `replication_factor` defines to how
many data nodes a newly created chunk will be replicated.  That is, a chunk
with a `replication_factor` of three will exist on three separate data nodes,
and rows written to that chunk will be inserted (as part of a two-phase
commit protocol) to all three chunk copies.  For chunks replicated more
than once, if a data node fails or is removed, no data will be lost, and writes
can continue to succeed on the remaining chunk copies.  However, the chunks
present on the lost data node will now be under-replicated.  Currently, it is 
not possible to restore under-replicated chunks, although this limitation will
be removed in a future release. To avoid such inconsistency, we do not yet
recommend using `replication_factor` > 1, and instead rely on physical
replication of each data node if such fault-tolerance is required.

---

## CREATE INDEX (Transaction Per Chunk) [](create_index)

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
| `node_name` | (NAME) Name of the data node. |

#### Optional Arguments [](delete_data_node-optional-arguments)

| Name          | Description                                           |
|---------------|-------------------------------------------------------|
| `if_exists`   | (BOOLEAN) Prevent error if the data node does not exist. Defaults to false. |
| `force`       | (BOOLEAN) Force removal of data nodes from hypertables unless that would result in data loss.  Defaults to false. |
| `repartition` | (BOOLEAN) Make the number of space partitions equal to the new number of data nodes (if such partitioning exists). This ensures that the remaining data nodes are used evenly. Defaults to true. |

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
| `node_name` | (NAME) Name of data node to detach from the distributed hypertable |

#### Optional Arguments [](detach_data_node-optional-arguments)

| Name          | Description                            |
|---------------|----------------------------------------|
| `hypertable`  | (REGCLASS) Name of the distributed hypertable where the data node should be detached. If NULL, the data node will be detached from all hypertables. |
| `if_attached` | (BOOLEAN) Prevent error if the data node is not attached. Defaults to false. |
| `force`       | (BOOLEAN) Force detach of the data node even if that means that the replication factor is reduced below what was set. Note that it will never be allowed to reduce the replication factor below 1 since that would cause data loss.         |
| `repartition` | (BOOLEAN) Make the number of space partitions equal to the new number of data nodes (if such partitioning exists). This ensures that the remaining data nodes are used evenly. Defaults to true. |

#### Returns

The number of hypertables the data node was detached from.

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
SELECT detach_data_node('dn3', 'conditions');
```

---
## detach_tablespace() [](detach_tablespace)

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
| `tablespace` | (NAME) Tablespace to detach.|

When giving only the tablespace name as argument, the given tablespace
will be detached from all hypertables that the current role has the
appropriate permissions for. Therefore, without proper permissions,
the tablespace may still receive new chunks after this command
is issued.


#### Optional Arguments [](detach_tablespace-optional-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Hypertable to detach a the tablespace from.|
| `if_attached` | (BOOLEAN) Set to true to avoid throwing an error if the tablespace is not attached to the given table. A notice is issued instead. Defaults to false. |


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

## detach_tablespaces() [](detach_tablespaces)

Detach all tablespaces from a hypertable. After issuing this command
on a hypertable, it will no longer have any tablespaces attached to
it. New chunks will instead be placed in the database's default
tablespace.

#### Required Arguments [](detach_tablespaces-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Hypertable to detach a the tablespace from.|

#### Sample Usage [](detach_tablespaces-examples)

Detach all tablespaces from the hypertable `conditions`:

```sql
SELECT detach_tablespaces('conditions');
```

---
## distributed_exec() [](distributed_exec)

This procedure is used on an access node to execute a SQL command
across the data nodes of a distributed database. For instance, one use
case is to create the roles and permissions needed in a distributed
database.

The procedure can run distributed commands transactionally, so a command
is executed either everywhere or nowhere. However, not all SQL commands can run in a 
transaction. This can be toggled with the argument `transactional`. Note if the execution 
is not transactional, a failure on one of the data node will require manual dealing with
any introduced inconsistency.

Note that the command is _not_ executed on the access node itself and
it is not possible to chain multiple commands together in one call.

#### Required Arguments [](distributed_exec-required-arguments)

|Name|Description|
|---|---|
| `query` | The command to execute on data nodes. |

#### Optional Arguments [](distributed_exec-optional-arguments)

|Name|Description|
|---|---|
| `node_list` | An array of data nodes where the command should be executed. Defaults to all data nodes if not specified. |
| `transactional` | Allows to specify if the execution of the statement should be transactional or not. Defaults to TRUE. |

#### Sample Usage [](distributed_exec-examples)

Create the role `testrole` across all data nodes in a distributed database:

```sql
CALL distributed_exec($$ CREATE USER testrole WITH LOGIN $$);

```

Create the role `testrole` on two specific data nodes:

```sql
CALL distributed_exec($$ CREATE USER testrole WITH LOGIN $$, node_list => '{ "dn1", "dn2" }');

```

Create new databases `dist_database` on data nodes, which requires to set `transactional` to FALSE:

```sql
CALL distributed_exec('CREATE DATABASE dist_database', transactional => FALSE);
```

---

## drop_chunks() [](drop_chunks)

Removes data chunks whose time range falls completely before (or
after) a specified time.  Shows a list of the chunks that were
dropped, in the same style as the `show_chunks` [function](#show_chunks).

Chunks are constrained by a start and end time and the start time is
always before the end time.  A chunk is dropped if its end time is
older than the `older_than` timestamp or, if `newer_than` is given,
its start time is newer than the `newer_than` timestamp.

Note that, because chunks are removed if and only if their time range
falls fully before (or after) the specified timestamp, the remaining
data may still contain timestamps that are before (or after) the
specified one.

#### Required Arguments [](drop_chunks-required-arguments)

|Name|Description|
|---|---|
| `relation` | (REGCLASS) Hypertable or continuous aggregate from which to drop chunks. |
| `older_than` | Specification of cut-off point where any full chunks older than this timestamp should be removed. |

#### Optional Arguments [](drop_chunks-optional-arguments)

|Name|Description|
|---|---|
| `newer_than` | Specification of cut-off point where any full chunks newer than this timestamp should be removed. |
| `verbose` | (BOOLEAN) Setting to true will display messages about the progress of the reorder command. Defaults to false.|

The `older_than` and `newer_than` parameters can be specified in two ways:

- **interval type:** The cut-off point is computed as `now() -
    older_than` and similarly `now() - newer_than`.  An error will be
    returned if an INTERVAL is supplied and the time column is not one
    of a `TIMESTAMP`, `TIMESTAMPTZ`, or `DATE`.

- **timestamp, date, or integer type:** The cut-off point is
    explicitly given as a `TIMESTAMP` / `TIMESTAMPTZ` / `DATE` or as a
    `SMALLINT` / `INT` / `BIGINT`. The choice of timestamp or integer
    must follow the type of the hypertable's time column.


>:WARNING: When using just an interval type, the function assumes that
you are are removing things _in the past_. If you want to remove data
in the future (i.e., erroneous entries), use a timestamp.

When both arguments are used, the function returns the intersection of the resulting two ranges. For example,
specifying `newer_than => 4 months` and `older_than => 3 months` will drop all full chunks that are between 3 and
4 months old. Similarly, specifying `newer_than => '2017-01-01'` and `older_than => '2017-02-01'` will drop
all full chunks between '2017-01-01' and '2017-02-01'. Specifying parameters that do not result in an overlapping
intersection between two ranges will result in an error.

#### Sample Usage [](drop_chunks-examples)

Drop all chunks from hypertable `conditions` older than 3 months:
```sql
SELECT drop_chunks('conditions', INTERVAL '3 months');
```

Example output:

```sql
              drop_chunks
----------------------------------------
 _timescaledb_internal._hyper_3_5_chunk
 _timescaledb_internal._hyper_3_6_chunk
 _timescaledb_internal._hyper_3_7_chunk
 _timescaledb_internal._hyper_3_8_chunk
 _timescaledb_internal._hyper_3_9_chunk
(5 rows)
```

Drop all chunks more than 3 months in the future from hypertable
`conditions`. This is useful for correcting data ingested with
incorrect clocks:

```sql
SELECT drop_chunks('conditions', newer_than => now() + interval '3 months');
```

Drop all chunks from hypertable `conditions` before 2017:
```sql
SELECT drop_chunks('conditions', '2017-01-01'::date);
```

Drop all chunks from hypertable `conditions` before 2017, where time
column is given in milliseconds from the UNIX epoch:

```sql
SELECT drop_chunks('conditions', 1483228800000);
```

Drop all chunks older than 3 months ago and newer than 4 months ago from hypertable `conditions`:
```sql
SELECT drop_chunks('conditions', older_than => INTERVAL '3 months', newer_than => INTERVAL '4 months')
```

Drop all chunks older than 3 months ago across all hypertables:
```sql
SELECT drop_chunks(format('%I.%I', hypertable_schema, hypertable_name)::regclass, INTERVAL '3 months')
  FROM timescaledb_information.hypertables;
```

---

## set_chunk_time_interval() [](set_chunk_time_interval)
Sets the chunk_time_interval on a hypertable. The new interval is used
when new chunks are created but the time intervals on existing chunks are
not affected.

#### Required Arguments [](set_chunk_time_interval-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Hypertable to update interval for.|
| `chunk_time_interval` | Interval in event time that each new chunk covers. Must be > 0.|

#### Optional Arguments [](set_chunk_time_interval-optional-arguments)
| Name | Description |
|---|---|
| `dimension_name` | The name of the time dimension to set the number of partitions for.  Only used when hypertable has multiple time dimensions. |

The valid types for the `chunk_time_interval` depend on the type of
hypertable time column:

- **TIMESTAMP, TIMESTAMPTZ, DATE:** The specified
    `chunk_time_interval` should be given either as an INTERVAL type
    (`INTERVAL '1 day'`) or as an
    integer or bigint value (representing some number of microseconds).

- **INTEGER:** The specified `chunk_time_interval` should be an
    integer (smallint, int, bigint) value and represent the underlying
    semantics of the hypertable's time column, e.g., given in
    milliseconds if the time column is expressed in milliseconds
    (see `create_hypertable` [instructions](#create_hypertable)).

#### Sample Usage [](set_chunk_time_interval-examples)

For a TIMESTAMP column, set `chunk_time_interval` to 24 hours.
```sql
SELECT set_chunk_time_interval('conditions', INTERVAL '24 hours');
SELECT set_chunk_time_interval('conditions', 86400000000);
```

For a time column expressed as the number of milliseconds since the
UNIX epoch, set `chunk_time_interval` to 24 hours.
```sql
SELECT set_chunk_time_interval('conditions', 86400000);
```

---

## set_number_partitions() [](set_number_partitions)
Sets the number of partitions (slices) of a space dimension on a
hypertable. The new partitioning only affects new chunks.

#### Required Arguments [](set_number_partitions-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Hypertable to update the number of partitions for.|
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

## set_integer_now_func() [](set_integer_now_func)
This function is only relevant for hypertables with integer (as opposed to
TIMESTAMP/TIMESTAMPTZ/DATE) time values. For such hypertables, it sets a
function that returns the `now()` value (current time) in the units of the time
column. This is necessary for running some policies on integer-based tables.
In particular, many policies only apply to chunks of a certain age and a
function that returns the current time is necessary to determine the age of a
chunk.

#### Required Arguments [](set_integer_now_func-required-arguments)

|Name|Description|
|---|---|
| `main_table` | (REGCLASS) Hypertable to set the integer now function for .|
| `integer_now_func` | (REGPROC) A function that returns the current time value in the same units as the time column. |

#### Optional Arguments [](set_integer_now_func-optional-arguments)

|Name|Description|
|---|---|
| `replace_if_exists` | (BOOLEAN) Whether to override the function if one is already set. Defaults to false.|

#### Sample Usage [](set_integer_now_func-examples)

To set the integer now function for a hypertable with a time column in unix
time (number of seconds since the unix epoch, UTC).

```
CREATE OR REPLACE FUNCTION unix_now() returns BIGINT LANGUAGE SQL STABLE as $$ SELECT extract(epoch from now())::BIGINT $$;

SELECT set_integer_now_func('test_table_bigint', 'unix_now');
```

---

## set_replication_factor() [](set_replication_factor)
Sets the replication factor of a distributed hypertable to the given value.
Changing the replication factor does not affect the number of replicas for existing chunks.
Chunks created after changing the replication factor will be replicated
in accordance with new value of the replication factor. If the replication factor cannot be
satisfied, since the amount of attached data nodes is less than new replication factor,
the command aborts with an error.

If existing chunks have less replicas than new value of the replication factor,
the function will print a warning.

#### Required Arguments [](set_replication_factor-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Distributed hypertable to update the replication factor for.|
| `replication_factor` | (INTEGER) The new value of the replication factor. Must be greater than 0, and smaller than or equal to the number of attached data nodes.|

#### Errors

An error will be given if:
- `hypertable` is not a distributed hypertable.
- `replication_factor` is less than `1`, which cannot be set on a distributed hypertable.
- `replication_factor` is bigger than the number of attached data nodes.

If a bigger replication factor is desired, it is necessary to attach more data nodes
by using [attach_data_node](#attach_data_node).

#### Sample Usage [](set_replication_factor-examples)

Update the replication factor for a distributed hypertable to `2`:
```sql
SELECT set_replication_factor('conditions', 2);
```

Example of the warning if any existing chunk of the distributed hypertable has less than 2 replicas:
```
WARNING:  hypertable "conditions" is under-replicated
DETAIL:  Some chunks have less than 2 replicas.
```

Example of providing too big of a replication factor for a hypertable with 2 attached data nodes:
```sql
SELECT set_replication_factor('conditions', 3);
ERROR:  too big replication factor for hypertable "conditions"
DETAIL:  The hypertable has 2 data nodes attached, while the replication factor is 3.
HINT:  Decrease the replication factor or attach more data nodes to the hypertable.
```

---

## show_chunks() [](show_chunks)
Get list of chunks associated with a hypertable.

Function accepts the following required and optional arguments. These arguments 
have the same semantics as the `drop_chunks` [function](#drop_chunks).

#### Required Arguments [](show_chunks-required-arguments)

|Name|Description|
|---|---|
| `relation` | (REGCLASS) Hypertable or continuous aggregate from which to select chunks. |

#### Optional Arguments [](show_chunks-optional-arguments)


|Name|Description|
|---|---|
| `older_than` | (ANY) Specification of cut-off point where any full chunks older than this timestamp should be shown. |
| `newer_than` | (ANY) Specification of cut-off point where any full chunks newer than this timestamp should be shown. |

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

Get list of all chunks associated with a table:
```sql
SELECT show_chunks('conditions');
```

Get all chunks from hypertable `conditions` older than 3 months:
```sql
SELECT show_chunks('conditions', older_than => INTERVAL '3 months');
```

Get all chunks from hypertable `conditions` before 2017:
```sql
SELECT show_chunks('conditions', older_than => DATE '2017-01-01');
```

---
## reorder_chunk() :community_function: [](reorder_chunk)

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

## move_chunk() :community_function: [](move_chunk)

TimescaleDB allows users to move data (and indexes) to alternative
tablespaces. This allows the user the ability to move data to more cost
effective storage as it ages. This function acts like the combination of the
[PostgreSQL CLUSTER command][postgres-cluster] and the
[PostgreSQL ALTER TABLE...SET TABLESPACE command][postgres-altertable].

Unlike these PostgreSQL commands, however, the `move_chunk` function employs
lower lock levels so that the chunk and hypertable are able to be read for most
of the process. This comes at a cost of slightly higher disk usage during the
operation. For a more detailed discussion of this capability, please see the
[Data Tiering][using-data-tiering] documentation.

#### Required Arguments [](move_chunk-required-arguments)

|Name|Description|
|---|---|
| `chunk` | (REGCLASS) Name of chunk to be moved. |
| `destination_tablespace` | (Name) Target tablespace for chunk you are moving. |
| `index_destination_tablespace` | (Name) Target tablespace for index associated with the chunk you are moving. |

#### Optional Arguments [](move_chunk-optional-arguments)

|Name|Description|
|---|---|
| `reorder_index` | (REGCLASS) The name of the index (on either the hypertable or chunk) to order by.|
| `verbose` | (BOOLEAN) Setting to true will display messages about the progress of the move_chunk command. Defaults to false.|


#### Sample Usage [](move_chunk-sample-usage)

``` sql
SELECT move_chunk(
  chunk => '_timescaledb_internal._hyper_1_4_chunk',
  destination_tablespace => 'tablespace_2',
  index_destination_tablespace => 'tablespace_3',
  reorder_index => 'conditions_device_id_time_idx',
  verbose => TRUE
);
```

---

## Compression :community_function: [](compression)

We highly recommend reading the [blog post][blog-compression] and
[tutorial][using-compression] about compression before trying to set it up
for the first time.

Setting up compression on TimescaleDB requires users to first [configure the
hypertable for compression](#compression_alter-table) and then [set up a
policy](#add_compression_policy) for when to compress chunks.

Advanced usage of compression allows users to [compress chunks
manually](#compress_chunk), instead of automatically as they age.

#### Restrictions

The current version does not support altering or inserting data into compressed
chunks. The data can be queried without any modifications, however if you
need to backfill or update data in a compressed chunk you will need to
decompress the chunk(s) first.

Starting with TimescaleDB 2.1, users have the ability to modify the schema
of hypertables that have compressed chunks.
Specifically, [you can add columns to and rename existing columns of such compressed hypertables](#compression-schema-changes).

#### Associated commands
*	[ALTER TABLE](#compression_alter-table)
*	[add_compression_policy](#add_compression_policy)
*	[remove_compression_policy](#remove_compression_policy)
*	[compress_chunk](#compress_chunk)
*	[decompress_chunk](#decompress_chunk)

## ALTER TABLE (Compression) :community_function: [](compression_alter-table)

'ALTER TABLE' statement is used to turn on compression and set compression
options.

The syntax is:

``` sql
ALTER TABLE <table_name> SET (timescaledb.compress, timescaledb.compress_orderby = '<column_name> [ASC | DESC] [ NULLS { FIRST | LAST } ] [, ...]',
timescaledb.compress_segmentby = '<column_name> [, ...]'
);
```
#### Required Options [](compression_alter-table-required-options)
|Name|Description|
|---|---|
| `timescaledb.compress` | Boolean to enable compression |

#### Other Options [](compression_alter-table-other-options)
|Name|Description|
|---|---|
| `timescaledb.compress_orderby` | Order used by compression, specified in the same way as the ORDER BY clause in a SELECT query. The default is the descending order of the hypertable's time column. |
| `timescaledb.compress_segmentby` | Column list on which to key the compressed segments. An identifier representing the source of the data such as `device_id` or `tags_id` is usually a good candidate. The default is no `segment by` columns. |

#### Parameters
|Name|Description|
|---|---|
| `table_name` | Name of the hypertable that will support compression |
| `column_name` | Name of the column used to order by and/or segment by |

#### Sample Usage [](compression_alter-table-sample)
Configure a hypertable that ingests device data to use compression.

```sql
ALTER TABLE metrics SET (timescaledb.compress, timescaledb.compress_orderby = 'time DESC', timescaledb.compress_segmentby = 'device_id');
```

## add_compression_policy() :community_function: [](add_compression_policy)
Allows you to set a policy by which the system will compress a chunk
automatically in the background after it reaches a given age. 

Note that compression policies can only be created on hypertables that already
have compression enabled, e.g., via the [`ALTER TABLE`](/api#compression_alter-table) command
to set `timescaledb.compress` and other configuration parameters.

#### Required Arguments [](add_compression_policy-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Name of the hypertable|
| `compress_after` | (INTERVAL or INTEGER) The age after which the policy job will compress chunks|

The `compress_after` parameter should be specified differently depending on the type of the time column of the hypertable:
- For hypertables with TIMESTAMP, TIMESTAMPTZ, and DATE time columns: the time interval should be an INTERVAL type.
- For hypertables with integer-based timestamps: the time interval should be an integer type (this requires
the [integer_now_func](#set_integer_now_func) to be set).

#### Optional Arguments [](add_compression_policy-optional-arguments)

|Name|Description|
|---|---|
| `if_not_exists` | (BOOLEAN) Setting to true will cause the command to fail with a warning instead of an error if a compression policy already exists on the hypertable. Defaults to false.|

#### Sample Usage [](add_compression_policy-sample-usage)
Add a policy to compress chunks older than 60 days on the 'cpu' hypertable.

``` sql
SELECT add_compression_policy('cpu', INTERVAL '60d');
```

Add a compress chunks policy to a hypertable with an integer-based time column:

``` sql
SELECT add_compression_policy('table_with_bigint_time', BIGINT '600000');
```

## remove_compression_policy() :community_function: [](remove_compression_policy)
If you need to remove the compression policy. To re-start policy-based compression again you will need to re-add the policy.

#### Required Arguments [](remove_compression_policy-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Name of the hypertable the policy should be removed from.|

#### Optional Arguments [](remove_compression_policy-optional-arguments)

|Name|Description|
|---|---|
| `if_exists` | (BOOLEAN) Setting to true will cause the command to fail with a notice instead of an error if a compression policy does not exist on the hypertable. Defaults to false.|

#### Sample Usage [](remove_compression_policy-sample-usage)
Remove the compression policy from the 'cpu' table:
``` sql
SELECT remove_compression_policy('cpu');
```

## compress_chunk() :community_function: [](compress_chunk)

The compress_chunk function is used to compress a specific chunk. This is
most often used instead of the
[add_compression_policy](#add_compression_policy) function, when a user
wants more control over the scheduling of compression. For most users, we
suggest using the policy framework instead.

>:TIP: You can get a list of chunks belonging to a hypertable using the
`show_chunks` [function](#show_chunks).

#### Required Arguments [](compress_chunk-required-arguments)

|Name|Description|
|---|---|
| `chunk_name` | (REGCLASS) Name of the chunk to be compressed|


#### Optional Arguments [](compress_chunk-optional-arguments)

|Name|Description|
|---|---|
| `if_not_compressed` | (BOOLEAN) Setting to true will skip chunks that are already compressed. Defaults to false.|

#### Sample Usage [](compress_chunk-sample-usage)
Compress a single chunk.

``` sql
SELECT compress_chunk('_timescaledb_internal._hyper_1_2_chunk');
```

## decompress_chunk() :community_function: [](decompress_chunk)
If you need to modify or add data to a chunk that has already been
compressed, you will need to decompress the chunk first. This is especially
useful for backfilling old data.

>:TIP: Prior to decompressing chunks for the purpose of data backfill or updating you should
first stop any compression policy that is active on the hypertable you plan to perform this
operation on.  Once the update and/or backfill is complete simply turn the policy back on
and the system will recompress your chunks.

#### Required Arguments [](decompress_chunk-required-arguments)
|Name|Description|
|---|---|
| `chunk_name` | (REGCLASS) Name of the chunk to be decompressed. |

#### Optional Arguments [](decompress_chunk-optional-arguments)

|Name|Description|
|---|---|
| `if_compressed` | (BOOLEAN) Setting to true will skip chunks that are not compressed. Defaults to false.|

#### Sample Usage [](decompress_chunk-sample-usage)
Decompress a single chunk

``` sql
SELECT decompress_chunk('_timescaledb_internal._hyper_2_2_chunk');
```

---

## Continuous Aggregates :community_function: [](continuous-aggregates)
TimescaleDB allows users the ability to automatically recompute aggregates
at predefined intervals and materialize the results. This is suitable for
frequently used queries. For a more detailed discussion of this capability,
please see [using TimescaleDB Continuous Aggregates][using-continuous-aggs].

*  [CREATE MATERIALIZED VIEW](#continuous_aggregate-create_view)
*  [ALTER MATERIALIZED VIEW](#continuous_aggregate-alter_view)
*  [DROP MATERIALIZED VIEW](#continuous_aggregate-drop_view)
*  [refresh_continuous_aggregate()](#refresh_continuous_aggregate)

## CREATE MATERIALIZED VIEW (Continuous Aggregate) :community_function: [](continuous_aggregate-create_view)
`CREATE MATERIALIZED VIEW` statement is used to create continuous aggregates.

The syntax is:
``` sql
CREATE MATERIALIZED VIEW <view_name> [ ( column_name [, ...] ) ]
  WITH ( timescaledb.continuous [, timescaledb.<option> = <value> ] )
  AS
    <select_query>
  [WITH [NO] DATA]
```

`<select_query>` is of the form :

```sql
SELECT <grouping_exprs>, <aggregate_functions>
    FROM <hypertable>
[WHERE ... ]
GROUP BY time_bucket( <const_value>, <partition_col_of_hypertable> ),
         [ optional grouping exprs>]
[HAVING ...]
```
Note that continuous aggregates have some limitations of what types of
queries they can support, described in more length below.  For example,
the `FROM` clause must provide only one hypertable, i.e., no joins, CTEs, views or 
subqueries are supported. The `GROUP BY` clause must include a time bucket on 
the hypertable's time column, and all aggregates must be parallelizable.

#### Parameters
|Name|Description|
|---|---|
| `<view_name>` | Name (optionally schema-qualified) of continuous aggregate view to be created.|
| `<column_name>`| Optional list of names to be used for columns of the view. If not given, the column names are deduced from the query.|
| `WITH` clause | This clause specifies [options](#continuous_aggregate-create_view-with) for the continuous aggregate view.|
| `<select_query>`| A `SELECT` query that uses the specified syntax. |

#### Required `WITH` clause options [](continuous_aggregate-create_view-with-required)

|**Name**|||
|---|---|---|
|`timescaledb.continuous`|||
|**Description**|**Type**|**Default**|
|If timescaledb.continuous is not specified, then this is a regular PostgresSQL materialized view. | `BOOLEAN` ||

#### Optional `WITH` clause options [](continuous_aggregate-create_view-with-optional)

|**Name**|||
|---|---|---|
|`timescaledb.materialized_only`|||
|**Description**|**Type**|**Default**|
| Return only materialized data when querying the continuous aggregate view. See more in section on [real-time aggregates][real-time-aggregates]. | `BOOLEAN` | false |
|   |   |   |
|`timescaledb.create_group_indexes`|||
|**Description**|**Type**|**Default**|
| Create indexes on the materialization table for the group by columns (specified by the `GROUP BY` clause of the `SELECT` query). | `BOOLEAN` | Indexes are created by default for every group by expression + time_bucket expression pair.|

#### Notes

- The view will be automatically refreshed (as outlined under
  [`refresh_continuous_aggregate`](#refresh_continuous_aggregate))
  unless `WITH NO DATA` is given (`WITH DATA` is the default).
- The `SELECT` query should be of the form specified in the syntax above, which is discussed in
  the following items.
- Only a single hypertable can be specified in the `FROM` clause of the 
  `SELECT` query. This means that including more hypertables, joins, tables, views, subqueries
  is not supported.
- The hypertable used in the `SELECT` may not have [row-level-security
  policies][postgres-rls] enabled.
-  The `GROUP BY` clause must include a time_bucket expression. The
   [`time_bucket`](#time_bucket) expression must use the time
   dimension column of the hypertable.
- [`time_bucket_gapfill`](#time_bucket_gapfill) is not allowed in continuous
  aggs, but may be run in a `SELECT` from the continuous aggregate view.
- In general, aggregates which can be [parallelized by
  PostgreSQL][postgres-parallel-agg] are allowed in the view
  definition, this includes most aggregates distributed with
  PostgreSQL. Aggregates with `ORDER BY`, `DISTINCT` and `FILTER`
  clauses are not permitted.
- All functions and their arguments included in `SELECT`, `GROUP BY`
  and `HAVING` clauses must be [immutable][postgres-immutable].
- The view is not allowed to be a [security barrier view][postgres-security-barrier].
- Window functions cannot be used in conjunction with continuous aggregates.

[postgres-immutable]:https://www.postgresql.org/docs/current/xfunc-volatility.html
[postgres-parallel-agg]:https://www.postgresql.org/docs/current/parallel-plans.html#PARALLEL-AGGREGATION
[postgres-rls]:https://www.postgresql.org/docs/current/ddl-rowsecurity.html
[postgres-security-barrier]:https://www.postgresql.org/docs/current/rules-privileges.html

>:TIP: You can find the [settings for continuous aggregates](#timescaledb_information-continuous_aggregate) and
[statistics](#timescaledb_information-job_stats) in `timescaledb_information` views.

#### Sample Usage [](continuous_aggregate-create-examples)
Create a continuous aggregate view.
```sql
CREATE MATERIALIZED VIEW continuous_aggregate_view( timec, minl, sumt, sumh )
WITH (timescaledb.continuous) AS
  SELECT time_bucket('1day', timec), min(location), sum(temperature), sum(humidity)
    FROM conditions
    GROUP BY time_bucket('1day', timec)
```

Add additional continuous aggregates on top of the same raw hypertable.
```sql
CREATE MATERIALIZED VIEW continuous_aggregate_view( timec, minl, sumt, sumh )
WITH (timescaledb.continuous) AS
  SELECT time_bucket('30day', timec), min(location), sum(temperature), sum(humidity)
    FROM conditions
    GROUP BY time_bucket('30day', timec);
```

```sql
CREATE MATERIALIZED VIEW continuous_aggregate_view( timec, minl, sumt, sumh )
WITH (timescaledb.continuous) AS
  SELECT time_bucket('1h', timec), min(location), sum(temperature), sum(humidity)
    FROM conditions
    GROUP BY time_bucket('1h', timec);
```

---

## ALTER MATERIALIZED VIEW (Continuous Aggregate) :community_function: [](continuous_aggregate-alter_view)
`ALTER MATERIALIZED VIEW` statement can be used to modify some of the `WITH` clause [options](#continuous_aggregate-create_view-with-optional) for the continuous aggregate view. 
`ALTER MATERIALIZED VIEW` statement also supports the following 
[PostgreSQL clauses][postgres-alterview] on the 
continuous aggregate view: 

- `RENAME TO` clause to rename the continuous aggregate view;
- `SET SCHEMA` clause to set the new schema for the continuous aggregate view;
- `SET TABLESPACE` clause to move the materialization of the continuous 
  aggregate view to the new tablespace;
- `OWNER TO` clause to set new owner for the continuous aggregate view.

``` sql
ALTER MATERIALIZED VIEW <view_name> SET ( timescaledb.<option> =  <value> [, ... ] )
```
#### Parameters
|Name|Description|
|---|---|
| `<view_name>` | Name (optionally schema-qualified) of continuous aggregate view to be created.|

#### Sample Usage [](continuous_aggregate-alter_view-examples)

To disable [real-time aggregates][real-time-aggregates] for a
continuous aggregate:

```sql
ALTER MATERIALIZED VIEW contagg_view SET (timescaledb.materialized_only = true);
```

The only option that currently can be modified with `ALTER
MATERIALIZED VIEW` is `materialized_only`. The other options
`continuous` and `create_group_indexes` can only be set when creating
the continuous aggregate.

---

## DROP MATERIALIZED VIEW (Continuous Aggregate) :community_function: [](continuous_aggregate-drop_view)
Continuous aggregate views can be dropped using the `DROP MATERIALIZED VIEW` statement.

This statement deletes the continuous aggregate and all its internal
objects. To also delete other dependent objects, such as a view
defined on the continuous aggregate, add the `CASCADE`
option. Dropping a continuous aggregate does not affect the data in
the underlying hypertable from which the continuous aggregate is
derived.

``` sql
DROP MATERIALIZED VIEW <view_name>;
```
#### Parameters
|Name|Description|
|---|---|
| `<view_name>` | Name (optionally schema-qualified) of continuous aggregate view to be created.|

#### Sample Usage [](continuous_aggregate-drop_view-examples)
Drop existing continuous aggregate.
```sql
DROP MATERIALIZED VIEW contagg_view;
```

## refresh_continuous_aggregate() :community_function: [](refresh_continuous_aggregate)

Refresh all buckets of a continuous aggregate between two points of
time. 

The function expects the parameter values to have the same time type
as used in the continuous aggregate's time bucket expression (e.g., if
the time bucket specifies in `timestamptz`, then the start and end time
supplied should also be `timestamptz`).

#### Required Arguments [](refresh_continuous_aggregate-required-arguments)

|Name|Description|
|---|---|
| `continuous_aggregate` | (REGCLASS) The continuous aggregate to refresh. |
| `window_start` | Start of the window to refresh, has to be before `window_end`. `NULL` is eqivalent to `MIN(timestamp)` of the hypertable. |
| `window_end` | End of the window to refresh, has to be after `window_start`. `NULL` is eqivalent to `MAX(timestamp)` of the hypertable. |

#### Sample Usage [](refresh_continuous_aggregate-examples)

Refresh the continuous aggregate `conditions` between `2020-01-01` and
`2020-02-01` exclusive.

```sql
CALL refresh_continuous_aggregate('conditions', '2020-01-01', '2020-02-01');
```

---

## Automation policies :community_function: [](automation-policies)

TimescaleDB includes an automation framework for allowing background tasks to
run inside the database, controllable by user-supplied policies. These tasks
currently include capabilities around data retention and data reordering for
improving query performance.

The following functions allow the administrator to create/remove/alter policies
that schedule administrative actions to take place on a hypertable. The actions
are meant to implement data retention or perform tasks that will improve query
performance on older chunks. Each policy is assigned a scheduled job
which will be run in the background to enforce it.

Information about jobs created by policies can be viewed by querying 
`timescaledb_information.jobs` and `timescaledb_information.job_stats`.

## add_continuous_aggregate_policy() :community_function: [](add_continuous_aggregate_policy)

Create a policy that automatically refreshes a continuous aggregate.

#### Required Arguments [](add_continuous_aggregate_policy-required-arguments)

|Name|Description|
|---|---|
| `continuous_aggregate` | (REGCLASS) The continuous aggregate to add the policy for. |
| `start_offset` | (INTERVAL or integer) Start of the refresh window as an interval relative to the time when the policy is executed |
| `end_offset` | (INTERVAL or integer) End of the refresh window as an interval relative to the time when the policy is executed |
| `schedule_interval` | (INTERVAL) Interval between refresh executions in wall-clock time. |

The `start_offset` should be greater than `end_offset`.
The `start_offset` and `end_offset` parameters should be specified differently depending on the type of the time column of the hypertable:
- For hypertables with TIMESTAMP, TIMESTAMPTZ, and DATE time columns: the offset should be an INTERVAL type
- For hypertables with integer-based timestamps: the offset should be an integer type.

#### Optional Arguments [](add_continuous_aggregate_policy-optional-arguments)

|Name|Description|
|---|---|
| `if_not_exists` | (BOOLEAN) Set to true to avoid throwing an error if the continuous aggregate policy already exists. A notice is issued instead. Defaults to false. |

#### Returns [](add_continuous_aggregate_policy-returns)

|Column|Description|
|---|---|
|`job_id`| (INTEGER)  TimescaleDB background job id created to implement this policy|


#### Sample Usage [](add_continuous_aggregate_policy-examples)

Add a policy that refreshes the last month once an hour, excluding the latest hour from the aggregate (for performance reasons, it is recommended to exclude buckets that still see lots of writes):
```sql
SELECT add_continuous_aggregate_policy('conditions_summary',
	start_offset => INTERVAL '1 month',
	end_offset => INTERVAL '1 hour',
	schedule_interval => INTERVAL '1 hour');
```

---
## add_job() :community_function: [](add_job)

Register an action to be scheduled by our automation framework.
Please read the [instructions][using-actions] for more details including
multiple example actions.

#### Required Arguments [](add_job-required-arguments)

|Name|Description|
|---|---|
| `proc` | (REGPROC) Name of the function or procedure to register as job|
| `schedule_interval` | (INTERVAL) Interval between executions of this job|

#### Optional Arguments [](add_job-optional-arguments)

|Name|Description|
|---|---|
| `config` | (JSONB) Job-specific configuration (this will be passed to the function when executed)|
| `initial_start` | (TIMESTAMPTZ) Time of first execution of job |
| `scheduled` | (BOOLEAN) Set to `FALSE` to exclude this job from scheduling. Defaults to `TRUE`. |

#### Returns [](add_job-returns)

|Column|Description|
|---|---|
|`job_id`| (INTEGER)  TimescaleDB background job id |

#### Sample Usage [](add_job-examples)

```sql
CREATE OR REPLACE PROCEDURE user_defined_action(job_id int, config jsonb) LANGUAGE PLPGSQL AS
$$
BEGIN
  RAISE NOTICE 'Executing action % with config %', job_id, config;
END
$$;

SELECT add_job('user_defined_action','1h');
```

Register the procedure `user_defined_action` to be run every hour.

## delete_job() :community_function: [](delete_job)

Delete a job registered with the automation framework.
This works for user-defined actions as well as policies.

If the job is currently running, the process will be terminated.

#### Required Arguments [](delete_job-required-arguments)

|Name|Description|
|---|---|
|`job_id`| (INTEGER)  TimescaleDB background job id |

#### Sample Usage [](delete_job-examples)

```sql
SELECT delete_job(1000);
```

Delete the job with the job id 1000.

## run_job() :community_function: [](run_job)

Run a previously registered job in the current session.
This works for user-defined actions as well as policies.
Since `run_job` is implemented as stored procedure it cannot be executed
inside a SELECT query but has to be executed with [CALL](postgres-call).

>:TIP: Any background worker job can be run in foreground when executed with
`run_job`. This can be useful to debug problems when combined with increased
log level.

#### Required Arguments [](run_job-required-arguments)

|Name|Description|
|---|---|
|`job_id`| (INTEGER)  TimescaleDB background job id |

#### Sample Usage [](run_job-examples)

```sql
SET client_min_messages TO DEBUG1;
CALL run_job(1000);
```

Set log level shown to client to DEBUG1 and run the job with the job id 1000.

## remove_continuous_aggregate_policy() :community_function: [](remove_continuous_aggregate_policy)
Remove refresh policy for a continuous aggregate.

#### Required Arguments [](remove_continuous_aggregate_policy-required-arguments)

|Name|Description|
|---|---|
| `continuous_aggregate` | (REGCLASS) Name of the continuous aggregate the policy should be removed from |

#### Sample Usage [](remove_continuous_aggregate_policy-sample-usage)
Remove the refresh policy from the 'cpu_view' continuous aggregate:
``` sql
SELECT remove_continuous_aggregate_policy('cpu_view');
```
----

## add_retention_policy() :community_function: [](add_retention_policy)

Create a policy to drop chunks older than a given interval of a particular
hypertable or continuous aggregate on a schedule in the background. (See [drop_chunks](#drop_chunks)).
This implements a data retention policy and will remove data on a schedule. Only
one retention policy may exist per hypertable.

#### Required Arguments [](add_retention_policy-required-arguments)

|Name|Description|
|---|---|
| `relation` | (REGCLASS) Name of the hypertable or continuous aggregate to create the policy for. |
| `drop_after` | (INTERVAL or INTEGER) Chunks fully older than this interval when the policy is run will be dropped|

The `drop_after` parameter should be specified differently depending on the 
type of the time column of the hypertable:
- For hypertables with TIMESTAMP, TIMESTAMPTZ, and DATE time columns: the time 
interval should be an INTERVAL type.
- For hypertables with integer-based timestamps: the time interval should be an 
integer type (this requires the [integer_now_func](#set_integer_now_func) to be set).

#### Optional Arguments [](add_retention_policy-optional-arguments)

|Name|Description|
|---|---|
| `if_not_exists` | (BOOLEAN) Set to true to avoid throwing an error if the drop_chunks_policy already exists. A notice is issued instead. Defaults to false. |

#### Returns [](add_retention_policy-returns)

|Column|Description|
|---|---|
|`job_id`| (INTEGER)  TimescaleDB background job id created to implement this policy|

#### Sample Usage [](add_retention_policy-examples)

Create a data retention policy to discard chunks greater than 6 months old:
```sql
SELECT add_retention_policy('conditions', INTERVAL '6 months');
```

Create a data retention policy with an integer-based time column: 
```sql
SELECT add_retention_policy('conditions', BIGINT '600000');
```

---
## remove_retention_policy() :community_function: [](remove_retention_policy)
Remove a policy to drop chunks of a particular hypertable.

#### Required Arguments [](remove_retention_policy-required-arguments)

|Name|Description|
|---|---|
| `relation` | (REGCLASS) Name of the hypertable or continuous aggregate from which to remove the policy |


#### Optional Arguments [](remove_retention_policy-optional-arguments)

|Name|Description|
|---|---|
| `if_exists` | (BOOLEAN)  Set to true to avoid throwing an error if the policy does not exist. Defaults to false.|


#### Sample Usage [](remove_retention_policy-examples)


```sql
SELECT remove_retention_policy('conditions');
```

removes the existing data retention policy for the `conditions` table.


---
## add_reorder_policy() :community_function: [](add_reorder_policy)
Create a policy to reorder chunks on a given hypertable index in the
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
| `hypertable` | (REGCLASS) Hypertable to create the policy for. |
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
## remove_reorder_policy() :community_function: [](remove_reorder_policy)
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

## alter_job() :community_function: [](alter_job)

Actions scheduled via TimescaleDB's automation framework run periodically in a
background worker. You can change the schedule of their execution using `alter_job`.
To alter an existing job, you must refer to it by `job_id`.
The `job_id` which executes a given action and its current schedule can be found
either in the `timescaledb_information.jobs` view, which lists information 
about every scheduled action, as well as in `timescaledb_information.job_stats`.
The `job_stats` view additionally contains information about when each job was
last run and other useful statistics for deciding what the new schedule should be.

#### Required Arguments [](alter_job-required-arguments)

|Name|Description|
|---|---|
| `job_id` | (INTEGER) the id of the policy job being modified |

#### Optional Arguments [](alter_job-optional-arguments)

|Name|Description|
|---|---|
| `schedule_interval` | (INTERVAL)  The interval at which the job runs |
| `max_runtime` | (INTERVAL) The maximum amount of time the job will be allowed to run by the background worker scheduler before it is stopped |
| `max_retries` | (INTEGER)  The number of times the job will be retried should it fail |
| `retry_period` | (INTERVAL) The amount of time the scheduler will wait between retries of the job on failure |
| `scheduled` | (BOOLEAN)  Set to `FALSE` to exclude this job from being run as background job. |
| `config` | (JSONB) Job-specific configuration (this will be passed to the function when executed)|
| `next_start` | (TIMESTAMPTZ) The next time at which to run the job. The job can be paused by setting this value to 'infinity' (and restarted with a value of now()). |
| `if_exists` | (BOOLEAN)  Set to true to avoid throwing an error if the job does not exist, a notice will be issued instead. Defaults to false. |

#### Returns [](alter_job-returns)

|Column|Description|
|---|---|
| `job_id` | (INTEGER) the id of the job being modified |
| `schedule_interval` | (INTERVAL)  The interval at which the job runs |
| `max_runtime` | (INTERVAL) The maximum amount of time the job will be allowed to run by the background worker scheduler before it is stopped |
| `max_retries` | (INTEGER)  The number of times the job will be retried should it fail |
| `retry_period` | (INTERVAL) The amount of time the scheduler will wait between retries of the job on failure |
| `scheduled` | (BOOLEAN)  True if this job will be executed by the TimescaleDB scheduler. |
| `config` | (JSONB) Job-specific configuration (this will be passed to the function when executed)|
| `next_start` | (TIMESTAMPTZ) The next time at which to run the job. |

#### Sample Usage [](alter_job-examples)

```sql
SELECT alter_job(1000, schedule_interval => INTERVAL '2 days');
```
Reschedules the job with id 1000 so that it runs every two days.

```sql
SELECT alter_job(job_id, scheduled => false)
FROM timescaledb_information.jobs
WHERE proc_name = 'policy_compression' AND hypertable_name = 'conditions'
```
Disables scheduling of the compression policy on hypertable `conditions`.

```sql
SELECT alter_job(1015, next_start => '2020-03-15 09:00:00.0+00');
```

Reschedules continuous aggregate job `1015` so that the next execution of the
job starts at the specified time (9:00:00 am on March 15, 2020).

---
## Analytics [](analytics)

## first() [](first)

The `first` aggregate allows you to get the value of one column
as ordered by another. For example, `first(temperature, time)` will return the
earliest temperature value based on time within an aggregate group.

#### Required Arguments [](first-required-arguments)

|Name|Description|
|---|---|
| `value` | The value to return (anyelement) |
| `time` | The timestamp to use for comparison (TIMESTAMP/TIMESTAMPTZ or integer type)  |

#### Sample Usage [](first-examples)

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

## histogram() [](histogram)

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
  time_bucket_gapfill('1 day', time, now() - INTERVAL '1 week', now()) AS day,
  device_id,
  avg(temperature) AS value,
  interpolate(avg(temperature))
FROM metrics
WHERE time > now () - INTERVAL '1 week'
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
(7 row)
```

Get the average temperature every day for each device over the last 7 days interpolating for missing readings with lookup queries for values before and after the gapfill time range:
```sql
SELECT
  time_bucket_gapfill('1 day', time, now() - INTERVAL '1 week', now()) AS day,
  device_id,
  avg(value) AS value,
  interpolate(avg(temperature),
    (SELECT (time,temperature) FROM metrics m2 WHERE m2.time < now() - INTERVAL '1 week' AND m.device_id = m2.device_id ORDER BY time DESC LIMIT 1),
    (SELECT (time,temperature) FROM metrics m2 WHERE m2.time > now() AND m.device_id = m2.device_id ORDER BY time DESC LIMIT 1)
  ) AS interpolate
FROM metrics m
WHERE time > now () - INTERVAL '1 week'
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
WHERE time > now () - INTERVAL '1 day'
GROUP BY device_id, interval
ORDER BY interval DESC;
```

>:WARNING: The `last` and `first` commands do **not** use indexes, and instead
 perform a sequential scan through their groups.  They are primarily used
 for ordered selection within a `GROUP BY` aggregate, and not as an
 alternative to an `ORDER BY time DESC LIMIT 1` clause to find the
 latest value (which will use indexes).

---
## locf() :community_function: [](locf)

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
  time_bucket_gapfill('1 day', time, now() - INTERVAL '1 week', now()) AS day,
  device_id,
  avg(temperature) AS value,
  locf(avg(temperature))
FROM metrics
WHERE time > now () - INTERVAL '1 week'
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
  time_bucket_gapfill('1 day', time, now() - INTERVAL '1 week', now()) AS day,
  device_id,
  avg(temperature) AS value,
  locf(
    avg(temperature),
    (SELECT temperature FROM metrics m2 WHERE m2.time < now() - INTERVAL '2 week' AND m.device_id = m2.device_id ORDER BY time DESC LIMIT 1)
  )
FROM metrics m
WHERE time > now () - INTERVAL '1 week'
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

## time_bucket() [](time_bucket)

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
SELECT time_bucket(INTERVAL '2 hours', timetz::TIMESTAMP)
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
## time_bucket_gapfill() :community_function: [](time_bucket_gapfill)

The `time_bucket_gapfill` function works similar to `time_bucket` but also activates gap
filling for the interval between `start` and `finish`. It can only be used with an aggregation
query. Values outside of `start` and `finish` will pass through but no gap filling will be
done outside of the specified range.

Starting with version 1.3.0, `start` and `finish` are optional arguments and will
be inferred from the WHERE clause if not supplied as arguments.

>:TIP: We recommend using a WHERE clause whenever possible (instead of just
`start` and `finish` arguments), as start and finish arguments will not filter
input rows.  Thus without a WHERE clause, this will lead TimescaleDB's planner
to select all data and not perform constraint exclusion to exclude chunks from
further processing, which would be less performant.

The `time_bucket_gapfill` must be a top-level expression in a query or
subquery, as shown in the above examples.  You cannot, for example, do
something like `round(time_bucket_gapfill(...))` or cast the result of the gapfill
call (unless as a subquery where the outer query does the type cast).

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

Note that explicitly provided `start` and `stop` or derived from WHERE clause values 
need to be simple expressions. Such expressions should be evaluated to constants 
at the query planning. For example, simple expressions can contain constants or 
call to `now()`, but cannot reference to columns of a table.

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
WHERE time > now() - INTERVAL '1 week' AND time < now()
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
WHERE time > now() - INTERVAL '1 week' AND time < now()
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
WHERE time > now() - INTERVAL '1 week' AND time < now()
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

## timescaledb_information.data_nodes [](timescaledb_information-data_nodes)

Get information on data nodes. This function is specific to running
TimescaleDB in a multi-node setup.

#### Available Columns

|Name|Description|
|---|---|
| `node_name` | Data node name. |
| `owner` | Oid of the user, who added the data node. |
| `options` | Options used when creating the data node. |

#### Sample Usage

Get metadata related to data nodes.

```sql
SELECT * FROM timescaledb_information.data_nodes;

 node_name    | owner      | options                        
--------------+------------+--------------------------------
 dn1         | postgres   | {host=localhost,port=15431,dbname=test}   
 dn2         | postgres   | {host=localhost,port=15432,dbname=test} 
(2 rows)
```

## timescaledb_information.hypertables [](timescaledb_information-hypertables)

Get metadata information about hypertables.

#### Available Columns [](timescaledb_information-hypertables-available-columns)

|Name|Description|
|---|---|
| `hypertable_schema` | (NAME) Schema name of the hypertable |
| `hypertable_name` | (NAME) Table name of the hypertable |
| `owner` | (NAME) Owner of the hypertable |
| `num_dimensions` | (SMALLINT) Number of dimensions |
| `num_chunks` | (BIGINT) Number of chunks |
| `compression_enabled` | (BOOLEAN) Is compression enabled on the hypertable?|
| `is_distributed` | (BOOLEAN) Is the hypertable distributed?|
| `replication_factor` | (SMALLINT) Replication factor for a distributed hypertable|
| `data_nodes` | (NAME[]) Nodes on which hypertable is distributed|
| `tablespaces` | (NAME[]) Tablespaces attached to the hypertable |

#### Sample Usage [](timescaledb_information-hypertables-examples)

Get information about a hypertable.

```sql
CREATE TABLE dist_table(time timestamptz, device int, temp float);
SELECT create_distributed_hypertable('dist_table', 'time', 'device', replication_factor => 2);

SELECT * FROM timescaledb_information.hypertables
  WHERE hypertable_name = 'dist_table';

-[ RECORD 1 ]-------+-----------
hypertable_schema   | public
hypertable_name     | dist_table
owner               | postgres 
num_dimensions      | 2
num_chunks          | 3
compression_enabled | f
is_distributed      | t
replication_factor  | 2
data_nodes          | {node_1, node_2}
tablespaces         | 

```

## timescaledb_information.dimensions [](timescaledb_information-dimensions)

Get metadata about the dimensions of hypertables, returning one row of metadata 
for each dimension of a hypertable.  For a time-and-space-partitioned 
hypertable, for example, two rows of metadata will be returned for the 
hypertable.

A time-based dimension column has either an integer datatype 
(bigint, integer, smallint) or a time related datatype 
(timestamptz, timestamp, date).
The `time_interval` column is defined for hypertables that use time datatypes.
Alternatively, for hypertables that use integer datatypes,
 the `integer_interval` and `integer_now_func` columns are defined.

For space based dimensions, metadata is returned that specifies their number 
of `num_partitions`. The `time_interval` and `integer_interval` columns are 
not applicable for space based dimensions.
 
#### Available Columns [](timescaledb_information-dimensions-available-columns)

|Name|Description|
|---|---|
| `hypertable_schema` | (NAME) Schema name of the hypertable |
| `hypertable_name` | (NAME) Table name of the hypertable |
| `dimension_number` | (BIGINT) Dimension number of the hypertable, starting from 1 |
| `column_name` | (NAME) Name of the column used to create this dimension |
| `column_type` | (REGTYPE) Type of the column used to create this dimension|
| `dimension_type` | (TEXT) Is this time based or space based dimension?|
| `time_interval` | (INTERVAL) Time interval for primary dimension if the column type is based on Postgres time datatypes |
| `integer_interval` | (BIGINT) Integer interval for primary dimension if the column type is an integer datatype |
| `integer_now_func` | (NAME) integer_now function for primary dimension if the column type is integer based datatype|
| `num_partitions` | (SMALLINT) Number of partitions for the dimension |

#### Sample Usage [](timescaledb_information-dimensions-examples)

Get information about the dimensions of hypertables.

```sql
--Create a time and space partitioned hypertable
CREATE TABLE dist_table(time timestamptz, device int, temp float);
SELECT create_hypertable('dist_table', 'time',  'device', chunk_time_interval=> INTERVAL '7 days', number_partitions=>3);

SELECT * from timescaledb_information.dimensions
  ORDER BY hypertable_name, dimension_number;

-[ RECORD 1 ]-----+-------------------------
hypertable_schema | public
hypertable_name   | dist_table
dimension_number  | 1
column_name       | time
column_type       | timestamp with time zone
dimension_type    | Time
time_interval     | 7 days
integer_interval  | 
integer_now_func  | 
num_partitions    | 
-[ RECORD 2 ]-----+-------------------------
hypertable_schema | public
hypertable_name   | dist_table
dimension_number  | 2
column_name       | device
column_type       | integer
dimension_type    | Space
time_interval     | 
integer_interval  | 
integer_now_func  | 
num_partitions    | 2
```

Get information about dimensions of a hypertable that has 2 time based dimensions
``` sql
CREATE TABLE hyper_2dim (a_col date, b_col timestamp, c_col integer);
SELECT table_name from create_hypertable('hyper_2dim', 'a_col');
SELECT add_dimension('hyper_2dim', 'b_col', chunk_time_interval=> '7 days');

SELECT * FROM timescaledb_information.dimensions WHERE hypertable_name = 'hyper_2dim';

-[ RECORD 1 ]-----+----------------------------
hypertable_schema | public
hypertable_name   | hyper_2dim
dimension_number  | 1
column_name       | a_col
column_type       | date
dimension_type    | Time
time_interval     | 7 days
integer_interval  | 
integer_now_func  | 
num_partitions    | 
-[ RECORD 2 ]-----+----------------------------
hypertable_schema | public
hypertable_name   | hyper_2dim
dimension_number  | 2
column_name       | b_col
column_type       | timestamp without time zone
dimension_type    | Time
time_interval     | 7 days
integer_interval  | 
integer_now_func  | 
num_partitions    | 

```
---

## timescaledb_information.chunks [](timescaledb_information-chunks)

Get metadata about the chunks of hypertables.

This view shows metadata for the chunk's primary time-based dimension.
For information about a hypertable's secondary dimensions, 
the [dimensions view](#timescaledb_information-dimensions) should be used instead.

If the chunk's primary dimension is of a time datatype, `range_start` and
`range_end` are set.  Otherwise, if the primary dimension type is integer based,
`range_start_integer` and `range_end_integer` are set.

#### Available Columns [](timescaledb_information-chunks-available-columns)

|Name|Description|
|---|---|
| `hypertable_schema` | (NAME) Schema name of the hypertable |
| `hypertable_name` | (NAME) Table name of the hypertable |
| `chunk_schema` | (NAME) Schema name of the chunk |
| `chunk_name` | (NAME) Name of the chunk |
| `primary_dimension` | (NAME) Name of the column that is the primary dimension|
| `primary_dimension_type` | (REGTYPE) Type of the column that is the primary dimension|
| `range_start` | (TIMESTAMP WITH TIME ZONE) Start of the range for the chunk's dimension |
| `range_end` | (TIMESTAMP WITH TIME ZONE) End of the range for the chunk's dimension |
| `range_start_integer` | (BIGINT) Start of the range for the chunk's dimension, if the dimension type is integer based |
| `range_end_integer` | (BIGINT) End of the range for the chunk's dimension, if the dimension type is integer based |
| `is_compressed` | (BOOLEAN) Is the data in the chunk compressed? NULL for distributed chunks. Use `chunk_compression_stats()` function to get compression status for distributed chunks.|
| `chunk_tablespace` | (NAME) Tablespace used by the chunk|
| `data_nodes` | (NAME[]) Nodes on which the chunk is replicated. This is applicable only to chunks for distributed hypertables |

#### Sample Usage [](timescaledb_information-chunks-examples)

Get information about the chunks of a hypertable.

```sql
CREATE TABLESPACE tablespace1 location '/usr/local/pgsql/data1';
  
CREATE TABLE hyper_int (a_col integer, b_col integer, c integer);
SELECT table_name from create_hypertable('hyper_int', 'a_col', chunk_time_interval=> 10);
CREATE OR REPLACE FUNCTION integer_now_hyper_int() returns int LANGUAGE SQL STABLE as $$ SELECT coalesce(max(a_col), 0) FROM hyper_int $$;
SELECT set_integer_now_func('hyper_int', 'integer_now_hyper_int');

INSERT INTO hyper_int SELECT generate_series(1,5,1), 10, 50;

SELECT attach_tablespace('tablespace1', 'hyper_int');
INSERT INTO hyper_int VALUES( 25 , 14 , 20), ( 25, 15, 20), (25, 16, 20);

SELECT * FROM timescaledb_information.chunks WHERE hypertable_name = 'hyper_int';

-[ RECORD 1 ]----------+----------------------
hypertable_schema      | public
hypertable_name        | hyper_int
chunk_schema           | _timescaledb_internal
chunk_name             | _hyper_7_10_chunk
primary_dimension      | a_col
primary_dimension_type | integer
range_start            | 
range_end              | 
range_start_integer    | 0
range_end_integer      | 10
is_compressed          | f
chunk_tablespace       | 
data_nodes             | 
-[ RECORD 2 ]----------+----------------------
hypertable_schema      | public
hypertable_name        | hyper_int
chunk_schema           | _timescaledb_internal
chunk_name             | _hyper_7_11_chunk
primary_dimension      | a_col
primary_dimension_type | integer
range_start            | 
range_end              | 
range_start_integer    | 20
range_end_integer      | 30
is_compressed          | f
chunk_tablespace       | tablespace1
data_nodes             | 
```
---

---

## timescaledb_information.continuous_aggregates [](timescaledb_information-continuous_aggregate)

Get metadata and settings information for continuous aggregates.

#### Available Columns

|Name|Description|
|---|---|
|`hypertable_schema` | (NAME) Schema of the hypertable from the continuous aggregate view|
|`hypertable_name` | (NAME) Name of the hypertable from the continuous aggregate view|
|`view_schema` | (NAME) Schema for continuous aggregate view |
|`view_name` | (NAME) User supplied name for continuous aggregate view |
|`view_owner` | (NAME) Owner of the continuous aggregate view|
|`materialized_only` | (BOOLEAN) Return only materialized data when querying the continuous aggregate view. |
|`materialization_hypertable_schema` | (NAME) Schema of the underlying materialization table|
|`materialization_hypertable_name` | (NAME) Name of the underlying materialization table|
|`view_definition` |(TEXT) `SELECT` query for continuous aggregate view|

#### Sample Usage
```sql
SELECT * FROM timescaledb_information.continuous_aggregates;

-[ RECORD 1 ]---------------------+-------------------------------------------------
hypertable_schema                 | public
hypertable_name                   | foo
view_schema                       | public 
view_name                         | contagg_view
view_owner                        | postgres
materialized_only                 | f
materialization_hypertable_schema | _timescaledb_internal
materialization_hypertable_name   | _materialized_hypertable_2
view_definition                   |  SELECT foo.a,                                  +
                                  |     COUNT(foo.b) AS countb                      +
                                  |    FROM foo                                     +
                                  |   GROUP BY (time_bucket('1 day', foo.a)), foo.a;

```
---
## timescaledb_information.compression_settings [](timescaledb_information-compression_settings)

Get information about compression-related settings for hypertables.
Each row of the view provides information about individual orderby
and segmentby columns used by compression.

#### Available Columns [](timescaledb_information-compression_settings-available-columns)

|Name|Description|
|---|---|
| `hypertable_schema` | (NAME) Schema name of the hypertable |
| `hypertable_name` | (NAME) Table name of the hypertable |
| `attname` | (NAME) Name of the column used in the compression settings |
| `segmentby_column_index` | (SMALLINT) Position of attname in the compress_segmentby list |
| `orderby_column_index` | (SMALLINT) Position of attname in the compress_orderby list |
| `orderby_asc` | (BOOLEAN) True if this is used for order by ASC, False for order by DESC |
| `orderby_nullsfirst` | (BOOLEAN) True if nulls are ordered first for this column, False if nulls are ordered last|


#### Sample Usage [](timescaledb_information-compression_settings-examples)

```sql
CREATE TABLE hypertab (a_col integer, b_col integer, c_col integer, d_col integer, e_col integer);
SELECT table_name FROM create_hypertable('hypertab', 'a_col');

ALTER TABLE hypertab SET (timescaledb.compress, timescaledb.compress_segmentby = 'a_col,b_col', 
  timescaledb.compress_orderby = 'c_col desc, d_col asc nulls last');

SELECT * FROM timescaledb_information.compression_settings WHERE hypertable_name = 'hypertab';

 hypertable_schema | hypertable_name | attname | segmentby_column_index | orderby_column_in
dex | orderby_asc | orderby_nullsfirst 
-------------+------------+---------+------------------------+------------------
----+-------------+--------------------
 public      | hypertab   | a_col   |                      1 |
    |             | 
 public      | hypertab   | b_col   |                      2 |
    |             | 
 public      | hypertab   | c_col   |                        |
  1 | f           | t
 public      | hypertab   | d_col   |                        |
  2 | t           | f
(4 rows)
```
---

## timescaledb_information.jobs [](timescaledb_information-jobs)
Shows information about all jobs registered with the automation framework. 

#### Available Columns [](timescaledb_information-jobs-available-columns)

|Name|Description|
|---|---|
|`job_id` | (INTEGER) The id of the background job |
|`application_name` | (NAME) Name of the policy or user defined action |
|`schedule_interval` | (INTERVAL)  The interval at which the job runs |
|`max_runtime` | (INTERVAL) The maximum amount of time the job will be allowed to run by the background worker scheduler before it is stopped |
|`max_retries` | (INTEGER)  The number of times the job will be retried should it fail |
|`retry_period` | (INTERVAL) The amount of time the scheduler will wait between retries of the job on failure |
|`proc_schema` | (NAME) Schema name of the function or procedure executed by the job |
|`proc_name` | (NAME) Name of the function or procedure executed by the job |
|`owner` | (NAME) Owner of the job |
|`scheduled` | (BOOLEAN) | Is the job scheduled to run automatically? |
|`config` | (JSONB) | Configuration passed to the function specified by `proc_name` at execution time |
|`next_start` | (TIMESTAMP WITH TIME ZONE) | Next start time for the job, if it is scheduled to run automatically |
|`hypertable_schema` | (NAME) Schema name of the hypertable. NULL, if this is a user defined action.|
|`hypertable_name` | (NAME) Table name of the hypertable. NULL, if this is a user defined action. |

#### Sample Usage [](timescaledb_information-jobs-examples)

Get information about jobs.
```sql

SELECT * FROM timescaledb_information.jobs;
--This shows a job associated with the refresh policy for continuous aggregates
job_id            | 1001
application_name  | Refresh Continuous Aggregate Policy [1001]
schedule_interval | 01:00:00
max_runtime       | 00:00:00
max_retries       | -1
retry_period      | 01:00:00
proc_schema       | _timescaledb_internal
proc_name         | policy_refresh_continuous_aggregate
owner             | postgres
scheduled         | t
config            | {"start_offset": "20 days", "end_offset": "10 
days", "mat_hypertable_id": 2}
next_start        | 2020-10-02 12:38:07.014042-04
hypertable_schema | _timescaledb_internal
hypertable_name   | _materialized_hypertable_2

```
Find all jobs related to compression policies.

```sql
SELECT * FROM timescaledb_information.jobs where application_name like 'Compression%';

-[ RECORD 1 ]-----+--------------------------------------------------
job_id            | 1002
application_name  | Compression Policy [1002]
schedule_interval | 15 days 12:00:00
max_runtime       | 00:00:00
max_retries       | -1
retry_period      | 01:00:00
proc_schema       | _timescaledb_internal
proc_name         | policy_compression
owner             | postgres
scheduled         | t
config            | {"hypertable_id": 3, "compress_after": "60 days"}
next_start        | 2020-10-18 01:31:40.493764-04
hypertable_schema | public
hypertable_name   | conditions

```
Find jobs that are executed by user defined actions.

```sql
SELECT * FROM timescaledb_information.jobs where application_name like 'User-Define%';

-[ RECORD 1 ]-----+------------------------------
job_id            | 1003
application_name  | User-Defined Action [1003]
schedule_interval | 01:00:00
max_runtime       | 00:00:00
max_retries       | -1
retry_period      | 00:05:00
proc_schema       | public
proc_name         | custom_aggregation_func
owner             | postgres
scheduled         | t
config            | {"type": "function"}
next_start        | 2020-10-02 14:45:33.339885-04
hypertable_schema | 
hypertable_name   | 
-[ RECORD 2 ]-----+------------------------------
job_id            | 1004
application_name  | User-Defined Action [1004]
schedule_interval | 01:00:00
max_runtime       | 00:00:00
max_retries       | -1
retry_period      | 00:05:00
proc_schema       | public
proc_name         | custom_retention_func
owner             | postgres
scheduled         | t
config            | {"type": "function"}
next_start        | 2020-10-02 14:45:33.353733-04
hypertable_schema | 
hypertable_name   | 
```
---
## timescaledb_information.job_stats [](timescaledb_information-job_stats)

Shows information and statistics about jobs run by the automation framework.
This includes jobs set up for user defined actions and jobs run by policies 
created to manage data retention, continuous aggregates, compression, and
other automation policies.  (See [policies](#automation-policies)). 
The statistics include information useful for administering jobs and determining
whether they ought be rescheduled, such as: when and whether the background job
used to implement the policy succeeded and when it is scheduled to run next.

#### Available Columns [](timescaledb_information-job_stats-available-columns)

|Name|Description|
|---|---|
|`hypertable_schema` | (NAME) Schema name of the hypertable |
|`hypertable_name` | (NAME) Table name of the hypertable |
|`job_id` | (INTEGER) The id of the background job created to implement the policy |
|`last_run_started_at`| (TIMESTAMP WITH TIME ZONE) Start time of the last job|
|`last_successful_finish`| (TIMESTAMP WITH TIME ZONE) Time when the job completed successfully|
|`last_run_status` | (TEXT) Whether the last run succeeded or failed |
|`job_status`| (TEXT) Status of the job. Valid values are ‘Running’, ‘Scheduled’ and 'Paused'|
|`last_run_duration`| (INTERVAL) Duration of last run of the job|
|`next_scheduled_run` | (TIMESTAMP WITH TIME ZONE) Start time of the next run |
|`total_runs` | (BIGINT) The total number of runs of this job|
|`total_successes` | (BIGINT) The total number of times this job succeeded |
|`total_failures` | (BIGINT) The total number of times this job failed |

#### Sample Usage [](timescaledb_information-job_stats-examples)

Get job success/failure information for a specific hypertable.

```sql
SELECT job_id, total_runs, total_failures, total_successes 
  FROM timescaledb_information.job_stats
  WHERE hypertable_name = 'test_table';

 job_id | total_runs | total_failures | total_successes 
--------+------------+----------------+-----------------
   1001 |          1 |              0 |               1
   1004 |          1 |              0 |               1
(2 rows)

```

Get information about continuous aggregate policy related statistics
``` sql
SELECT  js.* FROM
  timescaledb_information.job_stats js, timescaledb_information.continuous_aggregates cagg
  WHERE cagg.view_name = 'max_mat_view_timestamp' 
  and cagg.materialization_hypertable_name = js.hypertable_name;

-[ RECORD 1 ]----------+------------------------------
hypertable_schema      | _timescaledb_internal
hypertable_name        | _materialized_hypertable_2
job_id                 | 1001
last_run_started_at    | 2020-10-02 09:38:06.871953-04
last_successful_finish | 2020-10-02 09:38:06.932675-04
last_run_status        | Success
job_status             | Scheduled
last_run_duration      | 00:00:00.060722
next_scheduled_run     | 2020-10-02 10:38:06.932675-04
total_runs             | 1
total_successes        | 1
total_failures         | 0

```
---

## get_telemetry_report() [](get_telemetry_report)

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

## approximate_row_count() [](approximate_row_count)

Get approximate row count for hypertable, distributed hypertable, or regular PostgreSQL table based on catalog estimates.
This function support tables with nested inheritance and declarative partitioning.

The accuracy of approximate_row_count depends on the database having up-to-date statistics about the table or hypertable, which are updated by VACUUM, ANALYZE, and a few DDL commands. If you have auto-vacuum configured on your table or hypertable, or changes to the table are relatively infrequent, you might not need to explicitly ANALYZE your table as shown below. Otherwise, if your table statistics are too out-of-date, running this command will update your statistics and yield more accurate approximation results.

#### Required Arguments [](approximate_row_count-required-arguments)

|Name|Description|
|---|---|
| `relation` | Hypertable or regular PostgreSQL table to get row count for. |

#### Sample Usage [](approximate_row_count-examples)

Get the approximate row count for a single hypertable.
```sql
ANALYZE conditions;

SELECT * FROM approximate_row_count('conditions');
```

The expected output:
```
approximate_row_count
----------------------
               240000
```

---

## hypertable_compression_stats() :community_function: [](hypertable_compression_stats)

Get statistics related to hypertable compression.
All sizes are in bytes.

#### Required Arguments [](hypertable_compression_stats-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Hypertable to show stats for. |

#### Returns [](hypertable_compression_stats-returns)
|Column|Description|
|---|---|
|`total_chunks` | (BIGINT) the number of chunks used by the hypertable |
|`number_compressed_chunks` | (INTEGER) the number of chunks used by the hypertable that are currently compressed |
|`before_compression_table_bytes` | (BIGINT) Size of the heap before compression (NULL if currently uncompressed) |
|`before_compression_index_bytes` | (BIGINT) Size of all the indexes before compression (NULL if currently uncompressed) |
|`before_compression_toast_bytes` | (BIGINT) Size the TOAST table before compression (NULL if currently uncompressed) |
|`before_compression_total_bytes` | (BIGINT) Size of the entire table (table+indexes+toast) before compression (NULL if currently uncompressed) |
|`after_compression_table_bytes` | (BIGINT) Size of the heap after compression (NULL if currently uncompressed) |
|`after_compression_index_bytes` | (BIGINT) Size of all the indexes after compression (NULL if currently uncompressed) |
|`after_compression_toast_bytes` | (BIGINT) Size the TOAST table after compression (NULL if currently uncompressed) |
|`after_compression_total_bytes` | (BIGINT) Size of the entire table (table+indexes+toast) after compression (NULL if currently uncompressed) |
|`node_name` | (NAME) nodes on which the hypertable is located, applicable only to distributed hypertables |

#### Sample Usage [](hypertable_compression_stats-examples)
```sql
SELECT * FROM hypertable_compression_stats('conditions');

-[ RECORD 1 ]------------------+------
total_chunks                   | 4
number_compressed_chunks       | 1
before_compression_table_bytes | 8192
before_compression_index_bytes | 32768
before_compression_toast_bytes | 0
before_compression_total_bytes | 40960
after_compression_table_bytes  | 8192
after_compression_index_bytes  | 32768
after_compression_toast_bytes  | 8192
after_compression_total_bytes  | 49152
node_name                      |
```

Use `pg_size_pretty` get the output in a more human friendly format.
```sql
SELECT pg_size_pretty(after_compression_total_bytes) as total
  FROM hypertable_compression_stats('conditions');

-[ RECORD 1 ]--+------
total | 48 kB

```
---
## chunk_compression_stats() :community_function: [](chunk_compression_stats)

Get chunk specific statistics related to hypertable compression.
All sizes are in bytes.

#### Required Arguments [](chunk_compression_stats-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Name of the hypertable |

#### Returns [](chunk_compression_stats-returns)
|Column|Description|
|---|---|
|`chunk_schema` | (NAME) Schema name of the chunk |
|`chunk_name` | (NAME) Name of the chunk |
|`number_compressed_chunks` | (INTEGER) the number of chunks used by the hypertable that are currently compressed |
|`before_compression_table_bytes` | (BIGINT) Size of the heap before compression (NULL if currently uncompressed) |
|`before_compression_index_bytes` | (BIGINT) Size of all the indexes before compression (NULL if currently uncompressed) |
|`before_compression_toast_bytes` | (BIGINT) Size the TOAST table before compression (NULL if currently uncompressed) |
|`before_compression_total_bytes` | (BIGINT) Size of the entire chunk table (table+indexes+toast) before compression (NULL if currently uncompressed) |
|`after_compression_table_bytes` | (BIGINT) Size of the heap after compression (NULL if currently uncompressed) |
|`after_compression_index_bytes` | (BIGINT) Size of all the indexes after compression (NULL if currently uncompressed) |
|`after_compression_toast_bytes` | (BIGINT) Size the TOAST table after compression (NULL if currently uncompressed) |
|`after_compression_total_bytes` | (BIGINT) Size of the entire chunk table (table+indexes+toast) after compression (NULL if currently uncompressed) |
|`node_name` | (NAME) nodes on which the chunk is located, applicable only to distributed hypertables |

#### Sample Usage [](chunk_compression_stats-examples)
```sql
SELECT * FROM chunk_compression_stats('conditions')
  ORDER BY chunk_name LIMIT 2;

-[ RECORD 1 ]------------------+----------------------
chunk_schema                   | _timescaledb_internal
chunk_name                     | _hyper_1_1_chunk
compression_status             | Uncompressed
before_compression_table_bytes |
before_compression_index_bytes |
before_compression_toast_bytes |
before_compression_total_bytes |
after_compression_table_bytes  |
after_compression_index_bytes  |
after_compression_toast_bytes  |
after_compression_total_bytes  |
node_name                      |
-[ RECORD 2 ]------------------+----------------------
chunk_schema                   | _timescaledb_internal
chunk_name                     | _hyper_1_2_chunk
compression_status             | Compressed
before_compression_table_bytes | 8192
before_compression_index_bytes | 32768
before_compression_toast_bytes | 0
before_compression_total_bytes | 40960
after_compression_table_bytes  | 8192
after_compression_index_bytes  | 32768
after_compression_toast_bytes  | 8192
after_compression_total_bytes  | 49152
node_name                      |
```

Use `pg_size_pretty` get the output in a more human friendly format.
```sql
SELECT pg_size_pretty(after_compression_total_bytes) AS total
  FROM chunk_compression_stats('conditions')
  WHERE compression_status = 'Compressed';

-[ RECORD 1 ]--+------
total | 48 kB

```
---

## hypertable_detailed_size()  [](hypertable_detailed_size)

Get size of hypertable like `pg_relation_size(hypertable)`, returning 
size information for the table itself, any indexes on the table, any 
toast tables, and the total size of all. All sizes are reported in bytes.
If this is a distributed hypertable, the function returns size
information as a separate row per node. 

#### Required Arguments [](hypertable_detailed_size-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Hypertable to show detailed size of. |

#### Returns [](hypertable_detailed_size-returns)
|Column|Description|
|---|---|
|table_bytes|(BIGINT) Disk space used by main_table (like pg_relation_size(main_table))|
|index_bytes|(BIGINT) Disk space used by indexes|
|toast_bytes|(BIGINT) Disk space of toast tables|
|total_bytes|(BIGINT) Total disk space used by the specified table, including all indexes and TOAST data|
|node_name| (NAME) Node for which size is reported, applicable only to distributed hypertables|

#### Sample Usage [](hypertable_detailed_size-examples)
Get size information for a hypertable.
```sql
-- disttable is a distributed hypertable --
SELECT * FROM hypertable_detailed_size('disttable') ORDER BY node_name;

 table_bytes | index_bytes | toast_bytes | total_bytes |  node_name
-------------+-------------+-------------+-------------+-------------
       16384 |       32768 |           0 |       49152 | data_node_1
        8192 |       16384 |           0 |       24576 | data_node_2

```
---

## chunks_detailed_size()   [](chunks_detailed_size)

Get size information about the chunks belonging to a hypertable, returning 
size information for each chunk table itself, any indexes on the chunk, any 
toast tables, and the total size associated with the chunk. All sizes are 
reported in bytes.

If this is a distributed hypertable, the function returns size
information as a separate row per node.

Additional metadata associated with a chunk can be accessed 
via the `timescaledb_information.chunks` view.

#### Required Arguments [](chunks_detailed_size-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Name of the hypertable |

#### Returns [](chunks_detailed_size-returns)
|Column|Description|
|---|---|
|chunk_schema| (NAME) Schema name of the chunk |
|chunk_name| (NAME) Name of the chunk|
|table_bytes|(BIGINT) Disk space used by the chunk table|
|index_bytes|(BIGINT) Disk space used by indexes|
|toast_bytes|(BIGINT) Disk space of toast tables|
|total_bytes|(BIGINT) Total disk space used by the chunk, including all indexes and TOAST data|
|node_name| (NAME) Node for which size is reported, applicable only to distributed hypertables|

#### Sample Usage [](chunks_detailed_size-examples)
```sql
SELECT * FROM chunks_detailed_size('dist_table')
  ORDER BY chunk_name, node_name;

     chunk_schema      |      chunk_name       | table_bytes | index_bytes | toast_bytes | total_bytes |       node_name
-----------------------+-----------------------+-------------+-------------+-------------+-------------+-----------------------
 _timescaledb_internal | _dist_hyper_1_1_chunk |        8192 |       32768 |           0 |       40960 | db_node1
 _timescaledb_internal | _dist_hyper_1_2_chunk |        8192 |       32768 |           0 |       40960 | db_node2
 _timescaledb_internal | _dist_hyper_1_3_chunk |        8192 |       32768 |           0 |       40960 | db_node3
```
---

## hypertable_size()  [](hypertable_size)

Get total size of hypertable i.e. the sum of the size for the table itself, 
any indexes on the table, and any toast tables. The size is reported in bytes. 
This is equivalent to computing the sum of `total_bytes` column from the 
output of `hypertable_detailed_size` function.

#### Required Arguments [](hypertable_size-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Hypertable to show size of. |

#### Returns [](hypertable_size-returns)
(BIGINT) Total disk space used by the specified table, including all indexes and TOAST data|

#### Sample Usage [](hypertable_size-examples)
Get size information for a hypertable.
```sql
SELECT hypertable_size('devices') ;

 hypertable_size
-----------------
           73728
```

Get size information for all hypertables.
```sql
SELECT hypertable_name, hypertable_size(format('%I.%I', hypertable_schema, hypertable_name)::regclass)
  FROM timescaledb_information.hypertables;
```

---

## hypertable_index_size()  [](hypertable_index_size)

Get size of an index on a hypertable. The size is reported in bytes.

#### Required Arguments [](hypertable_index_size-required-arguments)

|Name|Description|
|---|---|
| `index_name` | (REGCLASS) Name of the index on a  hypertable |

#### Returns [](hypertable_index_size-returns)
(BIGINT) Returns disk space used by the index. 

#### Sample Usage [](hypertable_index_size-examples)

Get size of a specific index on a hypertable.

```sql
\d conditions_table
                     Table "public.test_table"
 Column |           Type           | Collation | Nullable | Default 
--------+--------------------------+-----------+----------+---------
 time   | timestamp with time zone |           | not null | 
 device | integer                  |           |          | 
 volume | integer                  |           |          | 
Indexes:
    "second_index" btree ("time")
    "test_table_time_idx" btree ("time" DESC)
    "third_index" btree ("time")

SELECT hypertable_index_size('second_index');

 hypertable_index_size 
-----------------------
                163840

SELECT pg_size_pretty(hypertable_index_size('second_index'));

 pg_size_pretty 
----------------
 160 kB

```
---

## show_tablespaces() [](show_tablespaces)

Show the tablespaces attached to a hypertable.

#### Required Arguments [](show_tablespaces-required-arguments)

|Name|Description|
|---|---|
| `hypertable` | (REGCLASS) Hypertable to show attached tablespaces for.|


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
function is run following the restore. See [backup/restore docs][backup-restore] for more information.

>:WARNING: Using this function when doing an upgrade could cause
>issues in TimescaleDB versions before 1.7.1.

>:WARNING: After running `SELECT timescaledb_pre_restore()` you must run the
  [`timescaledb_post_restore`](#timescaledb_post_restore) function before using the database normally.

#### Sample Usage  [](timescaledb_pre_restore-examples)

```sql
SELECT timescaledb_pre_restore();
```

---

## timescaledb_post_restore() [](timescaledb_post_restore)
Perform the proper operations after restoring the database has completed.
Specifically this resets the `timescaledb.restoring` GUC and restarts any
background workers. See [backup/restore docs][backup-restore] for more information.

#### Sample Usage  [](timescaledb_post_restore-examples)

```sql
SELECT timescaledb_post_restore();
```
---

## timescaledb.license [](timescaledb_license)

View or set currently used TimescaleDB license.

It is possible to limit access to features by license by changing the `timescaledb.license`
settings parameter in the server configuration file or on the server command line. For instance,
by setting `timescaledb.license` to `apache`, it is only possible to use TimescaleDB features
that are implemented under the Apache 2 license. The default value is `timescale`, however, which
allows access to all features.

#### Sample Usage [](timescaledb_license-key-examples)

View current license.

```sql
SHOW timescaledb.license;
 timescaledb.license
---------------------
 timescale
(1 row)

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
[best practices]: #create_hypertable-best-practices
[using-actions]: /using-timescaledb/actions
[using-continuous-aggs]: /using-timescaledb/continuous-aggregates
[using-compression]: /using-timescaledb/compression
[using-data-tiering]: /using-timescaledb/data-tiering
[blog-compression]: https://blog.timescale.com/blog/building-columnar-compression-in-a-row-oriented-database/
[downloaded separately]: https://raw.githubusercontent.com/timescale/timescaledb/master/scripts/dump_meta_data.sql
[postgres-call]: https://www.postgresql.org/docs/current/sql-call.html
[postgres-tablespaces]: https://www.postgresql.org/docs/current/manage-ag-tablespaces.html
[postgres-createindex]: https://www.postgresql.org/docs/current/sql-createindex.html
[postgres-createtablespace]: https://www.postgresql.org/docs/current/sql-createtablespace.html
[postgres-cluster]: https://www.postgresql.org/docs/current/sql-cluster.html
[postgres-altertable]: https://www.postgresql.org/docs/current/sql-altertable.html
[postgres-alterview]: https://www.postgresql.org/docs/current/sql-altermaterializedview.html
[postgres-lock]: https://www.postgresql.org/docs/current/sql-lock.html
[migrate-from-postgresql]: /getting-started/migrating-data
[memory-units]: https://www.postgresql.org/docs/current/static/config-setting.html#CONFIG-SETTING-NAMES-VALUES
[multinode]: /getting-started/setup-multi-node-basic
[distributed-hypertable-partitioning-best-practices]: /using-timescaledb/distributed-hypertables#partitioning-best-practices
[telemetry]: /using-timescaledb/telemetry
[caveats]: /using-timescaledb/continuous-aggregates
[backup-restore]: /using-timescaledb/backup#pg_dump-pg_restore
[real-time-aggregates]: /using-timescaledb/continuous-aggregates#real-time-aggregates
[hash partitions]: /using-timescaledb/hypertables#best-practices-space-partitions
[compression-schema-changes]: /using-timescaledb/compression#compression-schema-changes
