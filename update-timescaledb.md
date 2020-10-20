# Updating TimescaleDB versions [](update)

This section describes how to upgrade between different versions of
TimescaleDB. TimescaleDB supports **in-place updates**:
you don't need to dump and restore your data, and versions are published with
automated migration scripts that convert any internal state if necessary.

### TimescaleDB Release Compatability

TimescaleDB currently has two major release versions listed below. Please ensure that your version of
PostgreSQL is supported with the extension version you want to install or update.

 TimescaleDB Release |   Supported PostgreSQL Release
 --------------------|-------------------------------
 1.7.4               | 9.6, 10, 11, 12
 2.0-RC1+            | 11, 12

>:TIP:If you need to upgrade PostgreSQL first, please see [our documentation][upgrade-pg].

### Upgrade TimescaleDB

To upgrade an existing TimescaleDB instance, follow the documentation below based on
your current upgrade path.

**TimescaleDB 2.0**: [Updating TimescaleDB from 1.x to 2.0-RC1+][update-tsdb-2]

**TimescaleDB 2.0 on Docker**: [Update TimescaleDB on Docker from 1.7.4 to 2.0-RC1+][update-docker]

**TimescaleDB 1.x**: [Update TimescaleDB 1.x to 1.7.4][update-tsdb-1]


[upgrade-pg]: /update-timescaledb/upgrade-pg
[update-tsdb-1]: https://docs.timescale.com/v1.7/update-timescaledb/update-tsdb-1
[update-tsdb-2]: /update-timescaledb/update-tsdb-2
[update-docker]: /update-timescaledb/update-docker
