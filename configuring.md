# Configuring TimescaleDB

TimescaleDB works with the default PostgreSQL server configuration settings.
However, we find that optimizing some settings increases performance. These
settings can be adjusted in your machine's `postgresql.conf`.

>ttt You can determine the location of `postgresql.conf` by running `SHOW config_file;`
from within psql.

## Memory settings <a id="memory"></a>

The settings `shared_buffers`, `effective_cache_size`, `work_mem`, and
`maintenance_work_mem` need to be adjusted to match the machine's available
memory.  We suggest getting the configuration values from the [PgTune][pgtune]
website (suggeted DB Type: Data warehouse). You should also adjust the
`max_connections` setting to match the ones given by PgTune since there is a
connection between `max_connections` and memory settings. Other settings from
PgTune may also be helpful.

## Disk-write settings <a id="disk-write"></a>

In order to increase write throughput, there are [multiple
settings][async-commit] to adjust the behaviour that postgres uses to write data
to disk. We find the performance to be good with the default (safest) settings. If
you want a bit of additional performance, you can  set `synchronous_commit =
'off'`([PostgreSQL docs][synchronous-commit]). Please note that when disabling
`sychronous_commit` in this way, an operating system or database crash might
result in some recent allegedly-committed transactions being lost. We actively
discourage changing the `fsync` setting.

[pgtune]: http://pgtune.leopard.in.ua/
[async-commit]: https://www.postgresql.org/docs/current/static/wal-async-commit.html
[synchronous-commit]: https://www.postgresql.org/docs/current/static/runtime-config-wal.html#GUC-SYNCHRONOUS-COMMIT
