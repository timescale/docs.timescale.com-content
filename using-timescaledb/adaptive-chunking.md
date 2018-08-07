# Adaptive chunking [](adaptive-chunking)

One secret behind TimescaleDB's excellent performance with time-series
data is its automatic partitioning scheme that splits the data across
a number of N-dimensional *chunks*. However, the performance will only
be good if the system achieves the "right" *chunk size* (i.e., storage
bytes on disk) that won't blow up the memory budget when chunks and
their indexes are cached for inserts and queries. Oversized chunks
result in slow insert performance when updating indexes and also
negatively affect query speed, because they need frequent disk access
if they don't fit in cache memory.

Unfortunately, the "right" chunk size cannot be set directly as the
size is governed by the pre-created dimensional constraints on the
chunk (e.g., for time or hash partitions) and the data rate that fills
the chunk. Dynamically altering constraints on an existing chunk to
achieve the "right" chunk size is an expensive and difficult
operation, especially in face of changing data rates and out-of-order
inserts that might either "overfill" or "underfill" a chunk.

Setting a good `chunk_time_interval` is crucial to achieving a good
chunk size, since the time interval that a chunk covers also affects
the size on disk. Fortunately, the `chunk_time_interval` can be
updated on an existing hypertable, although this new setting only
applies to chunks created after the change. A conflict resolution
mechanism within TimescaleDB automatically detects any "collisions"
between new and old chunks due to the change in partitioning, and cuts
chunks to fit within existing constraints. Therefore, it is not
uncommon to see chunks that are smaller than expected around the time
the interval was changed.

*Adaptive chunking* leverages the ability to set new
`chunk_time_interval`s through automation. With adaptive chunking,
however, the user instead sets a `chunk_target_size` (e.g., `1GB`) and
the system will try to adapt the `chunk_time_interval` on new chunks
to reach this target chunk size using an algorithm. Ideally,
`chunk_target_size` should not exceed the setting of `shared_buffers`
in PostgreSQL, since otherwise a chunk might not fit in cache
memory. The system tries to adapt the first *open* (time) dimension,
which is the same dimension that `chunk_time_interval` works on. An
open dimension is one that *isn't* completely pre-partitioned, unlike
hash-partitioned dimensions where the entire key space is divided into
equal-size partitions.

>:TIP: Setting a reasonable initial `chunk_time_interval` is still
important because it allows the adaptive algorithm to more quickly
reach the target chunk size. Setting a too large `chunk_time_interval`
is worse than setting a too small one, because the system will be
committed to that larger interval until the next chunk.  If no
`chunk_time_interval` is set with adaptive chunking, the default is 1
day.

The default algorithm to calculate the next chunk's interval takes
into account the *fill factor* of previous chunks, i.e., if they were
over-filled or under-filled, and changes the interval accordingly. The
default algorithm should work well for workloads that see an increased
data rate over time. Note that the algorithm uses the function
[`pg_total_relation_size`][pg_total_relation_size], which includes the
size of indexes, to get the size of previous chunks. This is so that
both the table and indexes can potentially fit within
`chunk_target_size` and thus in cache memory. Adding or removing
indexes on a hypertable will thus affect the chunk size and
potentially trigger the algorithm to change the `chunk_time_interval`
of future chunks. It is unlikely, however, that the algorithm will
ever hit the exact target size, and it will only change the
`chunk_time_interval` if the chunk size deviates more than a certain
threshold from the target size. Like manual changes to the
`chunk_time_interval`, automatic adaption can lead to chunks being
smaller than expected at the time changes occur due to chunks being
cut to fit in case of collisions. For those that require more control,
it is also possible to implement [custom adaptive chunking
algorithms](#custom-functions).

>:TIP: It is recommended that hypertables with adaptive chunking
enabled have an index on the dimension being adapted, typically the
"time" dimension. Such an index is created by default, unless
otherwise specified. The index is used by the default adaptive
chunking algorithm to get the `min` and `max` value from a chunk to
calculate its fill factor. Without an index, it must resort to a heap
scan (i.e., scanning all the rows in a chunk), which is expensive. The
system will print `WARNING`s in the log if has to do heap scans.

### Usage

To create a hypertable that uses adaptive chunking, simply call
[`create_hypertable`][create-hypertable] as follows:

```sql
SELECT create_hypertable('conditions', 'time', chunk_target_size => '2GB');
```

This turns the table `conditions` into a hypertable that will try to
adapt the time dimension to reach the given target chunk size.

It is also possible to let the system *estimate* a target chunk size
in case it is unclear what a good chunk size would be for the given
system. In that case run:

```sql
SELECT create_hypertable('conditions', 'time', chunk_target_size => 'estimate');
```

This will estimate the chunk target size based on system settings and
parameters.

### Using a custom adaptive chunking algorithm [](custom-functions)

Adaptive chunking supports custom chunk sizing functions in case the
default one doesn't work well for a specific workload. A custom
function should calculate the "next" chunk interval whenever a new
chunk is created. The function's signature is as follows (in SQL):

```sql
CREATE FUNCTION calculate_chunk_interval(
        dimension_id INTEGER,
        dimension_coord BIGINT,
        chunk_target_size BIGINT)
RETURNS BIGINT;
```

The `dimension_id` is the ID of the dimension being adapted (e.g.,
"time"). This ID can be used to retrieve information about the
dimension in TimescaleDB's internal catalog table
`_timescaledb_catalog.dimension`.  The `dimension_coord` is the value
along the dimensional axis for the tuple being inserted (the one that
triggered the new chunk being created). For example, it could be a
`TIMESTAMPTZ` converted to internal system time (UNIX time in
microseconds).  The `chunk_target_size` is the current chunk target
size (passed on for convenience). The return value should be the new
`chunk_time_interval` in internal system time.

To enable adaptive chunking with a custom function, run:

```sql
SELECT create_hypertable('conditions', 'time',
    chunk_target_size => '2GB',
    chunk_sizing_func => 'custom_calculate_chunk_interval');
```

or, to change the function on an existing hypertable:

```sql
SELECT set_adaptive_chunking('conditions', '2GB', 'custom_calculate_chunk_interval');
```

[create-hypertable]: /api#create_hypertable
[pg_total_relation_size]: https://www.postgresql.org/docs/10/static/functions-admin.html#FUNCTIONS-ADMIN-DBSIZE
