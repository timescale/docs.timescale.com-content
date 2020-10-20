# Updating TimescaleDB 1.x [](update)

Use these instructions to update TimescaleDB within the 1.x version.

>:TIP:TimescaleDB 2.0 is currently available as a release candidate and we encourage
>users to upgrade in testing environments to gain experience and provide feedback on 
>new and updated features.
>
>See [Changes in TimescaleDB 2.0]() for more information and links to installation 
>instructions

### TimescaleDB Release Compatibility

TimescaleDB 1.x is currently supported by the following PostgreSQL releases.

 TimescaleDB Release |   Supported PostgreSQL Release
 --------------------|-------------------------------
 1.3 - 1.7.4         | 9.6, 10, 11, 12

If you need to upgrade PostgreSQL first, please see [our documentation][upgrade-pg].

### Update TimescaleDB

Software upgrades use PostgreSQL's `ALTER EXTENSION` support to update to the
latest version. TimescaleDB supports having different extension
versions on different databases within the same PostgreSQL instance. This
allows you to update extensions independently on different databases. The
upgrade process involves three-steps:

1. We recommend that you perform a [backup][] of your database via `pg_dump`.
1. [Install][] the latest version of the TimescaleDB extension.
1. Execute the following `psql` command inside any database that you want to
   update:

```sql
ALTER EXTENSION timescaledb UPDATE;
```

>:WARNING: When executing `ALTER EXTENSION`, you should connect using `psql`
with the `-X` flag to prevent any `.psqlrc` commands from accidentally
triggering the load of a previous TimescaleDB version on session startup. 
It must also be the first command you execute in the session. 
<!-- -->

This will upgrade TimescaleDB to the latest installed version, even if you
are several versions behind.

After executing the command, the psql `\dx` command should show the latest version:

```sql
\dx timescaledb

    Name     | Version |   Schema   |                             Description
-------------+---------+------------+---------------------------------------------------------------------
 timescaledb | x.y.z   | public     | Enables scalable inserts and complex queries for time-series data
(1 row)
```


[upgrade-pg]: /update-timescaledb/upgrade-pg
[update-tsdb-1]: /update-timescaledb/update-db-1
[update-tsdb-2]: https://docs.timescale.com/v2.0/update-timescaledb/update-db-2
[pg_upgrade]: https://www.postgresql.org/docs/current/static/pgupgrade.html
[backup]: /using-timescaledb/backup
[Install]: /getting-started/installation
[telemetry]: /using-timescaledb/telemetry
[volumes]: https://docs.docker.com/engine/admin/volumes/volumes/
[bind-mounts]: https://docs.docker.com/engine/admin/volumes/bind-mounts/
[changes-in-ts2]: https://docs.timescale.com/v2.0/release-notes/changes-in-timescaledb-2.md
