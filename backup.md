## Backup & Restore <a id="backup"></a>

In this section, we cover how to backup and restore an entire
database or individual hypertables using the native PostgreSQL
`pg_dump` ([PostgreSQL docs][pg_dump]) and `pg_restore`
([PostgreSQL docs][pg_restore]) commands.

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
SELECT restore_timescaledb();
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

>The workaround is that when restoring from a backup, you need to
 restore to a PostgreSQL instance with the same extension version
 installed, and *then* upgrade the version.


>vvv These instructions do not work if you use flags to selectively
 choose tables (`-t`) or schemas (`--schema`), and so cannot be used
 to backup only an individual hypertable.  In particular, even if you
 explicitly specify both the hypertable and all of its constituent
 chunks, this dump would still lack necessary information that
 TimescaleDB stores in the database catalog about the relation between
 these tables.

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

[updating instructions]:/api/update-db
[pg_dump]:https://www.postgresql.org/docs/current/static/app-pgdump.html
[pg_restore]:https://www.postgresql.org/docs/current/static/app-pgrestore.html
[parallel importer]: https://github.com/timescale/timescaledb-parallel-copy
