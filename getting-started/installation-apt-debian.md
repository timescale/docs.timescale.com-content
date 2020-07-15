## apt Installation (Debian) [](installation-apt-debian)

This will install TimescaleDB via `apt` on Debian distros.

**Note: TimescaleDB requires PostgreSQL 11 or 12.**

#### Prerequisites

- Debian 8 (jessie), 9 (stretch), or 10 (buster)

#### Build & Install

>:WARNING: If you have another PostgreSQL installation not via `apt`,
this will likely cause problems.
If you wish to maintain your current version of PostgreSQL outside
of `apt`, we recommend installing from source.  Otherwise, please be
sure to remove non-`apt` installations before using this method.

**If you don't already have PostgreSQL installed**, add PostgreSQL's third
party repository to get the latest PostgreSQL packages:
```bash
# `lsb_release -c -s` should return the correct codename of your OS
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -c -s)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
```

Add TimescaleDB's third party repository and install TimescaleDB,
which will download any dependencies it needs from the PostgreSQL repo:
```bash
# Add our repository
sudo sh -c "echo 'deb https://packagecloud.io/timescale/timescaledb/debian/ `lsb_release -c -s` main' > /etc/apt/sources.list.d/timescaledb.list"
wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | sudo apt-key add -
sudo apt-get update

# Now install appropriate package for PG version
sudo apt-get install timescaledb-postgresql-:pg_version:
```

#### Configure your database

There are a [variety of settings that can be configured][config] for your
new database. At a minimum, you will need to update your `postgresql.conf`
file to include our library in the parameter `shared_preload_libraries`.
The easiest way to get started is to run `timescaledb-tune`, which is
installed by default when using `apt`:
```bash
sudo timescaledb-tune
```

This will ensure that our extension is properly added to the parameter
`shared_preload_libraries` as well as offer suggestions for tuning memory,
parallelism, and other settings.

To get started you'll now need to restart PostgreSQL and add
a `postgres` [superuser][createuser] (used in the rest of the docs):
```bash
# Restart PostgreSQL instance
sudo service postgresql restart
```

>:TIP: Our standard binary releases are licensed under the Timescale License.
This means that you can use all of our free Community capabilities and
seamlessly activate Enterprise capabilities.
If you want to use a version that contains _only_ Apache 2.0 licensed
code, you should install the package `timescaledb-oss-postgresql-:pg_version:`.
For more information about licensing, please read our [blog post][blog-post]
about the subject.

[config]: /getting-started/configuring
[createuser]: https://www.postgresql.org/docs/current/sql-createrole.html
[blog-post]: https://www.timescale.com/blog/how-we-are-building-an-open-source-business-a7701516a480
