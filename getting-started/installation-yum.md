## yum Installation [](installation-yum)

This will install both TimescaleDB *and* PostgreSQL via `yum`
(or `dnf` on Fedora).

**Note: TimescaleDB requires PostgreSQL 9.6.3+, 10.2+, or 11.0+**

#### Prerequisites

- CentOS 7 (or Fedora/RHEL equivalent) or later

#### Build & Install

>:WARNING: If you have another PostgreSQL installation not
via `yum`, this will likely cause problems.
If you wish to maintain your current version of PostgreSQL outside of `yum`,
we recommend installing from source.  Otherwise please be
sure to remove non-`yum` installations before using this method.

You'll need to [download the correct PGDG from PostgreSQL][pgdg] for
your operating system and architecture and install it:
```bash
# Download PGDG for PostgreSQL 9.6, e.g. for Fedora 24:
sudo yum install -y https://download.postgresql.org/pub/repos/yum/9.6/fedora/fedora-24-x86_64/pgdg-fedora96-9.6-3.noarch.rpm

## Follow the initial setup instructions found below:
```

Further setup instructions [are found here][yuminstall].

Then, fetch our RPM and install it:
```bash
# Fetch our RPM
wget https://timescalereleases.blob.core.windows.net/rpm/timescaledb-x.y.z-postgresql-:pg_version:-0.x86_64.rpm

# To install
sudo yum install <name of file you downloaded with wget>
```

#### Update `postgresql.conf`

>:TIP: The usual location of `postgres.conf` is
`/var/lib/pgsql/:pg_version:/data/postgresql.conf`, but this may vary depending
on your setup. If you are unsure where your `postgresql.conf` file
is located, you can query PostgreSQL with any database client (e.g., `psql`)
using `SHOW config_file;`.

You will need to edit your `postgresql.conf` file to include
necessary libraries:
```bash
# Modify postgresql.conf to uncomment this line and add required libraries.
shared_preload_libraries = 'timescaledb'
```

>:TIP: If you have other libraries you are preloading, they should be comma separated.

To get started you'll need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs). Please
refer to your distribution for how to restart services and
[these instructions for adding a `postgres` user][createuser].

[createuser]: http://suite.opengeo.org/docs/latest/dataadmin/pgGettingStarted/firstconnect.html
[pgdg]: https://yum.postgresql.org/repopackages.php
[yuminstall]: https://wiki.postgresql.org/wiki/YUM_Installation
