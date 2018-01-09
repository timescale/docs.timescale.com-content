## Homebrew <a id="homebrew"></a>

This will install both TimescaleDB *AND* PostgreSQL via Homebrew.

**Note: TimescaleDB only supports PostgreSQL 9.6 and 10+**

#### Prerequisites

- [Homebrew][]

#### Build & Install

>vvv If you have another PostgreSQL installation
(such as through Postgres.app), the following instructions will
cause problems. If you wish to maintain your current version of PostgreSQL
outside of Homebrew we recommend installing from source.  Otherwise please be
sure to remove non-Homebrew installations before using this method.

```bash
# Add our tap
brew tap timescale/tap

# To install
brew install timescaledb

# Post-install to move files to appropriate place
/usr/local/bin/timescaledb_move.sh
```

#### Update Postgresql.conf

Also, you will need to edit your `postgresql.conf` file to include
necessary libraries:

```bash
# Modify postgresql.conf to uncomment this line and add required libraries.
# For example:
shared_preload_libraries = 'timescaledb'
```
>ttt The usual location of `postgres.conf` is
`/usr/local/var/postgres/postgresql.conf`, but this may vary depending on
your setup.

To get started you'll now need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs):
>vvv If you are still on PostgreSQL 9.6 via Homebrew, you should
replace `postgresql` with `postgresql@9.6`.

```bash
# Restart PostgreSQL instance
brew services restart postgresql

# Add a superuser postgres:
createuser postgres -s
```
[Homebrew]: https://brew.sh/
