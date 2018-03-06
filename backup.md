# Backup & Restore [](backup)

## Using `pg_dump` and `pg_restore` [](pg_dump-pg_restore)

In this section, we cover how to backup and restore an entire
database or individual hypertables using the native PostgreSQL
[`pg_dump`][pg_dump] and [`pg_restore`][pg_restore] commands.

>ttt Upgrades between different versions of TimescaleDB can be done in place;
 you don't need to backup/restore your data.
 Follow these [updating instructions][].

<!-- -->
>vvv You must use `pg_dump` and `pg_restore` versions 9.6.2 and above.

### Entire database

To backup a database named _tutorial_, run from the command line:

```bash
pg_dump -Fc -f tutorial.bak tutorial
```

Restoring data from a backup currently requires some additional procedures,
which need to be run from `psql`:
```sql
CREATE DATABASE tutorial;
ALTER DATABASE tutorial SET timescaledb.restoring='on';

-- execute the restore (or from a shell)
\! pg_restore -Fc -d tutorial tutorial.bak

-- connect to the restored db
\c tutorial
ALTER DATABASE tutorial SET timescaledb.restoring='off';
```

>vvv PostgreSQL's `pg_dump` does not currently specify the *version* of
 the extension in its backup, which leads to problems if you are
 restoring into a database instance with a more recent extension
 version installed.  (In particular, the backup could be for some
 version 0.4, but then the `CREATE EXTENSION timescaledb` command just
 installs the latest (say, 0.5), and thus does not have the
 opportunity to run our upgrade scripts.)  We are looking into
 submitting a fix for `pg_dump`.
>
>The workaround is that when restoring from a backup, you need to
 restore to a PostgreSQL instance with the same extension version
 installed, and *then* upgrade the version.

<!-- -->
>vvv These instructions do not work if you use flags to selectively
 choose tables (`-t`) or schemas (`--schema`), and so cannot be used
 to backup only an individual hypertable.  In particular, even if you
 explicitly specify both the hypertable and all of its constituent
 chunks, this dump would still lack necessary information that
 TimescaleDB stores in the database catalog about the relation between
 these tables.
>
>You can, however, explicitly *exclude* tables from this whole
 database backup (`-T`), as well as continue to selectively backup
 plain tables (i.e., non-hypertable) as well.

### Individual hypertables

Below is the procedure for performing a backup and restore of hypertable `conditions`.

#### Backup

Backup the hypertable schema:
```bash
pg_dump -s -d old_db --table conditions -N _timescaledb_internal | \
  grep -v _timescaledb_internal > schema.sql
```

Backup the hypertable data to a CSV file.
```bash
psql -d old_db \
-c "\COPY (SELECT * FROM conditions) TO data.csv DELIMITER ',' CSV"
```

#### Restore
Restore the schema:
```bash
psql -d new_db < schema.sql
```

Recreate the hypertables:
```bash
psql -d new_db -c "SELECT create_hypertable('conditions', 'time')"
```

>ttt The parameters to `create_hypertable` do not need to be
the same as in the old db, so this is a good way to re-organize
your hypertables (e.g., change partitioning key, number of
partitions, chunk interval sizes, etc.).

Restore the data:
```bash
psql -d new_db -c "\COPY conditions FROM data.csv CSV"
```

>ttt The standard `COPY` command in PostgreSQL is single threaded.
 So to speed up importing larger amounts of data, we recommend using
 our [parallel importer][] instead.

## Using Docker & WAL-E [](docker-wale)

If you're using TimescaleDB in a containerized environment, we provide
images that allow you hook your TimescaleDB container with a WAL-E
"sidecar" container (i.e., a container that runs alongside the main
container). Our [official Docker image][docker image] supports this
functionality, and we provide a reference implementation of the
[WAL-E sidecar image][wale image].

To get started, you'll first need to start up your Docker TimescaleDB
database regularly to have it create the necessary directories for
PostgreSQL:
```bash
docker run​ \
    -v /host/path/to/wal:/data/wal \
    -v /host/path/to/data:/var/lib/postgresql/data \
    -e PGWAL=/data/wal \
    -e PGDATA=/var/lib/postgresql/data/pgdata \
    ...  # other flags/arguments
    timescale/timescaledb:latest-pg9.6
```
>ttt You can change the tag from `latest-pg9.6` to the one that best
suits you, including `latest-pg10` for PostgreSQL 10.

The values for `PGWAL` and `PGDATA` are up to you for your setup;  
remember these values since the WAL-E sidecar needs to know them
(and share access to the directories) in order to coordinate the backups.

### Backup [](docker-wale-backup)

#### TimescaleDB container

Once PostgreSQL starts up, you'll need to stop the container and restart
with WAL-E support enabled:
```bash
docker run​ \
    -v /host/path/to/wal:/data/wal \
    -v /host/path/to/data:/var/lib/postgresql/data \
    -e PGWAL=/data/wal \
    -e PGDATA=/var/lib/postgresql/data/pgdata \
    -e USE_WALE_SIDECAR=true \
    ...  # other docker flags
    timescale/timescaledb:latest-pg9.6 postgres \
    -cwal_level=archive \
    -carchive_mode=on \
    -carchive_command="/usr/bin/wget localhost:5000/wal-push/%f -O -" \
    -carchive_timeout=600 \
    -ccheckpoint_timeout=700 \
    -cmax_wal_senders=1 \
    ...  # other flags/arguments
```

This new environment variable `USE_WALE_SIDECAR` tells the container to
look for and use the WAL-E sidecar. This flag causes a
a synchronization file called `wale_init_lockfile` to be created
in `PGDATA`. The WAL-E sidecar, upon starting, needs to remove this file
so the database can start (i.e., TimescaleDB blocks on startup until
the file is gone). The `-c` flags are needed to tell the container how
to properly archive the WAL.


#### WAL-E sidecar

You can use our [reference implementation of the WAL-E sidecar][wale image]
and follow the instructions on [its Github][wale github] for more
advanced usage. This implementation creates a small REST HTTP server
to handle archiving and restoring. It needs to know the same location of
`PGWAL` and `PGDATA` as the TimescaleDB container. To launch:
```bash
docker run​ \
    -v /host/path/to/wal:/data/wal \
    -v /host/path/to/data:/var/lib/postgresql/data \
    -e START_MODE=BACKUP_PUSH \
    -e PGWAL=/data/wal \
    -e PGDATA=/var/lib/postgresql/data/pgdata \
    ...  # other flags/arguments
    timescale/timescaledb-wale:latest
```

You will likely need other environmental variables set based on where
you store your WAL-E backups (e.g., AWS S3);
see [WAL-E's documentation][wale official] for more details.
To do the initial base backup, run the `backup_push.sh`
script in the container:
```bash
docker exec timescaledb-wale ./backup_push.sh
```

Afterwards, a base backup will occur once a day, unless you change it
via setting `CRON_TIMING` (see our [WAL-E Github][wale github] for
more info). WAL backups will be handled by the TimescaleDB container
running the given `archive_command`, which communicates via HTTP with
the WAL-E sidecar.

### Restore [](docker-wale-restore)

The restoration process is very similar to the backup process. First
you'll need to setup an empty TimescaleDB/PostgreSQL instance without
WAL-E sidecar behavior enabled ([see above](#docker-wale)).

#### TimescaleDB container
After setting up the empty instance, stop the container. Now,
restart the TimescaleDB container like so:
```bash
docker run​ \
    -v /host/path/to/wal:/data/wal \
    -v /host/path/to/data:/var/lib/postgresql/data \
    -e PGWAL=/data/wal \
    -e PGDATA=/var/lib/postgresql/data/pgdata \
    -e USE_WALE_SIDECAR=true \
    ...  # other docker flags
    timescale/timescaledb:latest-pg9.6 postgres \
    -cwal_level=archive \
    -carchive_mode=on \
    -carchive_command="/usr/bin/wget localhost:5000/wal-push/%f -O -" \
    -crestore_command="/usr/bin/wget localhost:5000/wal-fetch/%f -O -" \
    -carchive_timeout=600 \
    -ccheckpoint_timeout=700 \
    -cmax_wal_senders=1 \
    ...  # other flags/arguments
```

Note the addition of the `-crestore_command` flag compared to backup;
this tells PostgreSQL how to restore properly.

#### WAL-E sidecar

Setup is similar to backup, except this time `START_MODE` is set to
`RESTORE`:
```bash
docker run​ \
    -v /host/path/to/wal:/data/wal \
    -v /host/path/to/data:/var/lib/postgresql/data \
    -e START_MODE=RESTORE \
    -e PGWAL=/data/wal \
    -e PGDATA=/var/lib/postgresql/data/pgdata \
    ...  # other flags/arguments
    timescale/timescaledb-wale:latest
```

Again you'll need to consult the [WAL-E documentation][wale official] for
variables you need to set to access, e.g., your AWS S3 bucket.

Once restored, you'll want to restart the containers using the backup
instructions so that they can start creating a new backup.

[updating instructions]: /api/update-db
[pg_dump]: https://www.postgresql.org/docs/current/static/app-pgdump.html
[pg_restore]: https://www.postgresql.org/docs/current/static/app-pgrestore.html
[parallel importer]: https://github.com/timescale/timescaledb-parallel-copy
[docker image]: https://hub.docker.com/r/timescale/timescaledb
[wale image]: https://hub.docker.com/r/timescale/timescaledb-wale
[wale github]: https://github.com/timescale/timescaledb-wale
[wale official]: https://github.com/wal-e/wal-e
