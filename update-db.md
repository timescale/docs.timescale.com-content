# Updating software versions <a id="update"></a>

This section describes how to upgrade between different versions of
TimescaleDB.  Since version 0.1, TimescaleDB supports **in-place updates**:
you don't need to dump and restore your data, and versions are published with
automated migration scripts that converts any internal state if necessary.

### Using ALTER EXTENSION

Software upgrades use PostgreSQL's `ALTER EXTENSION` support
to update to the latest version.  It's a four-step process:

1. Optionally, perform a [backup][] of your database via `pg_dump`.
1. [Install][] the latest version of the TimescaleDB extension.
1. Restart PostgreSQL in order to load the updated extension library.
1. Execute the following `psql` command:

```sql
ALTER EXTENSION timescaledb UPDATE;
```

This will upgrade TimescaleDB to the latest installed version, even if you
are several versions behind. For example, if you install 0.5 but currently
have 0.4.1 running, the above command will first upgrade to 0.4.2 then to 0.5.

After executing the command, the psql `\dx` command should show the latest version:

```sql
\dx timescaledb

    Name     | Version |   Schema   |                             Description
-------------+---------+------------+---------------------------------------------------------------------
 timescaledb | 0.5.0   | public     | Enables scalable inserts and complex queries for time-series data
(1 row)
```

These steps must be followed in the above order.  If you forget to
restart PostgreSQL after installing the latest version,
the running instance does not load the newly updated library
(`timescaledb.so`).  On the flip side, if you forget to
run `ALTER` on the database after restarting, the installed SQL
API for that database will expect the old .so library,
as opposed to the new one.  Both scenarios will lead to a
mismatch likely to cause errors.

Remember that restarting PostgreSQL is accomplished via different
commands on different platforms:

- Linux services: `sudo service postgresql restart`
- Mac brew: `brew services restart postgresql`
- Docker: see below

>vvv Some of these restart services will actually execute status
 commands on the database instance after restarting them
 (e.g., `services` calls `pg_isready`).  This may output an error due to
 this aforementioned library/SQL mismatch, and cause the restart command
 to state that it failed.  But, you can check and see that
 the `postgres` instance is actually running.  If you then go ahead and
 execute the `ALTER EXTENSION` command via `psql`, this issue will go away
 and the upgrade will succeed.  We're working on eliminating this issue.

<!-- -->
>vvv If you use TimescaleDB in multiple databases within the same
 PostgreSQL instance, you must run the `ALTER EXTENSION` command
 in *all* the databases, not just one of them.

### Example: Migrating docker installations <a id="update-docker"></a>

As a more concrete example, the following steps should be taken with a docker
installation to upgrade to the latest TimescaleDB version, while
retaining data across the updates.

First, install the latest TimescaleDB image:

```bash
docker pull timescale/timescaledb:latest
```

As you'll want to restart the new docker image pointing to a mount point
that contains the previous version's data, we first need to determine
the current mount point.

Assuming that your current docker instance is named "timescaledb", execute the following command (leave off the `--format` argument to print out a lot more details about the instance).

```bash
$ docker inspect timescaledb --format='{{range .Mounts }}{{.Name}}{{end}}'
069ba64815f0c26783b81a5f0ca813227fde8491f429cf77ed9a5ae3536c0b2c
```

Stop (if currently running) and remove the current TimescaleDB container
using that mount point so you can connect the new one:

```bash
docker stop timescaledb
docker rm timescaledb
```

Launch a new container with the updated docker image, but pointing to
this existing mount point:

```bash
docker run -v 069ba64815f0c26783b81a5f0ca813227fde8491f429cf77ed9a5ae3536c0b2c:/var/lib/postgresql/data -d --name timescaledb -p 5432:5432 timescale/timescaledb
```

Finally, connect to this instance via `psql` and execute the `ALTER` command
as above in order to update the extension to the latest version:

```bash
docker exec -it timescaledb psql -U postgres

postgres=# ALTER EXTENSION timescaledb UPDATE;
```

You can then run the `\dx` command to make sure you have the
latest version of TimescaleDB installed.

[install]: /getting-started/installation
[backup]: /using-timescaledb/backup
