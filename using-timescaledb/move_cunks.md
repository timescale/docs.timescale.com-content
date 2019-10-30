# Data Tiering Operational Guide

As part of TimescaleDB 1.5, we’ve introduced a data tiering feature named move chunks. 
This feature will allow you to move individual chunks between Postgres tablespaces. 
The key here is that, as data ages, you can change the type of storage it resides 
on by simply adding new tablespaces backed by different classes of storage.

Let’s take a look at an example:

<Graphic>

In the above example, data moves over time from left (position 0) to right (position 4). 
We can use additional tablespaces in Postgres backed by slower and less expensive 
storage as data ages. The real benefit here is the ability to manage this data in 
TimescaleDB at the chunk level. 

As chunks age you can move them from left to right (as seen above) to reduce the 
costs associated with storing data you need to keep. Combined with compression, 
we enable users to tightly manage costs without needing to purge data (an option 
that can be difficult or impossible to use in a compliance driven environment, or 
where historical data analysis is a key part of your work).

Using multiple tablespaces also yields I/O performance benefitsWith data tiering 
you gain the ability to spread the read I/O load across multiple storage mounts and 
disk arrays, and ensure that large hypertables (where you may be performing analytics) 
do not overrun the disk backing the default tablespace.


### Move Chunks
The move chunks function requires multiple tablespaces set up in Postgres, so let's 
start with a quick review of how this works.

First, add a storage mount that will serve as a home for your new tablespace. This 
process will differ based on how you are deployed, but your system administrator 
should be able to arrange setting up the mount point. The key here is to backend 
your tablespace with storage that is appropriate for how its resident data will be used.

To create a tablespace in Postgres:

```sql
CREATE TABLESPACE tablespace_2
OWNER postgres
LOCATION '/mnt/postgres';
```

Here we are creating a tablespace called tablespace_2 that will be in this case owned 
by the Postgres user and it will use the storage mounted at /mnt/postgres.

Now we are ready to leverage this new tablespace and underlying storage for TimescaleDB 
chunks and their indexes. 


---

### Chunks and Indexes on the same tablespace

Now that we have set up a new, empty tablespace,we can move chunks (along with their 
indexes) off of their default tablespace. 

To determine which chunks to move, we can list chunks that fit a specific criteria. 
For example,  to identify chunks older than two days:

```sql
SELECT show_chunks('conditions', older_than => interval '2 days');
```

In this example, we will move 1_4 along with its index over to tablespace_2 using the following command:

```sql
SELECT move_chunk(chunk=>'_timescaledb_internal._hyper_1_4_chunk', destination_tablespace=>'tablespace_2', 
index_destination_tablespace=>'tablespace_2', reorder_index=>'_timescaledb_internal._hyper_1_4_chunk_netdata_time_idx', 
verbose=>TRUE);
```
Once this successfully executes, we can verify that our chunk now lives on tablespace_2 
by querying pg_tables to list all of the chunks that are on tablespace_2:

```sql
SELECT tablename from pg_tables WHERE tablespace = 'tablespace_2' and tablename like '_hyper_%_%_chunk';
```

As you can see, chunk 1_4 is listed as living on tablespace_2 and if we run the 
following command we will see our index for this chunk has moved to tablespace_2 
as well:

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablespace = 'tablespace_2';
```

---

### Moving Chunks Back to the Default Tablespace

After moving a chunk to a newtablespace, you may encounter a use case where you 
want to move chunks back to the default tablespace. Let's walk through how this 
would work:

```sql
SELECT move_chunk(chunk=>'_timescaledb_internal._hyper_1_4_chunk', destination_tablespace=>'pg_default', 
index_destination_tablespace=>'pg_default', reorder_index=>'_timescaledb_internal._hyper_1_4_chunk_netdata_time_idx', 
verbose=>TRUE);
```
With this command, we are moving the chunks we originally moved over to tablespace_2 
back to the default Postgres tablespace. We can see that this is completed by running 
the following command:

```sql
SELECT tablename from pg_tables WHERE tablespace IS NULL AND tablename LIKE '_hyper_%_%_chunk';
```
In the PostgreSQL system table pg_tables tablespace NULL represents the default 
tablespace, and as you can see from the query results below, chunk 1_4 is back in 
the default tablespace.

Our command also moved the chunk index back to the default tablespace as well. 
We can confirm this by running the following:

```sql
SELECT indexname, tablespace
FROM pg_indexes
WHERE tablespace is NULL and indexname LIKE '_hyper_%_%_chunk_%';
```
As you can see from our query results, the index associated with chunk 1_4 is now back on the Postgres default tablespace.

---


### Splitting up Chunks and Indexes 

Another set of use cases you might encounter is the need to split the indexes for 
chunks on one table space while the data chunk lives on another table space (space 
constraints, IO constraints etc.).

Let's start with moving the chunk and the index to different tablespaces. Here 
is what the command would look like:

```sql
SELECT move_chunk(chunk=>'_timescaledb_internal._hyper_1_2_chunk', destination_tablespace=>'tablespace_1', 
index_destination_tablespace=>'tablespace_2', reorder_index=>'_timescaledb_internal._hyper_1_2_chunk_cluster_test_time_idx', 
verbose=>TRUE);
```
Here we are moving the data chunk from the default tablespace to tablespace_1 and 
we are moving the index associated with that data chunk to tablespace_2.  We can 
use the same set of validation steps described above (queries showing chunks and 
indexes in a specific tablespace) to see that the objects have moved.  

Another use case we may need to implement is moving just the chunk to an alternative 
table space leaving the index in the default. Or we may want to do just the opposite 
by moving the index and leaving the chunk on the default tablespace. Here is how we
would accomplish this:

```sql
SELECT move_chunk(chunk=>'_timescaledb_internal._hyper_1_2_chunk', destination_tablespace=>'pg_default', 
index_destination_tablespace=>'tablespace2', reorder_index=>'_timescaledb_internal._hyper_1_2_chunk_cluster_test_time_idx', 
verbose=>TRUE);
```
As you can see, we have set the destination for the index as tablespace_2 and left the chunk on the pg_default table space.

We can also perform this operation leaving the index on the default tablespace as well:

```sql 
SELECT move_chunk(chunk=>'_timescaledb_internal._hyper_1_2_chunk', destination_tablespace=>'tablespace_2', 
index_destination_tablespace=>'pg_default', reorder_index=>'_timescaledb_internal._hyper_1_2_chunk_cluster_test_time_idx', 
verbose=>TRUE);
 ``` 
---




[postgres-materialized-views]: https://www.postgresql.org/docs/current/rules-materializedviews.html
[api-continuous-aggs]:/api#continuous-aggregates
[postgres-createview]: https://www.postgresql.org/docs/current/static/sql-createview.html
[time-bucket]: /api#time_bucket
[api-continuous-aggs-create]: /api#continuous_aggregate-create_view
[postgres-parallel-agg]:https://www.postgresql.org/docs/current/parallel-plans.html#PARALLEL-AGGREGATION
[api-refresh-continuous-aggs]: /api#continuous_aggregate-refresh_view
[api-continuous-aggregates-info]: /api#timescaledb_information-continuous_aggregate
[api-continuous-aggregate-stats]: /api#timescaledb_information-continuous_aggregate_stats
[api-drop-chunks]: /api#drop_chunks
[api-set-chunk-interval]: /api#set_chunk_time_interval
[api-add-drop-chunks]: /api#add_drop_chunks_policy
[timescale-github]: https://github.com/timescale/timescaledb
[support-slack]: https://slack-login.timescale.com
[postgres-ordered-set]: https://www.postgresql.org/docs/current/functions-aggregate.html#FUNCTIONS-ORDEREDSET-TABLE
