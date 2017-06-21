## From Source <a id="installation-source"></a>

#### Prerequisites

- A standard **PostgreSQL 9.6** installation with development environment
(header files) (e.g., postgresql-server-dev-9.6 package for
Linux, [Postgres.app][] for MacOS)

#### Build & Install with Local PostgreSQL

Clone the repository from [Github][github-timescale].

```bash
# To build the extension
make

# To install
make install
```

#### Update `postgresql.conf`

Also, you will need to edit your `postgresql.conf` file to include
necessary libraries, and then restart PostgreSQL:
```bash
# locate your postgresql.conf file
-psql -d postgres -c "SHOW config_file;"

# Modify postgresql.conf to add required libraries.
# For example:
shared_preload_libraries = 'timescaledb'

# Then, restart the PostgreSQL instance
```
*Note*: The `shared_preload_libraries` line is commented out by default.  
Make sure to uncomment it when adding our library.

[Postgres.app]: https://postgresapp.com
[github-timescale]: https://github.com/timescale/timescaledb
