## apt Installation (Debian) [](installation-apt-debian)

This will install TimescaleDB via `apt` on Debian distros.

**Note: TimescaleDB requires PostgreSQL 9.6.3+, 10.2+, or 11.0+**

#### Prerequisites

- Debian 8 (jessie) or 9 (stretch)

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
sudo sh -c "echo 'deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -c -s`-pgdg main' >> /etc/apt/sources.list.d/pgdg.list"
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

#### Update `postgresql.conf`

>:TIP: The usual location of `postgres.conf`
is `/etc/postgresql/:pg_version:/main/postgresql.conf`, but this may vary
depending on your setup. If you are unsure where your `postgresql.conf` file
is located, you can query PostgreSQL with any database client (e.g., `psql`)
using `SHOW config_file;`.

You will need to edit your `postgresql.conf` file to include
necessary libraries:
```bash
# Modify postgresql.conf to uncomment this line and add required libraries.
shared_preload_libraries = 'timescaledb'
```

>:TIP: If you have other libraries you are preloading, they should be comma separated.

To get started you'll now need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs):
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

[Here are some instructions to create the `postgres` superuser][createuser].

[createuser]: http://suite.opengeo.org/docs/latest/dataadmin/pgGettingStarted/firstconnect.html
[blog-post]: https://blog.timescale.com/how-we-are-building-an-open-source-business-a7701516a480
