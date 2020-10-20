>:WARNING: These installation instructions will install the current Release Candidate
for TimescaleDB 2.0, which includes the ability to setup [Multi-Node capabilities][multi-node-basic]. For
more information, please [contact us][contact] or join the #multinode-beta channel in our 
[community Slack][slack].

## yum Installation [](installation-yum)

This will install both TimescaleDB *and* PostgreSQL via `yum`
(or `dnf` on Fedora).

**Note: TimescaleDB requires PostgreSQL 11 or 12.**

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
sudo tee /etc/yum.repos.d/timescale_timescaledb.repo <<EOL
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
sudo yum install -y timescaledb-2-postgresql-:pg_version:
```

#### Configure your database

There are a [variety of settings that can be configured][config] for your
new database. At a minimum, you will need to update your `postgresql.conf`
file to include our library in the parameter `shared_preload_libraries`.
The easiest way to get started is to run `timescaledb-tune`, which is
installed by default when using `yum`:
```bash
sudo timescaledb-tune
```

This will ensure that our extension is properly added to the parameter
`shared_preload_libraries` as well as offer suggestions for tuning memory,
parallelism, and other settings.

To get started you'll need to restart PostgreSQL and add
a `postgres` [superuser][createuser] (used in the rest of the docs). Please
refer to your distribution for how to restart services.

[pgdg]: https://yum.postgresql.org/repopackages.php
[yuminstall]: https://wiki.postgresql.org/wiki/YUM_Installation
[config]: /getting-started/configuring
[createuser]: https://www.postgresql.org/docs/current/sql-createrole.html
[contact]: https://www.timescale.com/contact
[slack]: https://slack.timescale.com/
[multi-node-basic]: /getting-started/setup-multi-node-basic