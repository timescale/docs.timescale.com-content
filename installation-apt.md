### `apt` installation <a id="installation-apt"></a>

This will install both TimescaleDB *AND* PostgreSQL 9.6 via `apt`.

>vvv If you have another PostgreSQL installation not via `apt`,
this will likely cause problems.
If you wish to maintain your current version of PostgreSQL outside
of `apt`, we recommend installing from source.  Otherwise please be
sure to remove non-`apt` installations before using this method.

**Prerequisites**

- Ubuntu 16.04 or later

**Build and install**

```bash
# Add our PPA
sudo add-apt-repository ppa:timescale/timescaledb-ppa
sudo apt-get update
# To install
sudo apt install timescaledb
```

**Update `postgresql.conf`**

Also, you will need to edit your `postgresql.conf` file to include
necessary libraries:
```bash
# Modify postgresql.conf to uncomment this line and add required libraries.
# For example:
shared_preload_libraries = 'timescaledb'
```

>ttt The usual location of `postgres.conf`
is `/etc/postgresql/9.6/main/postgresql.conf` but this may vary
depending on your setup.

To get started you'll now need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs):
```bash
# Restart PostgreSQL instance
sudo service postgresql restart

# Add a superuser postgres:
createuser postgres -s
```
