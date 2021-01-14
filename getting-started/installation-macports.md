## MacPorts [](macports)

This will install both TimescaleDB *and* PostgreSQL via MacPorts.

**Note: TimescaleDB requires PostgreSQL 11 or 12.**

#### Prerequisites

- [MacPorts][]

#### Build & Install

>:WARNING: If you have another PostgreSQL installation
(such as through Postgres.app), the following instructions may
cause problems. If you wish to maintain your current version of PostgreSQL
outside of MacPorts we recommend installing from source.

```bash
# To install
port -v install timescaledb +postgresql:pg_version:

# Post-install to move files to appropriate place
/usr/local/bin/timescaledb_move.sh
```

#### Configure your database

There are a [variety of settings that can be configured][config] for your
new database. At a minimum, you will need to update your `postgresql.conf`
file to include our library in the parameter `shared_preload_libraries`.
The easiest way to get started is to run `timescaledb-tune`, which is
installed as a dependency when you install via Homebrew:
```bash
timescaledb-tune
```

This will ensure that our extension is properly added to the parameter
`shared_preload_libraries` as well as offer suggestions for tuning memory,
parallelism, and other settings.

To get started you'll now need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs):

```bash
# typical restart
pg_ctl -D /usr/local/var/postgres -l /usr/local/var/postgres/server.log restart

# Add a superuser postgres:
createuser postgres -s
```

[config]: /getting-started/configuring
[MacPorts]: https://www.macports.org/
[contact]: https://www.timescale.com/contact
[slack]: https://slack.timescale.com/
