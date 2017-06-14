**Next we will [setup the database][setup], either with an empty hypertable, or
by migrating data from another source**

---

## Caveats
Below are a few issues with the database that we are working on as we move out of beta:

- All users have full read/write access to the metadata tables for hypertables.
- Permission changes on hypertables are not correctly propagated.
- `create_hypertable()` can only be run on an empty table.
- Custom user-created triggers on hypertables currently not allowed.
- `drop_chunks()` (see our [API Reference][]) is currently only
supported for hypertables that are not partitioned by space.

## More APIs
For more information on TimescaleDB's APIs, check out our [API Reference][].

[setup]: /getting-started/setup
[API Reference]: /api/api-timescaledb
