### Homebrew <a id="homebrew"></a>

This will install both TimescaleDB *AND* PostgreSQL 9.6 via Homebrew. If you have another PostgreSQL installation (such as through Postgres.app), this will cause problems. If you wish to maintain your current version of PostgreSQL outside of Homebrew we
recommend [installing from source][source].  Otherwise please be sure to remove non-Homebrew installations before using this method.

**Prerequisites**

- [Homebrew](https://brew.sh/)

**Build and install**

```bash
# Add our tap
brew tap timescale/tap

# To install
brew install timescaledb
```

**Update `postgresql.conf`**

Also, you will need to edit your `postgresql.conf` file to include
necessary libraries:
```bash
# Modify postgresql.conf to uncomment this line and add required libraries.
# For example:
shared_preload_libraries = 'timescaledb'
```

To get started you'll now need to restart PostgreSQL and add a
`postgres` superuser (used in the rest of the docs):
```bash
# Restart PostgreSQL
brew services restart postgresql

# Add a superuser postgres:
createuser postgres -s
```
