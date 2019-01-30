## yum Installation [](installation-yum)

This will install both TimescaleDB *and* PostgreSQL via `yum`
(or `dnf` on Fedora).

**Note: TimescaleDB requires PostgreSQL 9.6.3+, 10.2+, or 11.0+**

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
# Download PGDG for PostgreSQL 11, e.g. for CentOS 7:
sudo yum install -y https://download.postgresql.org/pub/repos/yum/11/redhat/rhel-7-x86_64/pgdg-centos11-11-2.noarch.rpm

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

>:TIP: Our standard binary releases are licensed under the Timescale License.
This means that you can use all of our free Community capabilities and
seamlessly activate Enterprise capabilities.
If you want to use a version that contains _only_ Apache 2.0 licensed
code, you should install the package `timescaledb-oss-postgresql-:pg_version:`.
For more information about licensing, please read our [blog post][blog-post]
about the subject.

[createuser]: http://suite.opengeo.org/docs/latest/dataadmin/pgGettingStarted/firstconnect.html
[pgdg]: https://yum.postgresql.org/repopackages.php
[yuminstall]: https://wiki.postgresql.org/wiki/YUM_Installation
[blog-post]: https://blog.timescale.com/how-we-are-building-an-open-source-business-a7701516a480
