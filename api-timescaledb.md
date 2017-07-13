# TimescaleDB API Reference

## create_hypertable() <a id="create_hypertable"></a>

Creates a TimescaleDB hypertable from a PostgreSQL table (replacing the
latter), partitioned on time and with the option to partition
on one other column (i.e., space). Target table must be empty.
All actions, such as `ALTER TABLE`, `SELECT`, etc.,
still work on the resulting hypertable.

#### Required Arguments

|Name|Description|
|---|---|
| `main_table` | Identifier of table to convert to hypertable|
| `time_column_name` | Name of the column containing time values|

#### Optional Arguments

|Name|Description|
|---|---|
| `partitioning_column` | Name of an additional column to partition by. If provided, `number_partitions` must be set.
| `number_partitions` | Number of partitions to use when `partitioning_column` is set. Must be > 0.
| `chunk_time_interval` | Interval in event time that each chunk covers. Must be > 0. Default is 1 month ([units][]).

>vvv The time column currently only supports values with a data type of
 integer (SMALLINT, INT, BIGINT) or timestamp (TIMESTAMP,
 TIMESTAMPTZ).  Additionally, if the time column is of type SMALLINT or INT,
 the `chunk_time_interval` **must** be set explicitly.

#### Sample Usage <a id="create_hypertable-examples"></a>

Convert table `conditions` to hypertable with just time partitioning on column `time`:
```sql
SELECT create_hypertable('conditions', 'time');
```

Convert table `conditions` to hypertable with time partitioning on `time` and
space partitioning (4 partitions) on `location`:
```sql
SELECT create_hypertable('conditions', 'time', 'location', 4);
```

Convert table `conditions` to hypertable with just time partitioning on column `time`,
but setting `chunk_time_interval` to 24 hours:
```sql
SELECT create_hypertable('conditions', 'time',
  chunk_time_interval => 86400000000);
```

#### Best Practices <a id="create_hypertable-best-practices"></a>

Users of TimescaleDB often have two common questions:

1. How large should I configure my intervals for time partitioning?
1. Should I use space partitioning, and how many space partitions should I use?

**Time intervals**: The current release of TimescaleDB does not
perform adaptive time intervals (although this is in the works).
So, users must configure it when creating their hypertable by
setting the `chunk_time_interval` (or use the default of 1 month).

The key property of choosing the time interval is that the chunk
belonging to the most recent interval (or chunks if using space
partitions) fit into memory.  As such, we typically recommend setting
the interval so that these chunk(s) comprise maybe 25% of main
memory.

To determine this, you roughly need to understand your data rate.  If
you are writing roughly 2GB of data per day and have 64GB of memory,
setting the time interval to a week would be good.  If you are writing
20GB per day on the same machine, setting the time interval to a day
would be appropriate.  This interval would also hold if data is loaded
more in batches, e.g., you bulk load 140GB of data per week, with data
corresponding to records from throughout the week.

While it's generally safer to make chunks smaller rather than too
large, setting intervals too small can lead to *many* chunks, which
corresponds to increased planning latency for some types of queries.

**Space partitions**: A key advantage of using space partitions is the
ability to parallelize queries, even during the same time intervals.
This has the most significant impact when it also leads to parallel
disk I/O, e.g., some separate threads can read in parallel from
multiple disks.

We recommend using space partitions in a hypertable when it is split
over multiple disks.  In particular, the number of space partitions
should be either equal to or a small multiple of the number of disks.
Internally, the partition keys are then hashed and they hash value is
mapped to one of these partitions.

We typically recommend using 1 space partition per disk.

TimescaleDB does *not* benefit from a very large number of space
partitions (such as the number of unique items you expect in
partition field).  A very large number of such partitions leads both
to poorer per-partition load balancing, as well as much increased
planning latency for some types of queries.

---

## drop_chunks() <a id="drop_chunks"></a>

Removes data chunks that are older than a given time interval across all
hypertables or a specific one. Chunks are removed only if _all_ of their data is
beyond the cut-off point, so the remaining data may contain timestamps that
are before the cut-off point, but only one chunk's worth.

#### Required Arguments

|Name|Description|
|---|---|
| `older_than` | Timestamp of cut-off point for data to be dropped, i.e., anything older than this should be removed. ([units][])|

#### Optional Arguments

|Name|Description|
|---|---|
| `table_name` | Hypertable name from which to drop chunks. If not supplied, all hypertables are affected.
| `schema_name` | Schema name of the hypertable from which to drop chunks. Defaults to `public`.

#### Sample Usage

Drop all chunks older than 3 months:
```sql
SELECT drop_chunks(interval '3 months');
```

Drop all chunks from hypertable `conditions` older than 3 months:
```sql
SELECT drop_chunks(interval '3 months', 'conditions');
```

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
| `time` | The timestamp to bucket (timestamp/timestamptz)|

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
  GROUP BY five_min ORDER BY five_min
  LIMIT 10;
```

To report the middle of the bucket, instead of the left edge:
```sql
SELECT time_bucket('5 minutes', time) + '2.5 minutes'
    AS five_min, avg(cpu)
  FROM metrics
  GROUP BY five_min ORDER BY five_min
  LIMIT 10;
```

For rounding, move the alignment so that the middle of the bucket is at the
5 minute mark (and report the middle of the bucket):
```sql
SELECT time_bucket('5 minutes', time, '-2.5 minutes') + '2.5 minutes'
    AS five_min, avg(cpu)
  FROM metrics
  GROUP BY five_min ORDER BY five_min
  LIMIT 10;
```

Bucketing a TIMESTAMPTZ at local time instead of UTC(see note above):
```sql
SELECT time_bucket('2 hours', timetz::TIMESTAMP) five_min,
    avg(cpu)
  FROM metrics
  GROUP BY five_min ORDER BY five_min;
```

Note that the above cast to TIMESTAMP converts the time to local time according
to the server's timezone setting.

---

## last() and first() <a id="first-last"></a>

The `last()` and `first()` aggregates allow you to get the value of one column
as ordered by another. For example, `last(temperature, time)` will return the
latest temperature value based on time within an aggregate group.

#### Required Arguments

|Name|Description|
|---|---|
| `value` | The value to return (anyelement) |
| `time` | The timestamp to use for comparison (TIMESTAMP/TIMESTAMPTZ or integer type)  |

#### Examples

Get the latest temperature by device_id:
```sql
SELECT device_id, last(temp, time)
  FROM metrics
  GROUP BY device_id;
```

---

## Time Units <a id="time-units"></a>
Time units for TimescaleDB functions:
- Microseconds for TIMESTAMP and TIMESTAMPTZ.
- Same units as type for integer time types.

[units]: #time-units
