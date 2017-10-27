# Hypertables

Commands to create, alter, or delete schemas in TimescaleDB are
identical to those in PostgreSQL.  Schema commands should be made to
the hypertable name, and any changes are propagated to all chunks
belonging to that hypertable.

### Create a Hypertable <a id="create"></a>

Creating a hypertable is a two-step process.
<!-- add steps format?-->
1. Create a standard table ([PostgreSQL docs][postgres-createtable]).
```sql
CREATE TABLE conditions (
    time        TIMESTAMPTZ       NOT NULL,
    location    TEXT              NOT NULL,
    temperature DOUBLE PRECISION  NULL
);
```

1. Then, execute the TimescaleDB `create_hypertable` command on this
newly created table ([API docs][create_hypertable]).

>vvv You can only convert a plain PostgreSQL table into a
  hypertable if it is currently empty.  Otherwise,
  the `create_hypertable` command will throw an error.  If you need
  to *migrate* data from an existing table to a hypertable, [follow these migration instructions instead][migrate-from-postgresql].

### Alter a Hypertable <a id="alter"></a>

You can execute standard `ALTER TABLE` commands against the hypertable ([PostgreSQL docs][postgres-createtable]).

```sql
ALTER TABLE conditions
  ADD COLUMN humidity DOUBLE PRECISION NULL;
```

TimescaleDB will then automatically propagate these schema changes to
the chunks that constitute this hypertable.

>vvv Altering a table's schema is quite efficient provided that its
default value is set to NULL.  If its default is a non-null value, TimescaleDB
will need to fill in this value into all rows (of all chunks) belonging to this
hypertable.

### Deleting a Hypertable <a id="delete"></a>

It's just the standard `DROP TABLE` command, where TimescaleDB will
correspondingly delete all chunks belonging to the hypertable.
```sql
DROP TABLE conditions;
```

### Best Practices <a id="best-practices"></a>

**Need text here**

[postgres-createtable]: https://www.postgresql.org/docs/9.6/static/sql-createtable.html
[create_hypertable]: /api#create_hypertable
[migrate-from-postgresql]: /getting-started/migrating-data
