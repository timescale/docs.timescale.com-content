## apt Installation (Ubuntu) [](installation-apt-ubuntu)

This will install TimescaleDB via `apt` on Ubuntu distros.

**Note: TimescaleDB requires PostgreSQL 9.6 or later+**

#### Prerequisites

- Ubuntu 14.04 or later, except obsoleted versions.
Check [releases.ubuntu.com][ubuntu-releases] for list of
non-obsolete releases.
- A standard PostgreSQL installation.
See [here for instructions][postgresql-apt] to install via `apt`.

#### Build & Install

>vvv If you have another PostgreSQL installation not via `apt`,
this will likely cause problems.
If you wish to maintain your current version of PostgreSQL outside
of `apt`, we recommend installing from source.  Otherwise, please be
sure to remove non-`apt` installations before using this method.

```bash
# Add our PPA
sudo add-apt-repository ppa:timescale/timescaledb-ppa
sudo apt-get update

# To install for PG 9.6
sudo apt install timescaledb-postgresql-9.6
# To install for PG 10
sudo apt install timescaledb-postgresql-10
```

#### Update `postgresql.conf`

You will need to edit your `postgresql.conf` file to include
necessary libraries:
```bash
# Modify postgresql.conf to uncomment this line and add required libraries.
# For example:
shared_preload_libraries = 'timescaledb'
```

>ttt The usual location of `postgres.conf`
is `/etc/postgresql/9.6/main/postgresql.conf` for 9.6 and
`/etc/postgresql/10/main/postgresql.conf` for 10, but this may vary
depending on your setup.

>ttt If you have other libraries you are preloading, they should be comma separated.

To get started you'll now need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs):
```bash
# Restart PostgreSQL instance
sudo service postgresql restart
```

[Here are some instructions to create the `postgres` superuser][createuser].

[createuser]: http://suite.opengeo.org/docs/latest/dataadmin/pgGettingStarted/firstconnect.html
[ubuntu-releases]: http://releases.ubuntu.com/
[postgresql-apt]: https://www.postgresql.org/download/linux/ubuntu/
