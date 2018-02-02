# Debugging TimescaleDB

## Common Errors
###  Log error: could not access file "timescaledb" [](access-timescaledb)

If your PostgreSQL logs have this error preventing it from starting up,
you should double check that the TimescaleDB files have been installed
to the correct location. Our installation methods use `pg_config` to
get PostgreSQL's location. However if you have multiple versions of
PostgreSQL installed on the same machine, the location `pg_config`
points to may not be for the version you expect. To check which
version TimescaleDB used:
```bash
$ pg_config --version
PostgreSQL 9.6.6
```

If that is the correct version, double check that the installation path is
the one you'd expect. For example, for PostgreSQL 10.1 installed via
Homebrew on macOS it should be `/usr/local/Cellar/postgresql/10.1/bin`:
```bash
$ pg_config --bindir
/usr/local/Cellar/postgresql/10.1/bin
```

If either of those steps is not the version you are expecting, you need
to either (a) uninstall the incorrect version of PostgreSQL if you can or
(b) update your `PATH` environmental variable to have the correct
path of `pg_config` listed first, i.e., by prepending the full path:
```bash
$ export PATH = /usr/local/Cellar/postgresql/10.1/bin:$PATH
```
Then, reinstall TimescaleDB and it should find the correct installation
path.

---

## Getting more information

###  EXPLAINing query performance [](explain)

PostgreSQL's EXPLAIN feature allows users to understand the underlying query
plan that PostgreSQL uses to execute a query. There are multiple ways that
PostgreSQL can execute a query: for example, a query might be fulfilled using a
slow sequence scan or a much more efficient index scan. The choice of plan
depends on what indexes are created on the table, the statistics that PostgreSQL
has about your data, and various planner settings. The EXPLAIN output let's you
know which plan PostgreSQL is choosing for a particular query. PostgreSQL has a
[in-depth explanation][using explain] of this feature.  

To understand the query performance on a hypertable, we suggest first
making sure that the planner statistics and table maintenance is up-to-date on the hypertable
by running `VACUUM ANALYZE <your-hypertable>;`. Then, we suggest running the
following version of EXPLAIN:

```
EXPLAIN (ANALYZE on, BUFFERS on) &lt;original query&gt;;
```

If you suspect that your performance issues are due to slow IOs from disk, you
can get even more information by enabling the
[track\_io\_timing][track_io_timing] variable with `SET track_io_timing = 'on';`
before running the above EXPLAIN.

When asking query-performance related questions by
email(<support@timescale.com>) or [slack][], providing the EXPLAIN output of a
query is immensely helpful.

---

## Dump TimescaleDB meta data [](dump-meta-data)

To help when asking for support and reporting bugs, 
TimescaleDB includes a SQL script that outputs metadata 
from the internal TimescaleDB tables as well as version information.
The script is available in the source distribution in `scripts/` 
but can also be [downloaded separately][].
To use it, run:

```bash
psql [your connect flags] -d your_timescale_db < dump_meta_data.sql > dumpfile.txt
```

and then inspect `dump_file.txt` before sending it together with a bug report or support question.

[using explain]: https://www.postgresql.org/docs/current/static/using-explain.html
[track_io_timing]: https://www.postgresql.org/docs/current/static/runtime-config-statistics.html#GUC-TRACK-IO-TIMING
[slack]: https://slack-login.timescale.com/
[downloaded separately]: https://raw.githubusercontent.com/timescale/timescaledb/master/scripts/dump_meta_data.sql
