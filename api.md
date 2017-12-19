# TimescaleDB API Reference

>toplist
> ### Command List (A-Z)
> - [add_dimension](#add_dimension)
> - [chunk_relation_size](#chunk_relation_size)
> - [chunk_relation_size_pretty](#chunk_relation_size_pretty)
> - [create_hypertable](#create_hypertable)
> - [drop_chunks](#drop_chunks)
> - [first](#first)
> - [histogram](#histogram)
> - [hypertable_relation_size](#hypertable_relation_size)
> - [hypertable_relation_size_pretty](#hypertable_relation_size_pretty)
> - [indexes_relation_size](#indexes_relation_size)
> - [indexes_relation_size_pretty](#indexes_relation_size_pretty)
> - [last](#last)
> - [set_chunk_time_interval](#set_chunk_time_interval)
> - [time_bucket](#time_bucket)

## Hypertable management <a id="hypertable-management"></a>

## add_dimension() <a id="add_dimension"></a>

Add an additional partitioning dimension to a TimescaleDB hypertable.
The column selected as the dimension can either use interval
partitioning (e.g., for a second time partition) or hash partitioning.

>vvv Before using this command, please see the [best practices][] discussion
and talk with us on [Slack](https://slack-login.timescale.com) about
your use case. Users will *rarely* want or need to use this command.

<!-- -->
>vvv The `add_dimension` command can only be executed after a table has been
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
| `interval_length` | Interval in that each chunk covers. Must be > 0.|

When executing this function, either `number_partitions` or `interval_length`
must be supplied, which will dictate if the dimension will use hash or interval
partitioning.

Currently, the `interval_length` must be specified in a BIGINT.  If
the column to be partitions is an TIMESTAMP, TIMESTAMPTZ, or DATE,
this length represents some number of *microseconds*.  If the column
is some other integer or numeric type, this length should reflect the column's
underlying semantics (e.g., the `interval_length` should be given in
milliseconds if the time column is the number of milliseconds since
the UNIX epoch).

>vvv Supporting **more** than one additional dimension is currently
 experimental.  For any production environments, users are recommended
 to use at most one "space" dimension (in addition to the required
 time interval specified in `create_hypertable`).

#### Sample Usage <a id="add_dimension-examples"></a>

First convert table `conditions` to hypertable with just time
partitioning on column `time`, then add an additional space
partitioning:
```sql
SELECT create_hypertable('conditions', 'time');
SELECT add_dimension('conditions', location, number_partitions => 4);
```

Convert table `conditions` to hypertable with time partitioning on `time` and
space partitioning (4 partitions) on `location`, then add two additional dimensions.

```sql
SELECT create_hypertable('conditions', 'time', 'location', 2);
SELECT add_dimension('conditions', 'time_received', interval_length => 86400000000);
SELECT add_dimension('conditions', 'device_id', number_partitions => 2);
```

>vvv Supporting **more** than one additional dimension is currently
 experimental.  For any production environments, users are recommended
 to use at most one "space" dimension (in addition to the required
 time interval specified in `create_hypertable`).

---

## create_hypertable() <a id="create_hypertable"></a>

Creates a TimescaleDB hypertable from a PostgreSQL table (replacing the
latter), partitioned on time and with the option to partition
on one or more other columns (i.e., space).
All actions, such as `ALTER TABLE`, `SELECT`, etc.,
still work on the resulting hypertable.

>vvv The `create_hypertable` command can only be executed on an empty table.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of table to convert to hypertable|
| `time_column_name` | Name of the column containing time values|

#### Optional Arguments

|Name|Description|
|---|---|
| `partitioning_column` | Name of an additional column to partition by. If provided, `number_partitions` must be set.
| `number_partitions` | Number of hash partitions to use for `partitioning_column` when this optional argument is supplied. Must be > 0.
| `chunk_time_interval` | Interval in event time that each chunk covers. Must be > 0. Default is 1 month.
| `create_default_indexes` | Boolean whether to create default indexes on time/partitioning columns. Default is TRUE.
| `if_not_exists` | Boolean whether to print warning if table already converted to hypertable or raise exception. Default is FALSE.

The time column currently only supports values with a data type of
timestamp (TIMESTAMP, TIMESTAMPTZ), DATE, or integer (SMALLINT, INT, BIGINT).

The units of `chunk_time_interval` should be set as follows:

- For time columns having timestamp or DATE types, the
`chunk_time_interval` should be specified either as an `interval` type
or a numerical value in microseconds.

- For integer types, the `chunk_time_interval` **must** be set
explicitly, as the database does not otherwise understand the
semantics of what each integer value represents (a second,
millisecond, nanosecond, etc.).  So if your time column is the number
of milliseconds since the UNIX epoch, and you wish to each chunk to
cover 1 day, you should specify `chunk_time_interval => 86400000`.

<!-- -->
>ttt The `add_dimension` function can be used following hypertable
 creation to add one or more additional partitioning dimensions (and
 as an alternative to specifying the optional argument
 in `create_hypertable`).  See [best practices][] before using any
 spatial partitioning.

#### Sample Usage <a id="create_hypertable-examples"></a>

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

Convert table `conditions` to hypertable. Do not raise a warning
if `conditions` is already a hypertable.
```sql
SELECT create_hypertable('conditions', 'time', if_not_exists => TRUE);
```

#### Best Practices <a id="create_hypertable-best-practices"></a>

Users of TimescaleDB often have two common questions:

1. How large should I configure my intervals for time partitioning?
1. Should I use space partitioning, and how many space partitions should I use?

**Time intervals**: The current release of TimescaleDB does not
perform adaptive time intervals (although this is in the works).
So, users must configure it when creating their hypertable by
setting the `chunk_time_interval` (or use the default of 1 month).
The interval used for new chunks can be changed by calling `set_chunk_time_interval`.

The key property of choosing the time interval is that the chunk (including indexes) belonging to the most recent interval (or chunks if using space
partitions) fit into memory.  As such, we typically recommend setting
the interval so that these chunk(s) comprise no more than 25% of main
memory.

>ttt Make sure that you are planning for recent chunks from _all_ active hypertables to fit into 25% of main memory, rather than 25% per hypertable.

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

>ttt One caveat is that the total chunk size is actually dependent on
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

## drop_chunks() <a id="drop_chunks"></a>

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

The `older_than` can be specified in two ways:

- **interval type**: The cut-off point is computed as `now() -
    older_than`.  An error will be returned if an interval is supplied
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

---

## set_chunk_time_interval() <a id="set_chunk_time_interval"></a>
Sets the chunk_time_interval on a hypertable. The new interval is used
when new chunks are created but the time intervals on existing chunks are
not affected.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to update interval for.|
| `chunk_time_interval` | Interval in event time that each new chunk covers. Must be > 0.|

The valid types for the `chunk_time_interval` depends on the type of
hypertable time column:

- **TIMESTAMP, TIMESTAMPTZ, DATE**: The specified
    `chunk_time_interval` should be an
    integer (or bigint) value, representing some number of microseconds.

- **INTEGER**: The specified `chunk_time_interval` should be an
    integer (smallint, int, bigint) value and represent the understand
    semantics of the hypertable's time column, e.g., given in
    milliseconds if the time column is expressed in milliseconds
    (see `create_hypertable` [instructions](#create_hypertable)).

#### Sample Usage

For a TIMESTAMP column, set `chunk_time_interval` to 24 hours.
```sql
SELECT set_chunk_time_interval('conditions', interval '1 day');
SELECT set_chunk_time_interval('conditions', 86400000000);
```

For a time column expressed as the number of milliseconds since the
UNIX epoch, set `chunk_time_interval` to 24 hours.
```sql
SELECT set_chunk_time_interval('conditions', 86400000);
```

---

## Analytics <a id="analytics"></a>

## first() <a id="first"></a>

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

>vvv The `last` and `first` commands do **not** use indexes, and instead
 perform a sequential scan through their groups.  They are primarily used
 for ordered selection within a `GROUP BY` aggregate, and not as an
 alternative to an `ORDER BY time DESC LIMIT 1` clause to find the
 latest value (which will use indexes).

---

## histogram() <a id="histogram"></a>

The `histogram()` function represents the distribution of a set of
values as an array of equal-width buckets. It partitions the dataset
into a specified number of buckets (`nbuckets`) ranging from the
inputted `min` and `max` values.

The return value is an array containing `nbuckets`+2 buckets, with the
middle `nbuckets` bins for values in the stated range, the first
bucket at the head of the array for values under the lower `min` bound,
and the last bucket for values above the `max` bound.

#### Required Arguments

|Name|Description|
|---|---|
| `value` | A set of values to partition into a histogram |
| `min` | The histogram’s lower bound used in bucketing |
| `max` | The histogram’s upper bound used in bucketing |
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

## last() <a id="last"></a>

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

>vvv The `last` and `first` commands do **not** use indexes, and instead
 perform a sequential scan through their groups.  They are primarily used
 for ordered selection within a `GROUP BY` aggregate, and not as an
 alternative to an `ORDER BY time DESC LIMIT 1` clause to find the
 latest value (which will use indexes).

---

## time_bucket() <a id="time_bucket"></a>

This is a more powerful version of the standard PostgreSQL `date_trunc` function.
It allows for arbitrary time intervals instead of the second, minute, hour, etc.
provided by `date_trunc`. The return value is the bucket's start time.
Below is necessary information for using it effectively.

>ttt TIMESTAMPTZ arguments are
bucketed by the time at UTC. So the alignment of buckets is
on UTC time. One consequence of this is that daily buckets are
aligned to midnight UTC, not local time.

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
SELECT time_bucket('5 minutes', time) five_min, avg(cpu)
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

## Utilities/Statistics <a id="utilities"></a>

## chunk_relation_size() <a id="chunk_relation_size"></a>

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
|toast_bytes|Disc space of toast tables|
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

## chunk_relation_size_pretty() <a id="chunk_relation_size_pretty"></a>

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
                chunk_table                 | table_size | index_size | total_size
---------------------------------------------+------------+------------+------------
 "_timescaledb_internal"."_hyper_1_1_chunk"  | 28 MB      | 36 MB      | 64 MB
 "_timescaledb_internal"."_hyper_1_2_chunk"  | 57 MB      | 78 MB      | 134 MB
 ...
```
Where `chunk_table` is the table that contains the data, `table_size` is the size of that table, `index_size` is the size of the indexes of the table, and `total_size` is the size of the table with indexes.

---

## hypertable_relation_size() <a id="hypertable_relation_size"></a>

Get relation size of hypertable like `pg_relation_size(hypertable)`.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of hypertable to get relation size for.|

#### Returns
|Column|Description|
|---|---|
|table_bytes|Disk space used by main_table (like pg_relation_size(main_table))|
|index_bytes|Disc space used by indexes|
|toast_bytes|Disc space of toast tables|
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

## hypertable_relation_size_pretty() <a id="hypertable_relation_size_pretty"></a>

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

## indexes_relation_size() <a id="indexes_relation_size"></a>

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

## indexes_relation_size_pretty() <a id="indexes_relation_size"></a>

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

## Dump TimescaleDB meta data <a id="dump-meta-data"></a>

To help when asking for support and reporting bugs, TimescaleDB includes a SQL script
that outputs metadata from the internal TimescaleDB tables as well as version information.
The script is available in the source distribution in `scripts/` but can also be
[downloaded separately][].
To use it, run
```bash
psql [your connect flags] -d your_timescale_db < dump_meta_data.sql > dumpfile.txt
```
and then inspect `dump_file.txt` before sending it together with a bug report or support question.

[Slack]: https://slack-login.timescale.com
[chunk relation size]: #chunk_relation_size
[best practices]: #create_hypertable-best-practices
[downloaded separately]: https://raw.githubusercontent.com/timescale/timescaledb/master/scripts/dump_meta_data.sql
