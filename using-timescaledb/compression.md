# Compression Operational Guide
As of version 1.5,TimescaleDB supports the ability to natively compress data. 
This function does not require the use of any specific file system or external 
software, and as you will see in the coming paragraphs, is simple to set up and 
customizable by the user. 

Prior to reading this guide, we recommend taking a look at our architecture 
section to learn more about how compression works. At a high level, TimescaleDB’s 
built-in job scheduler framework will asynchronously convert recent data from an 
uncompressed row-based form to a compressed columnar form across chunks of TimescaleDB 
hypertables. Once a chunk is old enough, the chunk will be transactionally converted 
from the row to columnar form. 

This section will walk through the concepts and help you understand some of the 
benefits and limitations of native compression. We will also walk you through the 
basics of setting this up for use in your environment. 

>:TIP:As with any type of data altering operation, we would suggest backing up your 
important data prior to implementing compression.

You can compress data as it comes into TimescaleDB in one of two ways:

Policy-based compression: Set up automatic compression of data once it has reached 
a certain age.

Manually compress chunks: Use explicit commands that will compress chunks that you 
specify.

Before we start, we will give you a high-level overview of how compression works 
using an example that has been implemented based on policy. 

With regards to compression, a chunk can be in one of three states: active (uncompressed),
compression candidate (uncompressed), compressed. Active chunks are those that 
are currently ingesting data. Due to the nature of the compression mechanism, they
cannot effectively ingest data while compressed.

In this case, the data in Position 0 (which is our active chunk) will always be 
uncompressed, and the current active chunk will not be a candidate for compression 
in order to protect the system’s ability to perform high volume/high velocity ingestion. 
Once data moves out of Position 0 (the active chunk) and into something greater 
than or equal to Position 1, which is nw considered historical data, it then becomes 
a compression candidate (it can now be compressed manually or via policy).  

In this case, Position 0 is the current active chunk (in our model the current or 
active chunk is not compressed nor is it a candidate for compression). When a chunk 
is full (based on how you have set up your hypertable) the chunk moves to Position 1. 

In this example we have chosen NOT to compress the chunk in position 1, however 
all full chunks (position 1-4) are candidates for compression. As you can see in 
this example we have chosen to wait until a chunk reaches Position 2 (in this case 
the chunk is 3 days old) before we decide to apply compression, meaning chunks 3 
days and older will be compressed.

### Preparing Hypertable for Compression

Now that we have covered a visual demonstration of how compression works and some 
of the things you need to be aware of when planning, let’s cover how your hypertable 
will organize data for compression.

The first thing we need to do when setting up your hypertable for compression is 
decide how we are going to organize the data to achieve the best overall compression. 
In general there are two ways to consider how your data will be organized during the 
compression process: order by and segment by. The following will explain the differences, 
and when to use each option.

Order By

The main option that needs to be set is timescaledb.compress_orderby. You can think 
of this option as the ORDER BY clause in a SQL query, but in this case used on your 
raw data when it is sent to the compression process. This option is important because 
it directly impacts the compression rates as you’ll see. Compression is most effective 
when related data is close together or exhibits some sort of trend. In other words, 
random or out of order data will compress poorly. When choosing the column list to 
pass to the compress_orderby function, you want to choose columns that will result 
in the rest of the columns being ordered in a way that is compressible. 

Let’s walk through an example. Assume you have a table defined by: 

``` sql
CREATE TABLE metrics
(
     time TIMESTAMPTZ,
     device_id INT,
     value float
);

SELECT create_hypertable('metrics', 'time');
```

Let’s further assume that you have 2 devices. Device 1 measures temperature and 
humidity, while device 2 measures the air quality index. Your table might look 
something like this:

<chart>

If we pass this table as is to the compressor, the compressor will not be able to 
efficiently compress the “value” column since ordering matters. Although both devices 
output a value that is a float, they are measuring completely different quantities. 
The float list [88.2, 300.5, 88.6, 302.0, 90.0, 301.0] will compress poorly because 
values of the same magnitude are not grouped together. However, if we order by 
`device_id, time`, we’ll get the following table:


<chart>

Notice that now, your float list of [88.2, 88.6, 90.0, 300.5, 302.0, 301.0] will 
compress much better than before, since you’ve ordered your values in a way that 
groups them closer together by magnitude. You should use this methodology to choose 
the column list you pass to timescaledb.compress_orderby. 

In this case, your statement for turning on compression for this hypertable would 
look like this:

``` sql
ALTER TABLE metrics SET (timescaledb.compress, "timescaledb.compress_orderby = 'device_id, time');
```

Segment By

As discussed earlier, timescaledb.compress_orderby defines how your compressed data 
is ordered. When only compress_orderby is specified, all columns are compressed into 
arrays that contain a maximum of 1000 values. So, in the example where we order by 
`device_id, time`, the table would now become three columns that get compressed, 
as shown below:

<chart>

However, what happens when you want to query by device_id? You’ll end up having 
to decompress the above chunk in order to find values associated with device_id = 2, 
since the values for device 1 and device 2 are grouped together in the same segment. 
That means that you can’t actually build a b-tree index on device_id. To get around 
this, you can use/apply an additional option to segment the compressed data: 
timescaledb.compress_segmentby(column list)

``` sql
ALTER TABLE metrics SET (timescaledb.compress, timescaledb.compress_orderby = 'time', 
timescaledb.compress_segmentby = 'device_id');
```

Using timescaledb.compress_segmentby essentially takes the columns you pass into 
it and ensures that each compressed array has 1 copy of that value. It is saved 
in uncompressed format, and so it can be used in a b-tree index. 

So now your compressed data will look more like the following, which is divided 
into two segments (by device_id). We can now index the device_id directly.

<chart>



>:TIP: We do not recommend using segmentby if you expect less than 100 values per 
device id (as an example). This is because you won’t get the nice compression characteristics 
anymore if you don’t have very many values per device_id. For example, if device 2 
only ever reports 5 data points, that compressed array will only contain 5 data points. 

You still need to specify a column for timescaledb.compress_orderby. Let’s take 
a look at device 1. You notice that the values are increasing with time. If you 
don’t order by time, you have no guarantee that the values will not be non-random, 
which will hurt your compression rates. Here we are passing in BOTH and order by 
and segment by arguments to achieve the results described above.

This part of the process simply prepares your hyper table for compression, and tell 
TimescaleDB how you would like your compressed data organized. (Note that we have 
not started the compression process yet, that will come in the next step.)

---

### Manual vs. Policy-Based Compression

Now that we understand a little about how compression works and how we plan to 
organize our data to maximize compression efficiency, we will start the process 
of actually compressing our data. This process can be approached one of two ways.
Manual Compression
The first option we will review is the ability to manually compress chunks. Here 
you are going to issue commands that will specify chunks you would like to compress.

We start by getting a list of the chunks we want to compress. In this case our hypertable 
is called conditions, and we are looking for the chunks associated with this hypertable 
with data older than three days.

``` sql
SELECT show_chunks('conditions', older_than => interval '3 days'); 
```

<graphic>


From here we can begin the process of compressing each of listed chunks with the 
following command:

``` sql
select compress_chunk( '_timescaledb_internal._hyper_1_2_chunk');
```
You can see the results of the compression of that given chunk by running the following:

``` sql
select * from _timescaledb_catalog.compression_chunk_size
order by chunk_id;
```
This will return a result set that will show you the compressed chunks and the 
stats about those chunks. In the case of a single chunk the results look like this:

We could then proceed to compress all of the chunks in this example that are more 
than three days old by simply repeating the process for the remaining chunks in 
the list we generated.

Policy Based Compression:

We have covered the concept of manually going in and identifying what chunks you 
would like to see compressed, next we will cover automating this process with policy 
based compression.  

With policy based compression, we can tell TimescaleDB to set a policy that will 
compress chunks of data when they reach a given age. As we covered in an earlier 
section, a chunk becomes eligible for compression as soon as it is no longer the 
“active” chunk, that is it has moved from position zero to position one (in our 
diagram above). When this happens is determined by when you create the hypertable 
using a time partition.

For example, to compress chunks older than 60 days on a hypertable named conditions:

``` sql
select add_compress_chunks_policy('cpu', '60d'::interval);
```

This will create a policy that will ensure all chunks older than 60 days will be 
compressed.  Please note this still requires that we set up the hypertable for compression 
and that you have issued the commands to ensure that TimescaleDB understands how 
to organize your data. This command simply automates the process of compressing 
those chunks that cross the 60 day age threshold.

To confirm that your policy job has been created, you can validate it by using 
the following command:

``` sql
select * from _timescaledb_config.bgw_job where job_type like 'compress%';
```
Here is what we will get back:

<graphic>

Notice the system will look for chunks that cross the 60 day threshold every 15 
minutes and if the job for some reason fails it will be put in the retry queue 
and be retried in an hour.


---

### Decompressing Chunks

Next we want to walk through what needs to happen in the event that you need to 
backfill or update data that lives in a compressed chunk. 

TimescaleDB does not support inserts orupdates into a compressed chunk. To insert 
or update data, we must first decompress the target chunks. But before we can do 
that, we need to turn off our compression policy, otherwisethat policy will attempt 
to re-compress the chunks that we are currently working on (not the desired result). 
To accomplish this we will issue the following command:

``` sql
select remove_compress_chunks_policy('conditions');
```

We have now removed the compress chunk policy from the hypertable conditions which 
will leave us free to decompressing the chunks we need to modify via backfill or 
update. To decompress the chunk(s) that we will be modifying, for each chunk:

``` sql
select decompress_chunk( '_timescaledb_internal._hyper_2_2_chunk'); 
```

>:TIP: You would want to run this command for each chunk that would be impacted by your INSERT or UPDATE statement in backfilling data. Once your needed chunks are decompressed you can proceed with your data backfill operations.

Once your backfill and update operations are complete we can simply re-enable our compression policy job:

``` sql
select add_compress_chunks_policy('cpu', '60d'::interval);
```
This job will run and re-compress any chunks that you may have decompressed during your backfill operation.

---

### Best Practices
Considerations around Compression Policy:

When setting our compression policy and the timing around when to compress a chunk 
you should consider the types of queries that that you are running. Our experience 
has shown that when data is young (positions 0-2 in our use case) we tend to query 
the data in a more shallow and wide manner. 

As an example, show me all of the data for user X. In this case the row based format 
that is native to Postgresql will serve us well from a performance perspective. 
As data begins to age and our queries being to become more analytical in nature 
(deep and narrow queries) as an example we might want to calculate the average number 
of logins across all users. In this case, the columnar nature of the query (performing 
a function on the number of logins) will lend itself to better performance.  

The process of compression as we have implemented it involves converting row based 
data into more of a columnar format to achieve better overall data consolidation.  
In the long term this is one part of how you want to think about your compression 
policy strategy (i.e. at what point do you start to use deep and narrow queries) 
along with things like frequency of access and disk savings to decide when to start 
compressing checks.

WARNING: The current release of TimescaleDB supports the ability to query data in 
compressed chunks, however, it does not support inserts, or updates into compressed 
chunks.  The next several sections will discuss ways to deal with that limitation.  

Given the nature of time series data, out of order data would be one of the use 
cases where you would need to add data to, or update data in, an already compressed 
chunk. In this scenario, you will be required to pause your compression policy, 
decompress the chunks where the data would need to be inserted or updated, add or 
update the data, and then re-enable your compression policy (which will handle re-compression 
of your modified chunks). Based on the manual process required for adding out of 
order data we encourage you to consider this as you set your compression policy. 
However, we are also planning to address this (ability to modify compressed chunks) 
in a future release.

Out of order data and compression 

Depending on the boundaries set for your chunks and the likelihood that your use 
case will produce out of order data, you may want to delay chunk compression to  
minimize the risk of needing to decompress chunks to add data . This will be different 
for each use case, but remember to be mindful of out of order data, Consider when 
you have typically seen out of order data in the past when deciding when to start 
compression in order to avoid the manual decompression process.
Storage considerations for decompressing chunks
Another scenario to be mindful of when planning your compression strategy is the 
possible need to decompress chunks. This is key when you are provisioning storage 
for use with TimescaleDB. You want to ensure that you plan for enough storage headroom 
to decompress chunks if needed. 

Planning for the right amount of head room (storage), and being familiar with our 
move chunks feature <insert link to docs for move chunks> will ensure you are prepared 
to manage the need for decompression should it arise without running out of disk space. 

If you find yourself needing to decompress historical chunks but decompressing the 
number of chunks you will need to insert your out of order data will cause storage 
issues (i.e. you do not have enough storage), you can follow this process:

Add a new tablespace to your Postgres instance (backed by additional storage)

Use the TimescaleDB move_chunks feature to move the chunks you need to backfill 
over to the new tablespace

Remove your compression policy
Decompress these chunks

Perform your data backfill into the decompressed chunks
 
Re-enable your compression policy 

Move your updated chunks back to the default tablespace (optional)

Alternatively you can simply serialize the process by decompressing smaller numbers of chunks and processing your data backfill in smaller increments. 


---

 

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
