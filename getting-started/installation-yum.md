## yum Installation [](installation-yum)

This will install both TimescaleDB *and* PostgreSQL via `yum`
(or `dnf` on Fedora).

**Note: TimescaleDB only supports PostgreSQL 9.6 and 10+**

#### Prerequisites

- Fedora 24 or later, or
- CentOS 7 or later

#### Build & Install

>vvv If you have another PostgreSQL installation not
via `yum`, this will likely cause problems.
If you wish to maintain your current version of PostgreSQL outside of `yum`,
we recommend installing from source.  Otherwise please be
sure to remove non-`yum` installations before using this method.

You'll need to [download the correct PGDG from Postgres][pgdg] for
your operating system and architecture and install it:
```bash
# Download PGDG for PostgreSQL 9.6, e.g. for Fedora 30:
sudo yum install -y https://download.postgresql.org/pub/repos/yum/9.6/fedora/fedora-30-x86_64/pgdg-fedora-repo-latest.noarch.rpm

## Follow the initial setup instructions found below:
```

Further setup instructions [are found here][yuminstall].

Then, fetch our RPM and install it:
```bash
# Fetch our RPM (for PostgreSQL 9.6)
wget https://timescalereleases.blob.core.windows.net/rpm/timescaledb-x.y.z-postgresql-9.6-0.x86_64.rpm
# For PostgreSQL 10:
# wget https://timescalereleases.blob.core.windows.net/rpm/timescaledb-x.y.z-postgresql-10-0.x86_64.rpm

# To install
sudo yum install <name of file you downloaded with wget>
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
is `/var/lib/pgsql/9.6/data/postgresql.conf` for PostgreSQL 9.6
and `/var/lib/pgsql/10/data/postgresql.conf` for PostgreSQL 10,
but this may vary depending on your setup.

To get started you'll need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs). Please
refer to your distribution for how to restart services and
[these instructions for adding a `postgres` user][createuser].

[createuser]: http://suite.opengeo.org/docs/latest/dataadmin/pgGettingStarted/firstconnect.html
[pgdg]: https://yum.postgresql.org/repopackages.php
[yuminstall]: https://wiki.postgresql.org/wiki/YUM_Installation
