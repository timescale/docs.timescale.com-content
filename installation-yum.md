### `yum` installation <a id="installation-yum"></a>

This will install both TimescaleDB *AND* PostgreSQL 9.6 via `yum` (or `dnf` on
Fedora).

**Prerequisites**

- Fedora 24 or later or
- CentOS 7 or later

**Build and install**

>vvv If you have another PostgreSQL installation not
via `yum`, this will likely cause problems.
If you wish to maintain your current version of PostgreSQL outside of `yum`,
we recommend installing from source.  Otherwise please be
sure to remove non-`yum` installations before using this method.

You'll need to [download the correct PGDG from Postgres][pgdg] for
your operating system and architecture and install it:
```bash
# Download PGDG, e.g. for Fedora 24:
sudo yum install -y https://download.postgresql.org/pub/repos/yum/9.6/fedora/fedora-24-x86_64/pgdg-fedora96-9.6-3.noarch.rpm

## Follow the initial setup instructions found below:
```

Further setup instructions [are found here][yuminstall].

Then, fetch our RPM and install it:
```bash
# Fetch our RPM
wget https://timescalereleases.blob.core.windows.net/rpm/timescaledb-0.0.11~beta-0.x86_64.rpm

# To install
sudo yum install timescaledb
```

[pgdg]: https://yum.postgresql.org/repopackages.php
[yuminstall]: https://wiki.postgresql.org/wiki/YUM_Installation

**Update `postgresql.conf`**

You will need to edit your `postgresql.conf` file to include
necessary libraries:
```bash
# Modify postgresql.conf to uncomment this line and add required libraries.
# For example:
shared_preload_libraries = 'timescaledb'
```

>ttt The usual location of `postgres.conf`
is `/var/lib/pgsql/9.6/data/postgresql.conf` but this may vary
depending on your setup.

To get started you'll now need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs):
```bash
# Restart PostgreSQL instance (this is distribution-specific)

# Add a superuser postgres:
createuser postgres -s
```
