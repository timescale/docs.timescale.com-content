## yum Installation [](installation-yum)

This will install both TimescaleDB *and* PostgreSQL via `yum`
(or `dnf` on Fedora).

**Note: TimescaleDB requires PostgreSQL 9.6.3+, 10.2+ or 11**

#### Prerequisites

- RHEL/CentOS 7 (or Fedora equivalent) or later

#### Build & Install

>:WARNING: If you have another PostgreSQL installation not
via `yum`, this will likely cause problems.
If you wish to maintain your current version of PostgreSQL outside of `yum`,
we recommend installing from source.  Otherwise please be
sure to remove non-`yum` installations before using this method.

You'll need to [download the correct PGDG from PostgreSQL][pgdg] for
your operating system and architecture and install it:
```bash
# Download PGDG for PostgreSQL 11, e.g. for RHEL 7:
sudo yum install -y https://download.postgresql.org/pub/repos/yum/11/redhat/rhel-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm

## Follow the initial setup instructions found below:
```

Further setup instructions [are found here][yuminstall].

Add TimescaleDB's third party repository and install TimescaleDB,
which will download any dependencies it needs from the PostgreSQL repo:
```bash
# Add our repo
sudo cat > /etc/yum.repos.d/timescale_timescaledb.repo <<EOL
[timescale_timescaledb]
name=timescale_timescaledb
baseurl=https://packagecloud.io/timescale/timescaledb/el/7/\$basearch
repo_gpgcheck=1
gpgcheck=0
enabled=1
gpgkey=https://packagecloud.io/timescale/timescaledb/gpgkey
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
metadata_expire=300
EOL
sudo yum update -y

# Now install appropriate package for PG version
sudo yum install -y timescaledb-postgresql-:pg_version:
```

#### Update `postgresql.conf`

>:TIP: The usual location of `postgres.conf`
is `/var/lib/pgsql/9.6/data/postgresql.conf` for PostgreSQL 9.6
and `/var/lib/pgsql/10/data/postgresql.conf` for PostgreSQL 10,
but this may vary depending on your setup. If you are unsure where your `postgresql.conf` file
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

To get started you'll need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs). Please
refer to your distribution for how to restart services and
[these instructions for adding a `postgres` user][createuser].

[createuser]: http://suite.opengeo.org/docs/latest/dataadmin/pgGettingStarted/firstconnect.html
[pgdg]: https://yum.postgresql.org/repopackages.php
[yuminstall]: https://wiki.postgresql.org/wiki/YUM_Installation
