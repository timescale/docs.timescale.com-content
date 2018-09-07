# Configuring TimescaleDB

TimescaleDB works with the default PostgreSQL server configuration settings.
However, we find that optimizing some settings increases performance. These
settings can be adjusted in your machine's `postgresql.conf`.

>:TIP: You can determine the location of `postgresql.conf` by running `SHOW config_file;`
from within psql.

## Memory settings [](memory)

The settings `shared_buffers`, `effective_cache_size`, `work_mem`, and
`maintenance_work_mem` need to be adjusted to match the machine's available
memory.  We suggest getting the configuration values from the [PgTune][pgtune]
website (suggested DB Type: Data warehouse). You should also adjust the
`max_connections` setting to match the ones given by PgTune since there is a
connection between `max_connections` and memory settings. Other settings from
PgTune may also be helpful.

## Worker settings [](workers)

PostgreSQL utilizes worker pools to provide the required workers needed to support
both live queries and background jobs. If you do not configure these settings,
you may observe performance degradation on both queries and background jobs.

TimescaleDB background workers are configured using the `timescaledb.max_background_workers`
setting. You should configure this setting to the sum of your total number of databases and the
total number of concurrent background workers you want running at any given point in time.
You need a background worker allocated to each database to run a lightweight scheduler
that schedules jobs. On top of that, any additional workers you allocate here will run
background jobs when needed.

For larger queries, PostgreSQL automatically uses parallel workers if they are available.
To configure this, use the `max_parallel_workers` setting. Increasing this setting will
improve query performance for larger queries. Smaller queries may not trigger parallel
workers.

Finally, you must configure `max_worker_processes` to be at least the sum of `timescaledb.max_background_workers` and `max_parallel_workers`. `max_worker_processes` is the
total pool of workers available to both background and parallel workers (as well as a handful of
built-in PostgreSQL workers).

## Disk-write settings [](disk-write)

In order to increase write throughput, there are [multiple
settings][async-commit] to adjust the behaviour that PostgreSQL uses to write data
to disk. We find the performance to be good with the default (safest) settings. If
you want a bit of additional performance, you can  set `synchronous_commit =
'off'`([PostgreSQL docs][synchronous-commit]). Please note that when disabling
`sychronous_commit` in this way, an operating system or database crash might
result in some recent allegedly-committed transactions being lost. We actively
discourage changing the `fsync` setting.

## Lock settings [](locks)

TimescaleDB relies heavily on table partitioning for scaling
time-series workloads, which has implications for [lock
management][lock-management]. A hypertable needs to acquire locks on
many chunks (sub-tables) during queries, which can exhaust the default
limits for the number of allowed locks held. This might result in a
warning like follows:

```sql
psql: FATAL:  out of shared memory
HINT:  You might need to increase max_locks_per_transaction.
```

To avoid this issue, it is necessary to increase the
`max_locks_per_transaction` setting from the default value (which is
typically 64). Since changing this parameter requires a database
restart, it is advisable to estimate a good setting that also allows
some growth. For most use cases we recommend the following setting:

```
max_locks_per_transaction = 2 * num_chunks
```

where `num_chunks` is the maximum number of chunks you expect to have in a hypertable.
This setting takes into account that the number of locks taken by a hypertable query
is roughly equal to the
number of chunks in the hypertable, or double that number if the query
also uses an index. You can see how many chunks you currently have using the
`chunk_relation_size_pretty()` ([chunk_relation_size_pretty][]) command.
 Also note that `max_locks_per_transaction` is not
an exact setting; it only controls the *average* number of object
locks allocated for each transaction. For more information, please
review the official PostgreSQL documentation on
[lock management][lock-management].

## Changing configuration with Docker

When running TimescaleDB via a [Docker container][docker], there are
two approaches to modifying your PostgreSQL configuration.  In the
following example, we modify the size of the database instance's
write-ahead-log (WAL) from 1GB to 2GB in a Docker container named
`timescaledb`.

### Modifying postgres.conf inside Docker

1. Get into a shell in Docker in order to change the configuration on a running container.
```
docker start timescaledb
docker exec -i -t timescaledb /bin/bash
```

2. Edit and then save the config file, modifying the setting for the desired configuration parameter (e.g., `max_wal_size`).
```
vi /var/lib/postgresql/data/postgresql.conf
```

3. Restart the container so the config gets reloaded.
```
docker restart timescaledb
```

4. Test to see if the change worked.
```
    docker exec -it timescaledb psql -U postgres

    postgres=# show max_wal_size;
     max_wal_size
    --------------
    2GB
```

### Specify config parameters as boot options

Alternatively, one or more parameters can be passed in to the `docker run` command via a `-c` option, as in the following.

```
docker run -i -t timescale/timescaledb:latest-pg10 postgres -cmax_wal_size=2GB
```

Additional examples of passing in arguments at boot can be found in our [discussion about using WAL-E][wale] for incremental backup.

[pgtune]: http://pgtune.leopard.in.ua/
[async-commit]: https://www.postgresql.org/docs/current/static/wal-async-commit.html
[synchronous-commit]: https://www.postgresql.org/docs/current/static/runtime-config-wal.html#GUC-SYNCHRONOUS-COMMIT
[lock-management]: https://www.postgresql.org/docs/current/static/runtime-config-locks.html
[docker]: /getting-started/installation/linux/installation-docker
[wale]: /using-timescaledb/backup#docker-wale
[chunk_relation_size_pretty]: /api#chunk_relation_size_pretty
