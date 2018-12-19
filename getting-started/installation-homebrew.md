## Homebrew [](homebrew)

This will install both TimescaleDB *and* PostgreSQL via Homebrew.

**Note: TimescaleDB requires PostgreSQL 9.6.3+, 10.2+, or [BETA] 11.0+**

#### Prerequisites

- [Homebrew][]

#### Build & Install

>:WARNING: If you have another PostgreSQL installation
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

#### Update `postgresql.conf`

>:TIP: The usual location of `postgresql.conf` is
`/usr/local/var/postgres/postgresql.conf`, but this may vary depending on
your setup. If you are unsure where your `postgresql.conf` file
is located, you can query PostgreSQL with any database client (e.g., `psql`)
using `SHOW config_file;`.

Also, you will need to edit your `postgresql.conf` file to include
necessary libraries:

```bash
# Modify postgresql.conf to uncomment this line and add required libraries.
# For example:
shared_preload_libraries = 'timescaledb'
```

>:TIP: If you have other libraries you are preloading, they should be comma separated.

To get started you'll now need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs):
>:WARNING: If you are still on PostgreSQL 9.6 or 10 via Homebrew, you should
replace `postgresql` with <code>postgresql&#64;9.6</code> for 9.6 or
<code>postgresql&#64;10</code> for 10.

```bash
# Restart PostgreSQL instance
brew services restart postgresql

# Add a superuser postgres:
createuser postgres -s
```
[Homebrew]: https://brew.sh/
