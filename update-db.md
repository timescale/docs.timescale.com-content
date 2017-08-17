## Updating software versions <a id="update"></a>

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
are several versions behind. For example, if you install 0.3 but currently
have 0.1 running, the above command will first upgrade to 0.2 then to 0.3.

After executing the command, the psql `\dx` command should show the latest version:

```sql
\dx timescaledb

    Name     | Version |   Schema   |                             Description                            
-------------+---------+------------+---------------------------------------------------------------------
 timescaledb | 0.3.0   | public     | Enables scalable inserts and complex queries for time-series data
(1 row)
```

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

Remove the current TimescaleDB container using that mount point
so you can connect the new one:

```bash
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
[backup]: /api/backup