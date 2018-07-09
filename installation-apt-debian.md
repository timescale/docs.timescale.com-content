## apt Installation (Debian) [](installation-apt-debian)

This will install TimescaleDB via `apt` on Debian distros.

**Note: TimescaleDB requires PostgreSQL 9.6 or later+**

#### Prerequisites

- Debian 7, 8, or 9.
- A standard PostgreSQL installation.
See [here for instructions][postgresql-apt] to install via `apt`.

#### Build & Install

>:WARNING: If you have another PostgreSQL installation not via `apt`,
this will likely cause problems.
If you wish to maintain your current version of PostgreSQL outside
of `apt`, we recommend installing from source.  Otherwise, please be
sure to remove non-`apt` installations before using this method.

```bash
# Fetch the correct .deb (e.g., Debian 7 and PostgreSQL 9.6)
wget https://timescalereleases.blob.core.windows.net/debian/timescaledb-postgresql-9.6_x.y.z~debian7_amd64.deb

# Install via dpkg
sudo dpkg -i timescaledb-postgresql-9.6_x.y.z~debian7_amd64.deb

# Alternate file names to wget:
# - timescaledb-postgresql-9.6_x.y.z~debian8_amd64
# - timescaledb-postgresql-9.6_x.y.z~debian9_amd64
# - timescaledb-postgresql-10_x.y.z~debian7_amd64
# - timescaledb-postgresql-10_x.y.z~debian8_amd64
# - timescaledb-postgresql-10_x.y.z~debian9_amd64
```
>:TIP: If the `dpkg` command fails with dependency issues, you can resolve
them with `sudo apt install -f` and then re-run the `dpkg` command.

#### Update `postgresql.conf`

You will need to edit your `postgresql.conf` file to include
necessary libraries:
```bash
# Modify postgresql.conf to uncomment this line and add required libraries.
# For example:
shared_preload_libraries = 'timescaledb'
```

>:TIP: The usual location of `postgres.conf`
is `/etc/postgresql/9.6/main/postgresql.conf` for 9.6 and
`/etc/postgresql/10/main/postgresql.conf` for 10, but this may vary
depending on your setup.

>:TIP: If you have other libraries you are preloading, they should be comma separated.

To get started you'll now need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs):
```bash
# Restart PostgreSQL instance
sudo service postgresql restart
```

[Here are some instructions to create the `postgres` superuser][createuser].

[createuser]: http://suite.opengeo.org/docs/latest/dataadmin/pgGettingStarted/firstconnect.html
[postgresql-apt]: https://www.postgresql.org/download/linux/debian/
