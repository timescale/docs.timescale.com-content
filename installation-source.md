## From Source <a id="installation-source"></a>

**Note: TimescaleDB only supports PostgreSQL 9.6 and 10**

#### Prerequisites

- A standard **PostgreSQL 9.6 or 10** installation with development environment (header files) (e.g., `postgresql-server-dev-9.6` package for Linux, [Postgres.app][] for MacOS)
- C compiler (e.g., gcc or clang)
- [CMake][] version 3.4 or greater

#### Build & Install with Local PostgreSQL

Clone the repository from [Github][github-timescale]. It is **highly
recommended** that you then checkout the latest tagged commit to
build from (see the repo's [Releases][github-releases] page for that).

```bash
git clone https://github.com/timescale/timescaledb.git
cd timescaledb

# Bootstrap the build system
./bootstrap

# To build the extension
cd build && make

# To install
make install
```

#### Update `postgresql.conf`

Also, you will need to edit your `postgresql.conf` file to include
necessary libraries, and then restart PostgreSQL.

```bash
# First, locate your postgresql.conf file
psql -d postgres -c "SHOW config_file;"
```

Then modify `postgresql.conf` to add required libraries.  Note that
the `shared_preload_libraries` line is commented out by default.
Make sure to uncomment it when adding our library.

```bash
shared_preload_libraries = 'timescaledb'
```

Then, restart the PostgreSQL instance.

[Postgres.app]: https://postgresapp.com
[CMake]: https://cmake.org/
[github-timescale]: https://github.com/timescale/timescaledb
[github-releases]: https://github.com/timescale/timescaledb/releases
