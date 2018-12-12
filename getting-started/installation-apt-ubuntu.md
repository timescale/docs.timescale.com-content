## apt Installation (Ubuntu) [](installation-apt-ubuntu)

This will install TimescaleDB via `apt` on Ubuntu distros.

**Note: TimescaleDB requires PostgreSQL 9.6.3+, 10.2+, or [BETA] 11.0+**

#### Prerequisites

- Ubuntu 14.04 or later, except obsoleted versions.
Check [releases.ubuntu.com][ubuntu-releases] for list of
non-obsolete releases.

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

Add TimescaleDB's third party PPA and install TimescaleDB (will download
any dependencies it needs from the PostgreSQL repo):
```bash
# Add our PPA
sudo add-apt-repository ppa:timescale/timescaledb-ppa
sudo apt-get update

# To install for PG 10.2+
sudo apt install timescaledb-postgresql-10
# To install for PG 9.6.3+
sudo apt install timescaledb-postgresql-9.6

# PG 11 support is currently in BETA. To install for PG 11.0+
sudo apt install timescaledb-postgresql-11
```

#### Update `postgresql.conf`

>:TIP: The usual location of `postgres.conf`
is `/etc/postgresql/9.6/main/postgresql.conf` for 9.6 and
`/etc/postgresql/10/main/postgresql.conf` for 10, but this may vary
depending on your setup. If you are unsure where your `postgresql.conf` file
is located, you can query PostgreSQL through the psql interface using `SHOW config_file;`.
Please note that you must have created a `postgres` superuser so that you can access the psql
interface.

You will need to edit your `postgresql.conf` file to include
necessary libraries:
```bash
# Modify postgresql.conf to uncomment this line and add required libraries.
# For example:
shared_preload_libraries = 'timescaledb'
```

>:TIP: If you have other libraries you are preloading, they should be comma separated.

To get started you'll now need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs):
```bash
# Restart PostgreSQL instance
sudo service postgresql restart
```

[Here are some instructions to create the `postgres` superuser][createuser].

[createuser]: http://suite.opengeo.org/docs/latest/dataadmin/pgGettingStarted/firstconnect.html
[ubuntu-releases]: http://releases.ubuntu.com/
