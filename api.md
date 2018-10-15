# TimescaleDB API Reference

>:TOPLIST:
> ### Command List (A-Z)
> - [add_dimension](#add_dimension)
> - [attach_tablespace](#attach_tablespace)
> - [chunk_relation_size](#chunk_relation_size)
> - [chunk_relation_size_pretty](#chunk_relation_size_pretty)
> - [create_hypertable](#create_hypertable)
> - [detach_tablespace](#detach_tablespace)
> - [detach_tablespaces](#detach_tablespaces)
> - [drop_chunks](#drop_chunks)
> - [first](#first)
> - [get_telemetry_report](#get_telemetry_report)
> - [histogram](#histogram)
> - [hypertable_approximate_row_count](#hypertable_approximate_row_count)
> - [hypertable_relation_size](#hypertable_relation_size)
> - [hypertable_relation_size_pretty](#hypertable_relation_size_pretty)
> - [indexes_relation_size](#indexes_relation_size)
> - [indexes_relation_size_pretty](#indexes_relation_size_pretty)
> - [last](#last)
> - [set_adaptive_chunking](#set_adaptive_chunking)
> - [set_chunk_time_interval](#set_chunk_time_interval)
> - [set_number_partitions](#set_number_partitions)
> - [show_tablespaces](#show_tablespaces)
> - [time_bucket](#time_bucket)

## Hypertable management [](hypertable-management)

## add_dimension() [](add_dimension)

Add an additional partitioning dimension to a TimescaleDB hypertable.
The column selected as the dimension can either use interval
partitioning (e.g., for a second time partition) or hash partitioning.

>:WARNING: Before using this command, please see the hypertable [best practices][] discussion
and talk with us on [Slack](https://slack-login.timescale.com) about
your use case. Users will *rarely* want or need to use this command.

<!-- -->
>:WARNING: The `add_dimension` command can only be executed after a table has been
converted to a hypertable (via `create_hypertable`), but must similarly
be run only on an empty hypertable.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to add the dimension to.|
| `column_name` | Name of the column to partition by.|

#### Optional Arguments

|Name|Description|
|---|---|
| `number_partitions` | Number of hash partitions to use on `column_name`. Must be > 0.|
| `chunk_time_interval` | Interval that each chunk covers. Must be > 0.|
| `partitioning_func` | The function to use for calculating a value's partition (see `create_hypertable` [instructions](#create_hypertable)).|
| `if_not_exists` | Set to true to avoid throwing an error if a dimension for the column already exists. A notice is issued instead. Defaults to false. |

#### Returns

|Column|Description|
|---|---|
| `dimension_id` | ID of the dimension in TimescaleDB's internal catalog. |
| `schema_name` | Schema name of the hypertable.|
| `table_name` | Table name of the hypertable. |
| `column_name` | Column name of the column to partition by. |

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

#### Required Arguments

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

#### Optional Arguments

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

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of table to convert to hypertable |
| `time_column_name` | Name of the column containing time values as well as the primary column to partition by. |

#### Optional Arguments

|Name|Description|
|---|---|
| `partitioning_column` | Name of an additional column to partition by. If provided, the `number_partitions` argument must also be provided. |
| `number_partitions` | Number of hash partitions to use for `partitioning_column`. Must be > 0. |
| `chunk_time_interval` | Interval in event time that each chunk covers. Must be > 0. As of Timescale v0.11.0, default is 7 days, unless [adaptive chunking][adaptive-chunking] is enabled, in which case the interval starts at 1 day. For previous versions, default is 1 month. |
| `create_default_indexes` | Boolean whether to create default indexes on time/partitioning columns. Default is TRUE. |
| `if_not_exists` | Boolean whether to print warning if table already converted to hypertable or raise exception. Default is FALSE. |
| `partitioning_func` | The function to use for calculating a value's partition.|
| `associated_schema_name` | Name of the schema for internal hypertable tables. Default is "_timescaledb_internal". |
| `associated_table_prefix` | Prefix for internal hypertable chunk names. Default is "_hyper". |
| `migrate_data` | Set to `true` to migrate any existing `main_table` data to chunks in the new hypertable. A non-empty table will generate an error without this option. Note that, for large tables, the migration might take a long time. Defaults to false. |
| `chunk_target_size` | The target size of a chunk (including indexes) in `kB`, `MB`, `GB`, or `TB`. Setting this to `estimate` or a non-zero chunk size, e.g., `2GB` will enable [adaptive chunking][adaptive-chunking]. The `estimate` setting will estimate a target chunk size based on system information. Adaptive chunking is disabled by default. |
| `chunk_sizing_func` | Allows setting a custom chunk sizing function for [adaptive chunking][adaptive-chunking]. The built-in chunk sizing function will be used by default. Note that `chunk_target_size` needs to be set to use this function.  |

#### Returns

|Column|Description|
|---|---|
| `hypertable_id` | ID of the hypertable in TimescaleDB's internal catalog. |
| `schema_name` | Schema name of the table converted to hypertable. |
| `table_name` | Table name of the table converted to hypertable. |

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
#### Units

The 'time' column supports the following data types:

| Types |
|---|
| Timestamp (TIMESTAMP, TIMESTAMPTZ) |
| DATE |
| Integer (SMALLINT, INT, BIGINT) |

>:TIP: The type flexibility of the 'time' column allows the use of non-time-based values as the primary chunk partitioning column, as long as those values can increment.

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

The units of `chunk_target_size` follow the format of a ["Numeric with
Unit"][memory-units] memory settings parameter in PostgreSQL. Note
that this size includes indexes when using the default adaptive
chunking algorithm. Be careful with specifying a plain number
(`100000000`) rather than one with units (`100MB`), as the base unit
is the size of a disk block (typically 8k, in which case 100,000,000 *
8k ~ 800GB).

<!-- -->
>:TIP: Setting a reasonable initial `chunk_time_interval` is important
even with adaptive chunking enabled, because it allows the adaptive
algorithm to more quickly reach the target chunk size. It is better to
set a too small `chunk_time_interval` as opposed to a too large
one. If no `chunk_time_interval` is set with adaptive chunking, the
default initial interval is 1 day.

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

[Adaptive chunking][adaptive-chunking] can be enabled by setting the
`chunk_target_size` to a non-zero human-readable value, e.g.,
`2GB`. The `chunk_target_size` should ideally not exceed the setting
of `shared_buffers`. It is also possible to set `chunk_target_size` to
`estimate`, in which case the system determines a suitable chunk
target size based on the PostgreSQL `shared_buffers` setting.
Optionally, `chunk_sizing_func` can also be set to use a custom
algorithm for adapting the chunk size.

<!-- -->
>:TIP: The `add_dimension` function can be used following hypertable
 creation to add one or more additional partitioning dimensions (and
 as an alternative to specifying the optional argument
 in `create_hypertable`).  See [best practices][] before using any
 spatial partitioning.

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

Convert table `conditions` to hypertable with adaptive chunking
enabled and a chunk target size of `2GB`:
```sql
SELECT create_hypertable('conditions', 'time', chunk_target_size => '2GB');
```

#### Best Practices [](create_hypertable-best-practices)

Users of TimescaleDB often have two common questions:

1. How large should I configure my intervals for time partitioning?
1. Should I use space partitioning, and how many space partitions should I use?

**Time intervals**: The current release of TimescaleDB enables both
the manual and automated adaption of its time intervals. With
manually-set intervals, users should specify a `chunk_time_interval`
when creating their hypertable (the default value is 1 week). The
interval used for new chunks can be changed by calling
[`set_chunk_time_interval()`](#set_chunk_time_interval). With
automatically adapted intervals (which are not enabled by default),
the user should specify a `chunk_target_size` and the chunk interval
will be adapted for future chunks with the specified
`chunk_time_interval` as a starting point, or 1 day if not
specified. The settings for adaptive chunking can be changed by
calling [`set_adaptive_chunking()`](#set_adaptive_chunking).

The following instructions apply if users are choosing to configure
time intervals manually.

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

Note that query parallelization in PostgreSQL 9.6 (and 10) does not
support querying *different* hypertable chunks in parallel;
query parallelization only works on a single physical table (and thus
a single chunk). We might add our own support for this, but it is not
currently supported.

Thus, users looking for parallel I/O have two options:

1. Use a RAID setup across multiple physical disks, and expose a
single logical disk to the hypertable (i.e., via a single tablespace).

1. For each physical disk, add a separate tablespace to the
database.  TimescaleDB allows you to actually add multiple tablespaces
to a *single* hypertable (although under the covers, each underlying
chunk will be mapped by TimescaleDB to a single tablespace / physical
disk).

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

#### Required Arguments

|Name|Description|
|---|---|
| `tablespace` | Name of the tablespace to detach.|

When giving only the tablespace name as argument, the given tablespace
will be detached from all hypertables that the current role has the
appropriate permissions for. Therefore, without proper permissions,
the tablespace may still receive new chunks after this command
is issued.


#### Optional Arguments

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

## detach_tablespaces() [](detach_tablespaces)

Detach all tablespaces from a hypertable. After issuing this command
on a hypertable, it will no longer have any tablespaces attached to
it. New chunks will instead be placed in the database's default
tablespace.

#### Required Arguments

|Name|Description|
|---|---|
| `hypertable` | Identifier of hypertable to detach a the tablespace from.|

#### Sample Usage [](detach_tablespaces-examples)

Detach all tablespaces from the hypertable `conditions`:

```sql
SELECT detach_tablespaces('conditions');
```

---

## drop_chunks() [](drop_chunks)

Removes data chunks that are older than a given time interval across all
hypertables or a specific one. Chunks are removed only if _all_ of their data is
beyond the cut-off point, so the remaining data may contain timestamps that
are before the cut-off point, but only one chunk's worth.

#### Required Arguments

|Name|Description|
|---|---|
| `older_than` | Timestamp of cut-off point for data to be dropped, i.e., anything older than this should be removed.|

#### Optional Arguments

|Name|Description|
|---|---|
| `table_name` | Hypertable name from which to drop chunks. If not supplied, all hypertables are affected.
| `schema_name` | Schema name of the hypertable from which to drop chunks. Defaults to `public`.
| `cascade` | Boolean on whether to `CASCADE` the drop on chunks, therefore removing dependent objects on chunks to be removed. Defaults to `FALSE`.

The `older_than` parameter can be specified in two ways:

- **interval type**: The cut-off point is computed as `now() -
    older_than`.  An error will be returned if an INTERVAL is supplied
    and the time column is not one of a TIMESTAMP, TIMESTAMPTZ, or
    DATE.

- **timestamp, date, or integer type**: The cut-off point is
    explicitly given as a TIMESTAMP / TIMESTAMPTZ / DATE or as a
    SMALLINT / INT / BIGINT. The choice of timestamp or integer should
    generally follow the type of the hypertable's time column.

#### Sample Usage

Drop all chunks older than 3 months:
```sql
SELECT drop_chunks(interval '3 months');
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

---

## set_chunk_time_interval() [](set_chunk_time_interval)
Sets the chunk_time_interval on a hypertable. The new interval is used
when new chunks are created but the time intervals on existing chunks are
not affected.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to update interval for.|
| `chunk_time_interval` | Interval in event time that each new chunk covers. Must be > 0.|

#### Optional Arguments
| Name | Description |
|---|---|
| `dimension_name` | The name of the time dimension to set the number of partitions for.  Only used when hypertable has multiple time dimensions. |

The valid types for the `chunk_time_interval` depend on the type of
hypertable time column:

- **TIMESTAMP, TIMESTAMPTZ, DATE**: The specified
    `chunk_time_interval` should be given either as an INTERVAL type
    (`interval '1 day'`) or as an
    integer or bigint value (representing some number of microseconds).

- **INTEGER**: The specified `chunk_time_interval` should be an
    integer (smallint, int, bigint) value and represent the underlying
    semantics of the hypertable's time column, e.g., given in
    milliseconds if the time column is expressed in milliseconds
    (see `create_hypertable` [instructions](#create_hypertable)).

#### Sample Usage

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

## set_adaptive_chunking() [](set_adaptive_chunking)
Changes the settings for [adaptive chunking][adaptive-chunking]. The
function returns the configured chunk sizing function and the target
chunk size in bytes. This change will impact how and when new chunks
are created; it does not modify the intervals of existing chunks.

#### Required Arguments

|Name|Description|
|---|---|
| `hypertable` | Identifier of hypertable to update the settings for.|
| `chunk_target_size` | The target size of a chunk (including indexes) in `kB`, `MB`, `GB`, or `TB`. Setting this to `estimate` or a non-zero chunk size, e.g., `2GB` will enable [adaptive chunking][adaptive-chunking]. The `estimate` setting will estimate a target chunk size based on system information. Adaptive chunking is disabled by default. |

#### Optional Arguments
| Name | Description |
|---|---|
| `chunk_sizing_func` | Allows setting a custom chunk sizing function for [adaptive chunking][adaptive-chunking]. The built-in chunk sizing function will be used by default. Note that `chunk_target_size` needs to be set to use this function. |


#### Sample Usage

Enable adaptive chunking on hypertable `conditions` and estimate the
target chunk size based on system information:

```sql
SELECT * FROM set_adaptive_chunking('conditions', 'estimate');
               chunk_sizing_func                | chunk_target_size
------------------------------------------------+-------------------
 _timescaledb_internal.calculate_chunk_interval |         536870912
```

Set the target chunk size to `1GB` on the `conditions` hypertable, using
a custom chunk sizing function (enabling adaptive chunking if
previously disabled):

```sql
SELECT * FROM set_adaptive_chunking('conditions', '1GB', 'custom_calculate_chunk_interval');
    chunk_sizing_func            | chunk_target_size
---------------------------------+-------------------
 custom_calculate_chunk_interval |        1073741824

```

Disable adaptive chunking on the `conditions` hypertable, staying with the
current chunk time interval.

```sql
SELECT * FROM set_adaptive_chunking('conditions', 'off');
               chunk_sizing_func                | chunk_target_size
------------------------------------------------+-------------------
 _timescaledb_internal.calculate_chunk_interval |                 0
```

---

## set_number_partitions() [](set_number_partitions)
Sets the number of partitions (slices) of a space dimension on a
hypertable. The new partitioning only affects new chunks.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to update the number of partitions for.|
| `number_partitions` | The new number of partitions for the dimension. Must be greater than 0 and less than 32,768.|

#### Optional Arguments

|Name|Description|
|---|---|
| `dimension_name` | The name of the space dimension to set the number of partitions for.|

The `dimension_name` needs to be explicitly specified only if the
hypertable has more than one space dimension. An error will be thrown
otherwise.

#### Sample Usage

For a table with a single space dimension:
```sql
SELECT set_number_partitions('conditions', 2);
```

For a table with more than one space dimension:
```sql
SELECT set_number_partitions('conditions', 2, 'device_id');
```

---

## Analytics [](analytics)

## first() [](first)

The `first` aggregate allows you to get the value of one column
as ordered by another. For example, `first(temperature, time)` will return the
earliest temperature value based on time within an aggregate group.

#### Required Arguments

|Name|Description|
|---|---|
| `value` | The value to return (anyelement) |
| `time` | The timestamp to use for comparison (TIMESTAMP/TIMESTAMPTZ or integer type)  |

#### Examples

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

#### Required Arguments

|Name|Description|
|---|---|
| `value` | A set of values to partition into a histogram |
| `min` | The histogram’s lower bound used in bucketing (inclusive) |
| `max` | The histogram’s upper bound used in bucketing (exclusive) |
| `nbuckets` | The integer value for the number of histogram buckets (partitions) |

#### Sample Usage

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

## last() [](last)

The `last` aggregate allows you to get the value of one column
as ordered by another. For example, `last(temperature, time)` will return the
latest temperature value based on time within an aggregate group.

#### Required Arguments

|Name|Description|
|---|---|
| `value` | The value to return (anyelement) |
| `time` | The timestamp to use for comparison (TIMESTAMP/TIMESTAMPTZ or integer type)  |

#### Examples

Get the temperature every 5 minutes for each device over the past day:
```sql
SELECT device_id, time_bucket('5 minutes', time) as interval,
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

#### Required Arguments

|Name|Description|
|---|---|
| `bucket_width` | A PostgreSQL time interval for how long each bucket is (interval) |
| `time` | The timestamp to bucket (timestamp/timestamptz/date)|

#### Optional Arguments

|Name|Description|
|---|---|
| `offset` | The time interval to offset all buckets by (interval) |

### For Integer Time Inputs

#### Required Arguments

|Name|Description|
|---|---|
| `bucket_width` | The bucket width (integer) |
| `time` | The timestamp to bucket (integer) |

#### Optional Arguments

|Name|Description|
|---|---|
| `offset` | The amount to offset all buckets by (integer) |


#### Sample Usage

Simple 5-minute averaging:

```sql
SELECT time_bucket('5 minutes', time)
    AS five_min, avg(cpu)
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

Bucketing a TIMESTAMPTZ at local time instead of UTC(see note above):
```sql
SELECT time_bucket('2 hours', timetz::TIMESTAMP) AS five_min,
    avg(cpu)
  FROM metrics
  GROUP BY five_min
  ORDER BY five_min DESC LIMIT 10;
```

Note that the above cast to TIMESTAMP converts the time to local time according
to the server's timezone setting.

---

## Utilities/Statistics [](utilities)

## chunk_relation_size() [](chunk_relation_size)

Get relation size of the chunks of an hypertable.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get chunk relation sizes for.|

#### Returns
|Column|Description|
|---|---|
|chunk_id|Timescaledb id of a chunk|
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

#### Sample Usage
```sql
SELECT * FROM chunk_relation_size('conditions');
```
or, to reduce the output, a common use is:
```sql
SELECT chunk_table, table_bytes, index_bytes, total_bytes FROM chunk_relation_size('conditions');
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

## chunk_relation_size_pretty() [](chunk_relation_size_pretty)

Get relation size of the chunks of an hypertable.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get chunk relation sizes for.|

#### Returns
|Column|Description|
|---|---|
|chunk_id|Timescaledb id of a chunk|
|chunk_table|Table used for the chunk|
|partitioning_columns|Partitioning column names|
|partitioning_column_types|Types of partitioning columns|
|partitioning_hash_functions|Hash functions of partitioning columns|
|ranges|Partitioning ranges for each dimension|
|table_size|Pretty output of table_bytes|
|index_size|Pretty output of index_bytes|
|toast_size|Pretty output of toast_bytes|
|total_size|Pretty output of total_bytes|

#### Sample Usage
```sql
SELECT * FROM chunk_relation_size_pretty('conditions');
```
or, to reduce the output, a common use is:
```sql
SELECT chunk_table, table_size, index_size, total_size FROM chunk_relation_size_pretty('conditions');
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

## get_telemetry_report() [](get_telemetry_report)

This function returns the text string that is sent to our servers if
background [telemetry][] is enabled. It takes no arguments.

#### Sample Usage

```sql
SELECT get_telemetry_report()
```

---

# hypertable_approximate_row_count() [](hypertable_approximate_row_count)

Get approximate row count for hypertable(s) based on catalog estimates.

#### Optional Arguments

|Name|Description|
|---|---|
| `main_table` | Hypertable to get row count for. If omitted, all hypertabls are returned. |

#### Sample Usage

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

## hypertable_relation_size() [](hypertable_relation_size)

Get relation size of hypertable like `pg_relation_size(hypertable)`.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get relation size for.|

#### Returns
|Column|Description|
|---|---|
|table_bytes|Disk space used by main_table (like pg_relation_size(main_table))|
|index_bytes|Disk space used by indexes|
|toast_bytes|Disk space of toast tables|
|total_bytes|Total disk space used by the specified table, including all indexes and TOAST data|

#### Sample Usage
```sql
SELECT * FROM hypertable_relation_size('conditions');
```
or, to reduce the output, a common use is:
```sql
SELECT table_bytes, index_bytes, toast_bytes, total_bytes FROM hypertable_relation_size('conditions');
```
The expected output:
```
 table_bytes | index_bytes | toast_bytes | total_bytes
-------------+-------------+-------------+-------------
  1227661312 |  1685979136 |      180224 |  2913820672
```
---

## hypertable_relation_size_pretty() [](hypertable_relation_size_pretty)

Get relation size of hypertable like `pg_relation_size(hypertable)`.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get relation size for.|

#### Returns
|Column|Description|
|---|---|
|table_size|Pretty output of table_bytes|
|index_size|Pretty output of index_bytes|
|toast_size|Pretty output of toast_bytes|
|total_size|Pretty output of total_bytes|

#### Sample Usage
```sql
SELECT * FROM hypertable_relation_size_pretty('conditions');
```
or, to reduce the output, a common use is:
```sql
SELECT table_size, index_size, toast_size, total_size FROM hypertable_relation_size_pretty('conditions');
```
The expected output:
```
 table_size | index_size | toast_size | total_size
------------+------------+------------+------------
 1171 MB    | 1608 MB    | 176 kB     | 2779 MB
```

---

## indexes_relation_size() [](indexes_relation_size)

Get sizes of indexes on a hypertable.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get indexes size for.|

#### Returns
|Column|Description|
|---|---|
|index_name|Index on hyper table|
|total_bytes|Size of index on disk|

#### Sample Usage
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

## indexes_relation_size_pretty() [](indexes_relation_size_pretty)

Get sizes of indexes on a hypertable.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get indexes size for.|

#### Returns
|Column|Description|
|---|---|
|index_name|Index on hyper table|
|total_size|Pretty output of total_bytes|

#### Sample Usage
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

## show_tablespaces() [](show_tablespaces)

Show the tablespaces attached to a hypertable.

#### Required Arguments

|Name|Description|
|---|---|
| `hypertable` | Identifier of hypertable to show attached tablespaces for.|


#### Sample Usage

```sql
SELECT * FROM show_tablespaces('conditions');
 show_tablespaces
------------------
 disk1
 disk2
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
[downloaded separately]: https://raw.githubusercontent.com/timescale/timescaledb/master/scripts/dump_meta_data.sql
[postgres-tablespaces]: https://www.postgresql.org/docs/9.6/static/manage-ag-tablespaces.html
[postgres-createtablespace]: https://www.postgresql.org/docs/9.6/static/sql-createtablespace.html
[migrate-from-postgresql]: /getting-started/migrating-data
[adaptive-chunking]: /using-timescaledb/adaptive-chunking
[memory-units]: https://www.postgresql.org/docs/current/static/config-setting.html#CONFIG-SETTING-NAMES-VALUES
[telemetry]: /using-timescaledb/telemetry
