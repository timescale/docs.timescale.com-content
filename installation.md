### Setting up your initial database
Now, we'll install our extension and create an initial database. Below
you'll find instructions for creating a new, empty database.

To help you quickly get started, we have also created some sample
datasets. Once you complete the initial setup below you can then
easily import this data to play around with TimescaleDB functionality.
See [our Sample Datasets][datasets]
for further instructions.

#### Setting up an empty database

When creating a new database, it is necessary to install the extension and then run an initialization function.

```bash
# Connect to Postgres, using a superuser named 'postgres'
psql -U postgres -h localhost
```

```sql
-- Install the extension
CREATE database tutorial;
\c tutorial
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Run initialization function
SELECT setup_timescaledb();
```

For convenience, this can also be done in one step by running a script from
the command-line:
```bash
DB_NAME=tutorial ./scripts/setup-db.sh
```

#### Accessing your new database
You should now have a brand new time-series database running in Postgres.

```bash
# To access your new database
psql -U postgres -h localhost -d tutorial
```

Next let's learn some of the [Basic operations][] available to TimescaleDB.



### Caveats
Below are a few issues with the database that we are working on as we move out of beta:

- All users have full read/write access to the metadata tables for hypertables.
- Permission changes on hypertables are not correctly propagated.
- `create_hypertable()` can only be run on an empty table.
- Custom user-created triggers on hypertables currently not allowed.
- `drop_chunks()` (see our [API Reference][]) is currently only
supported for hypertables that are not partitioned by space.

### More APIs
For more information on TimescaleDB's APIs, check out our
[API Reference][].


[platforms]: https://www.postgresql.org/docs/9.5/static/supported-platforms.html
[source]: /getting-started/installation#source
[datasets]: /getting-started/other-sample-datasets
[docker-run.sh]: https://github.com/timescale/timescaledb/blob/master/scripts/docker-run.sh
[API Reference]: /timescaledb-api
[Basic operations]: /getting-started/basic-operations
