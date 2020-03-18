# TimescaleDB Release Notes & Future Plans

Interested in what's coming down the pipeline? Review our
Future Plans section. Interested in learning more about
what's already available? Jump down below to see what's
been released.

## Future Plans

As a reminder, TimescaleDB is open-source and you
can view active developments on GitHub at any time.

### What to expect from our next release

The next release of TimescaleDB, v1.7, will include basic
[PostgreSQL 12](https://www.postgresql.org/about/news/1976/)
support and a new TimescaleDB capability called *Real Time Aggregates*.

With Real Time Aggregates, users will be able to leverage TimescaleDB's
precomputed continuous aggregates while still getting a real-time view over the
latest data.

In particular, continous aggregates made it really fast to get aggregate 
answers by precomputing these values (such as the min/max/average value over
each
hour). This way, if you are collecting raw data every second, querying hourly
data over the past week means reading 24 x 7 = 168 values from the database, as
opposed to processing 60 x 60 x 24 x 7 = 604,800 values at query time.  But one
limitation with continous aggregates is that they don't incorporate the very
latest data, _i.e._, since the last time the asynchronous aggregation job ran
inside the database. So if you are generating hourly rollups, you might only
run this job every hour.

But now with Real Time Aggregates, a single, simple query will combine your
pre-computed hourly rollups with the raw data from the last
hour, to always give you an up-to-date answer.  Now, instead of touching
604,800 rows of raw data, the query reads 167 pre-computed rows of
hourly data and 3600 rows of raw secondly data, leading to significant
performance improvements.

We expect to release TimescaleDB v1.7 in the March/April timeframe of 2020.

### Coming down the pipeline

The team is actively working on the multi-node version
of TimescaleDB which is currently in beta. To read more
about our architecture and design for distributed hypertables,
[click here](https://docs.timescale.com/clustering/introduction/architecture#distributed-hypertables).
To test out the beta version for yourself,
follow these [instructions](https://docs.timescale.com/clustering/getting-started/scaling-out).

Currently, we expect this major feature to be released
in the first half of 2020, and we will share more information once
it's available.

## Release Notes

In this section, we will cover historical information on
past releases and how you can learn more.

### 1.6.1 (2020-03-18)

This maintenance release contains bugfixes since the 1.6.0 release. We deem it medium priority 
for upgrading.

In particular the fixes contained in this maintenance release address bugs in continuous aggregates, time_bucket_gapfill, 
partial index handling and drop_chunks.

For this release only, you will need to restart the database after upgrade before restoring a backup.

**Minor Features**
*  #1666 Support drop_chunks API for continuous aggregates
*  #1711 Change log level for continuous aggregate materialization messages

**Bugfixes**
*  #1630 Print notice for COPY TO on hypertable
*  #1648 Drop chunks from materialized hypertable
*  #1668 Cannot add dimension if hypertable has empty chunks
*  #1673 Fix crash when interrupting create_hypertable
*  #1674 Fix time_bucket_gapfill's interaction with GROUP BY
*  #1686 Fix order by queries on compressed hypertables that have char segment by column
*  #1687 Fix issue with disabling compression when foreign keys are present
*  #1688 Handle many BGW jobs better
*  #1698 Add logic to ignore dropped chunks in hypertable_relation_size
*  #1704 Fix bad plan for continuous aggregate materialization
*  #1709 Prevent starting background workers with NOLOGIN
*  #1713 Fix miscellaneous background worker issues
*  #1715 Fix issue with overly aggressive chunk exclusion in outer joins
*  #1719 Fix restoring/scheduler entrypoint to avoid BGW death
*  #1720 Add scheduler cache invalidations
*  #1727 Fix compressing INTERVAL columns
*  #1728 Handle Sort nodes in ConstraintAwareAppend
*  #1730 Fix partial index handling on hypertables
*  #1739 Use release OpenSSL DLLs for debug builds on Windows
*  #1740 Fix invalidation entries from multiple caggs on same hypertable
*  #1743 Fix continuous aggregate materialization timezone handling
*  #1748 Fix remove_drop_chunks_policy for continuous aggregates
*  #1756 Fix handling of dropped chunks in compression background worker

**Thanks**
*  @RJPhillips01 for reporting an issue with drop chunks.
*  @b4eEx for reporting an issue with disabling compression.
*  @darko408 for reporting an issue with order by on compressed hypertables
*  @mrechte for reporting an issue with compressing INTERVAL columns
*  @tstaehli for reporting an issue with ConstraintAwareAppend
*  @chadshowalter for reporting an issue with partial index on hypertables
*  @geoffreybennett for reporting an issue with create_hypertable when interrupting operations
*  @alxndrdude for reporting an issue with background workers during restore
*  @zcavaliero for reporting and fixing an issue with dropped columns in hypertable_relation_size
*  @ismailakpolat for reporting an issue with cagg materialization on hypertables with TIMESTAMP column

### 1.6.0 (2020-01-14)

This release adds major new features and bugfixes since the 1.5.1 release.
We deem it moderate priority for upgrading.

The major new feature in this release allows users to keep the aggregated
data in a continuous aggregate while dropping the raw data with drop_chunks.
This allows users to save storage by keeping only the aggregates.

The semantics of the refresh_lag parameter for continuous aggregates has
been changed to be relative to the current timestamp instead of the maximum
value in the table. This change requires that an integer_now func be set on
hypertables with integer-based time columns to use continuous aggregates on
this table.

We added a timescaledb.ignore_invalidation_older_than parameter for continuous
aggregates. This parameter accept a time-interval (e.g. 1 month). If set,
it limits the amount of time for which to process invalidation. Thus, if
timescaledb.ignore_invalidation_older_than = '1 month', then any modifications
for data older than 1 month from the current timestamp at modification time may
not cause continuous aggregate to be updated. This limits the amount of work
that a backfill can trigger. By default, all invalidations are processed.

For more information on this release, read the [announcement blog](https://blog.timescale.com/blog/timescaledb-1-6-data-retention-policies-for-continuous-aggregates/)
and [blog on downsampling](https://blog.timescale.com/blog/how-to-proactively-manage-long-term-data-storage-with-downsampling/).

**Major Features**
* #1589 Allow drop_chunks while keeping continuous aggregates

**Minor Features**
* #1568 Add ignore_invalidation_older_than option to continuous aggs
* #1575 Reorder group-by clause for continuous aggregates
* #1592 Improve continuous agg user messages

**Bugfixes**
* #1565 Fix partial select query for continuous aggregate
* #1591 Fix locf treat_null_as_missing option
* #1594 Fix error in compression constraint check
* #1603 Add join info to compressed chunk
* #1606 Fix constify params during runtime exclusion
* #1607 Delete compression policy when drop hypertable
* #1608 Add jobs to timescaledb_information.policy_stats
* #1609 Fix bug with parent table in decompression
* #1624 Fix drop_chunks for ApacheOnly
* #1632 Check for NULL before dereferencing variable

**Thanks**
* @optijon for reporting an issue with locf treat_null_as_missing option
* @acarrera42 for reporting an issue with constify params during runtime exclusion
* @ChristopherZellermann for reporting an issue with the compression constraint check
* @SimonDelamare for reporting an issue with joining hypertables with compression

### 1.5.1 (2019-11-12)

This maintenance release contains bugfixes since the 1.5.0 release. We deem it low
priority for upgrading.

In particular the fixes contained in this maintenance release address potential
segfaults and no other security vulnerabilities. The bugfixes are related to bloom
indexes and updates from previous versions.

**Bugfixes**
* #1523 Fix bad SQL updates from previous updates
* #1526 Fix hypertable model
* #1530 Set active snapshots in multi-xact index create

**Thanks**
* @84660320 for reporting an issue with bloom indexes
* @gumshoes @perhamm @jermudgeon @gmisagm for reporting the issue with updates

### 1.5.0 (2019-10-31)

This release adds major new features and bugfixes since the 1.4.2 release.
We deem it moderate priority for upgrading.

This release adds compression as a major new feature.
Multiple type-specific compression options are available in this release
(including DeltaDelta with run-length-encoding for integers and
timestamps; Gorilla compression for floats; dictionary-based compression
for any data type, but specifically for low-cardinality datasets;
and other LZ-based techniques). Individual columns can be compressed with
type-specific compression algorithms as Postgres' native row-based format
are rolled up into columnar-like arrays on a per chunk basis.
The query planner then handles transparent decompression for compressed
chunks at execution time.

This release also adds support for basic data tiering by supporting
the migration of chunks between tablespaces, as well as support for
parallel query coordination to the ChunkAppend node.
Previously ChunkAppend would rely on parallel coordination in the
underlying scans for parallel plans.

For more information on this release, read the [announcement blog](https://blog.timescale.com/blog/building-columnar-compression-in-a-row-oriented-database), this [tutorial](https://docs.timescale.com/latest/tutorials/compression-tutorial),
and the [blog on data tiering](https://blog.timescale.com/blog/optimize-your-storage-costs-with-timescaledbs-data-tiering-functionality/).

**For this release only**, you will need to restart the database before running
`ALTER EXTENSION`

**Major Features**
* #1393 Moving chunks between different tablespaces
* #1433 Make ChunkAppend parallel aware
* #1434 Introducing native compression, multiple compression algorithms, and hybrid row/columnar projections

**Minor Features**
* #1471 Allow setting reloptions on chunks
* #1479 Add next_start option to alter_job_schedule
* #1481 Add last_successful_finish to bgw_job_stats

**Bugfixes**
* #1444 Prevent LIMIT pushdown in JOINs
* #1447 Fix runtime exclusion memory leak
* #1464 Fix ordered append with expressions in ORDER BY clause with space partitioning
* #1476 Fix logic for BGW rescheduling
* #1477 Fix gapfill treat_null_as_missing
* #1493 Prevent recursion in invalidation processing
* #1498 Fix overflow in gapfill's interpolate
* #1499 Fix error for exported_uuid in pg_restore
* #1503 Fix bug with histogram function in parallel

**Thanks**
* @dhyun-obsec for reporting an issue with pg_restore
* @rhaymo for reporting an issue with interpolate
* @optijon for reporting an issue with locf treat_null_as_missing
* @favnee for reporting an issue with runtime exclusion
* @Lectem for reporting an issue with histograms
* @rogerdwan for reporting an issue with BGW rescheduling
* @od0 for reporting an issue with alter_job_schedule

### 1.4.2 (2019-09-11)

This maintenance release contains bugfixes since the 1.4.1 release. We deem it medium
priority for upgrading.

In particular the fixes contained in this maintenance release address 2 potential
segfaults and no other security vulnerabilities. The bugfixes are related to
background workers, OUTER JOINs, ordered append on space partitioned hypertables
and expression indexes.

**Bugfixes**
* #1327 Fix chunk exclusion with ordered append
* #1390 Fix deletes of background workers while a job is running
* #1392 Fix cagg_agg_validate expression handling (segfault)
* #1408 Fix ChunkAppend space partitioning support for ordered append
* #1420 Fix OUTER JOIN qual propagation
* #1422 Fix background worker error handling (segfault)
* #1424 Fix ChunkAppend LIMIT pushdown
* #1429 Fix expression index creation

**Thanks**
* @shahidhk for reporting an issue with OUTER JOINs
* @cossbow and @xxGL1TCHxx for reporting reporting issues with ChunkAppend and space partitioning
* @est for reporting an issue with CASE expressions in continuous aggregates
* @devlucasc for reporting the issue with deleting a background worker while a job is running
* @ryan-shaw for reporting an issue with expression indexes on hypertables with dropped columns

### 1.4.1 (2019-08-01)

This maintenance release contains bugfixes since the 1.4.0 release. We deem it medium
priority for upgrading.

In particular the fixes contained in this maintenance release address 2 potential
segfaults and no other security vulnerabilities. The bugfixes are related to queries
with prepared statements, PL/pgSQL functions and interoperability with other extensions.
More details below.

**Bugfixes**
* #1362 Fix ConstraintAwareAppend subquery exclusion
* #1363 Mark drop_chunks as VOLATILE and not PARALLEL SAFE
* #1369 Fix ChunkAppend with prepared statements
* #1373 Only allow PARAM_EXTERN as time_bucket_gapfill arguments
* #1380 Handle Result nodes gracefully in ChunkAppend

**Thanks**
* @overhacked for reporting an issue with drop_chunks and parallel queries
* @fvannee for reporting an issue with ConstraintAwareAppend and subqueries
* @rrb3942 for reporting a segfault with ChunkAppend and prepared statements
* @mchesser for reporting a segfault with time_bucket_gapfill and subqueries
* @lolizeppelin for reporting and helping debug an issue with ChunkAppend and Result nodes

### 1.4.0 (2019-07-18)

This release contains major new functionality for continuous aggregates
and adds performance improvements for analytical queries.

In version 1.3.0 we added support for continuous aggregates which
was initially limited to one continuous aggregate per hypertable.
With this release, we remove this restriction and allow multiple
continuous aggregates per hypertable.

This release adds a new custom node ChunkAppend that can perform
execution time constraint exclusion and is also used for ordered
append. Ordered append no longer requires a LIMIT clause and now
supports space partitioning and ordering by time_bucket.

For more information on this release, read the [announcement blog](https://blog.timescale.com/blog/timescaledb-1-4-introduces-better-performance-for-time-series-analytics/), [blog on implementing
constraint exclusion](https://blog.timescale.com/blog/implementing-constraint-exclusion-for-faster-query-performance/),
and [blog on using OrderedAppend](https://blog.timescale.com/blog/ordered-append-an-optimization-for-range-partitioning/).

**Major features**
* #1270 Use ChunkAppend to replace Append nodes
* #1257 Support for multiple continuous aggregates

**Minor features**
* #1181 Remove LIMIT clause restriction from ordered append
* #1273 Propagate quals to joined hypertables
* #1317 Support time bucket functions in Ordered Append
* #1331 Add warning message for REFRESH MATERIALIZED VIEW
* #1332 Add job statistics columns to timescaledb_information.continuous_aggregate_stats view
* #1326 Add architecture and bit size to telemetry

**Bugfixes**
* #1288 Do not remove Result nodes with one-time filter
* #1300 Fix telemetry report return value
* #1339 Fix continuous agg catalog table insert failure
* #1344 Update continuous agg bgw job start time

**Thanks**
* @ik9999 for reporting a bug with continuous aggregates and negative refresh lag

### 1.3.2 (2019-06-24)

This maintenance release contains bug and security fixes since the 1.3.1 release. We deem it moderate-to-high priority for upgrading.

This release fixes some security vulnerabilities, specifically related to being able to elevate role-based permissions by database users that already have access to the database.  We strongly recommend that users who rely on role-based permissions upgrade to this release as soon as possible.

**Security Fixes**
* #1311 Fix role-based permission checking logic

**Bugfixes**
* #1315 Fix potentially lost invalidations in continuous aggs
* #1303 Fix handling of types with custom time partitioning
* #1299 Arm32: Fix Datum to int cast issue
* #1297 Arm32: Fix crashes due to long handling
* #1019 Add ARM32 tests on travis

**Thanks**
* @hedayat for reporting the error with handling of types with custom time partitioning

### 1.3.1 (2019-06-10)

This maintenance release contains bugfixes since the 1.3.0 release.
We deem it low-to-moderate priority for upgrading.

In particular, the fixes contained in this maintenance release do not address any
security vulnerabilities, while the only one affecting system stability is related
to TimescaleDB running on PostgreSQL 11. More details below.

**Bugfixes**
* #1220 Fix detecting JOINs for continuous aggs
* #1221 Fix segfault in VACUUM on PG11
* #1228 ARM32 Fix: Pass int64 using Int64GetDatum when a Datum is required
* #1232 Allow Param as time_bucket_gapfill arguments
* #1236 Stop preventing REFRESH in transaction blocks
* #1283 Fix constraint exclusion for OUTER JOIN

**Thanks**
* @od0 for reporting an error with continuous aggs and JOINs
* @rickbatka for reporting an error when using time_bucket_gapfill in functions
* @OneMoreSec for reporting the bug with VACUUM
* @dvdrozdov @od0 @t0k4rt for reporting the issue with REFRESH in transaction blocks
* @mhagander and @devrimgunduz for suggesting adding a CMAKE flag to control the default telemetry level

### 1.3.0 (2019-05-06)

This release contains major new functionality that we call continuous aggregates.

Aggregate queries which touch large swathes of time-series data can take a long
time to compute because the system needs to scan large amounts of data on every
query execution. Our continuous aggregates continuously calculate the
results of a query in the background and materialize the results. Queries to the
continuous aggregate view are then significantly faster as they do not need to
touch the raw data in the hypertable, instead using the pre-computed aggregates
in the view.

Continuous aggregates are somewhat similar to PostgreSQL materialized
views, but unlike a materialized view, continuous
aggregates do not need to be refreshed manually; the view will be refreshed
automatically in the background as new data is added, or old data is
modified. Additionally, it does not need to re-calculate all of the data on
every refresh. Only new and/or invalidated data will be calculated.  Since this
re-aggregation is automatic, it doesn’t add any maintenance burden to your
database.

Our continuous aggregate approach supports high-ingest rates by avoiding the
high-write amplification associated with trigger-based approaches. Instead,
we use invalidation techniques to track what data has changed, and then correct
the materialized aggregate the next time that the automated process executes.

For more information on this release, read our [blog on continuous aggregates](https://blog.timescale.com/blog/continuous-aggregates-faster-queries-with-automatically-maintained-materialized-views/),
[our docs overview](http://docs.timescale.com/using-timescaledb/continuous-aggregates),
and visit this [tutorial](http://docs.timescale.com/tutorials/continuous-aggs-tutorial).

**Major Features**
* #1184 Add continuous aggregate functionality

**Minor Features**
* #1005 Enable creating indexes with one transaction per chunk
* #1007 Remove hypertable parent from query plans
* #1038 Infer time_bucket_gapfill arguments from WHERE clause
* #1062 Make constraint aware append parallel safe
* #1067 Add treat_null_as_missing option to locf
* #1112 Add support for window functions to gapfill
* #1130 Add support for cross datatype chunk exclusion for time types
* #1134 Add support for partitionwise aggregation
* #1153 Add time_bucket support to chunk exclusion
* #1170 Add functions for turning restoring on/off and setting license key
* #1177 Add transformed time_bucket comparison to quals
* #1182 Enable optimizing SELECTs within INSERTs
* #1201 Add telemetry for policies: drop_chunk & reorder

**Bugfixes**
* #1010 Add session locks to CLUSTER
* #1115 Fix ordered append optimization for join queries
* #1123 Fix gapfill with prepared statements
* #1125 Fix column handling for columns derived from GROUP BY columns
* #1132 Adjust ordered append path cost
* #1155 Limit initial max_open_chunks_per_insert to PG_INT16_MAX
* #1167 Fix postgres.conf ApacheOnly license
* #1183 Handle NULL in a check constraint name
* #1195 Fix cascade in scheduled drop chunks
* #1196 Fix UPSERT with prepared statements

**Thanks**
* @spickman for reporting a segfault with ordered append and JOINs
* @comicfans for reporting a performance regression with ordered append
* @Specter-Y for reporting a segfault with UPSERT and prepared statements
* @erthalion submitting a bugfix for a segfault with validating check constraints

### 1.2.2 (2019-03-14)

This release contains bugfixes.

**Bugfixes**
* #1097 Adjust ordered append plan cost
* #1079 Stop background worker on ALTER DATABASE SET TABLESPACE and CREATE DATABASE WITH TEMPLATE
* #1088 Fix ON CONFLICT when using prepared statements and functions
* #1089 Fix compatibility with extensions that define planner_hook
* #1057 Fix chunk exclusion constraint type inference
* #1060 Fix sort_transform optimization

**Thanks**
* @esatterwhite for reporting a bug when using timescaledb with zombodb
* @eeeebbbbrrrr for fixing compatibility with extensions that also define planner_hook
* @naquad for reporting a segfault when using ON conflict in stored procedures
* @aaronkaplan for reporting an issue with ALTER DATABASE SET TABLESPACE
* @quetz for reporting an issue with CREATE DATABASE WITH TEMPLATE
* @nbouscal for reporting an issue with ordered append resulting in bad plans

### 1.2.1 (2019-02-11)

This release contains bugfixes.

**Notable commits**
* [2f6b58a] Fix tlist on hypertable inserts inside CTEs
* [7973b4a] Stop background worker on rename database
* [32cc645] Fix loading the tsl license in parallel workers

**Thanks**

* @jamessewell for reporting and helping debug a segfault in last() [034a0b0]
* @piscopoc for reporting a segfault in time_bucket_gapfill [e6c68f8]

### 1.2.0 (2019-01-29)

**This is our first release to include Timescale-Licensed features, in addition to new Apache-2 capabilities.**

We are excited to be introducing new time-series analytical functions, advanced data lifecycle management capabilities, and improved performance.
- **Time-series analytical functions**: Users can now use our `time_bucket_gapfill` function, to write complex gapfilling, last object carried forward, and interpolation queries.
- **Advanced data lifecycle management**: We are introducing scheduled policies, which use our background worker framework to manage time-series data. In this release, we support scheduled `drop_chunks` and `reorder`.
- **Improved performance**: We added support for ordered appends, which optimize a large range of queries - particularly those that are ordered by time and contain a LIMIT clause. Please note that ordered appends do not support ordering by `time_bucket` at this time.
- **Postgres 11 Support**: We added beta support for PG11 in 1.1.0. We're happy to announce that our PG11 support is now out of beta, and fully supported.

This release adds code under a new license, LICENSE_TIMESCALE. This code can be found in `tsl`.

**For this release only**, you will need to restart the database before running
`ALTER EXTENSION`

**Notable commits**

* [a531733] switch cis state when we switch chunks
* [5c6b619] Make a copy of the ri_onConflict object in PG11
* [61e524e] Make slot for upserts be update for every chunk switch
* [8a7c127] Fix for ExecSlotDescriptor during upserts
* [fa61613] Change time_bucket_gapfill argument names
* [01be394] Fix bgw_launcher restart when failing during launcher setup
* [7b3929e] Add ordered append optimization
* [a69f84c] Fix signal processing in background workers
* [47b5b7d] Log which chunks are dropped by background workers
* [4e1e15f] Add reorder command
* [2e4bb5d] Recluster and drop chunks scheduling code
* [ef43e52] Add alter_policy_schedule API function
* [5ba740e] Add gapfill query support
* [be7c74c] Add logic for automatic DB maintenance functions
* [4ff6ac7] Initial Timescale-Licensed-Module and License-Key Implementation
* [fc42539] Add new top-level licensing information
* [31e9c5b] Fix time column handling in get_create_command
* [1b8ceca] Avoid loading twice in parallel workers and load only from $libdir
* [76d7875] Don't throw errors when extension is loaded but not installed yet
* [eecd845] Add Timescale License (TSL)
* [4b42b30] Free ChunkInsertStates when the es_per_tuple_exprcontext is freed

**Thanks**

* @fordred for reporting our docker-run.sh script was out of date
* @JpWebster for reporting a deadlock between reads an drop_chunks
* @chickenburgers for reporting an issue with our CMake
* Dimtrj and Asbjørn D., on slack, for creating a reproducible testcase for an UPSERT bug
* @skebanga for reporting a loader bug

For more information on this release, read the [blog announcement](https://blog.timescale.com/blog/timescaledb-1-2-analytical-functions-advanced-data-lifecycle-management-improved-performance/) and
[blog on using `time_bucket_gapfill`, `interpolate`, and `locf`](https://blog.timescale.com/blog/sql-functions-for-time-series-analysis/).

### 1.1.1 (2018-12-20)

This release contains bugfixes.

**High-level changes**
* Fix issue when upgrading with pg_upgrade
* Fix a segfault that sometimes appeared in long COPYs
* Other bug and stability fixes

**Notable commits**

* [f99b540] Avoid loading twice in parallel workers and load only from $libdir
* [e310f7d] Don't throw errors when extension is loaded but not installed yet
* [8498416] Free ChunkInsertStates when the es_per_tuple_exprcontext is freed
* [937eefe] Set C standard to C11

**Thanks**

* @costigator for reporting the pg_upgrade bug
* @FireAndIce68 for reporting the parallel workers issue
* @damirda for reporting the copy bug

### 1.1.0 (2018-12-13)

Our 1.1 release introduces beta support for PG 11, as well as several performance optimizations aimed at improving chunk exclusion for read queries. We are also packaging our new timescale-tune tool (currently in beta) with our Debian and Linux releases. If you encounter any issues with our beta features, please file a GitHub issue.

**Potential breaking changes**
- In addition to optimizing first() / last() to utilize indices for non-group-by queries, we adjusted its sorting behavior to match that of PostgreSQL’s max() and min() functions. Previously, if the column being sorted had NULL values, a NULL would be returned. First() and last() now instead ignore NULL values.

**Notable Commits**

* [71f3a0c] Fix Datum conversion issues
* [5aa1eda] Refactor compatibility functions and code to support PG11
* [e4a4f8e] Add support for functions on open (time) dimensions
* [ed5067c] Fix interval_from_now_to_internal timestamptz handling
* [019971c] Optimize FIRST/LAST aggregate functions
* [83014ee] Implement drop_chunks in C
* [9a34028] Implement show_chunks in C and have drop_chunks use it
* [d461959] Add view to show hypertable information
* [35dee48] Remove version-checking from client-side
* [5b6a5f4] Change size utility and job functions to STRICT
* [7e55d91] Add checks for NULL arguments to DDL functions
* [c1db608] Fix upsert TLE translation when mapping variable numbers
* [55a378e] Check extension exists for DROP OWNED and DROP EXTENSION
* [0c8c085] Exclude unneeded chunks for IN/ANY/ALL operators
* [f27c0a3] Move int time_bucket functions with offset to C

**Thanks**
* @did-g for some memory improvements

### 1.0.1 (2018-12-05)

This commit contains bugfixes and optimizations for 1.0.0

**Notable commits**

* [6553aa4] Make a number of size utility functions to `STRICT`
* [bb1d748] Add checks for NULL arguments to `set_adaptive_chunking`, `set_number_partitions`, `set_chunk_time_interval`, `add_dimension`, and `create_hypertable`
* [a534ed4] Fix upsert TLE translation when mapping variable numbers
* [aecd55b] Check extension exists for DROP OWNED and DROP EXTENSION

### 1.0.0 (2018-10-30)

**This is our 1.0 release!**

For notable commits between 0.12.0/0.12.1 and this final 1.0 release, please see previous entries for the release candidates (rc1, rc2, and rc3).

**Thanks**
To all the external contributors who helped us debug the release candidates, as well as anyone who has contributed bug reports, PRs, or feedback on Slack, GitHub, and other channels. All input has been valuable and helped us create the product we have today!

**Potential breaking changes**
* To better align with the ISO standard so that time bucketing starts each week by default on a Monday (rather than Saturday), the `time_bucket` epoch/origin has been changed from January 1, 2000 to January 3, 2000.  The function now includes an `origin` parameter that can be used to adjust this.
* Error codes are now prefixed with `TS` instead of the prior `IO` prefix. If you were checking for these error codes by name, please update your code.

For more information on this release, read the [blog announcement](https://blog.timescale.com/blog/1-0-enterprise-production-ready-time-series-database-open-source-d32395a10cbf/).


**For releases prior to 1.0, please visit the [changelog](https://github.com/timescale/timescaledb/blob/master/CHANGELOG.md).**
