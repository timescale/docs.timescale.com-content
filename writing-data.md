# Writing data

## INSERT <a id="insert"></a>

Data can be inserted into a hypertable using the standard INSERT SQL command
([PostgreSQL docs][postgres-insert]).

```sql
INSERT INTO conditions(time, location, temperature, humidity)
  VALUES (NOW(), 'office', 70.0, 50.0);
```

You can also insert multiple rows into a hypertable using a single `INSERT` call,
even thousands at a time. This is typically much more efficient than
inserting data row-by-row, and is recommended when possible.

```sql
INSERT INTO conditions
  VALUES
    (NOW(), 'office', 70.0, 50.0),
    (NOW(), 'basement', 66.5, 60.0),
    (NOW(), 'garage', 77.0, 65.2);
```

>ttt The rows that belong to a single batch INSERT command do **not** need
to belong to the same chunk (by time interval or partitioning key).
Upon receiving an `INSERT` command for multiple rows, the TimescaleDB
engine will determine which rows (sub-batches) belong to which chunks,
and will write them accordingly to each chunk in a single transaction.

You can also specify that INSERT returns some or all of the inserted
data via the `RETURNING` statement:

```sql
INSERT INTO conditions
  VALUES (NOW(), 'office', 70.1, 50.1) RETURNING *;

             time              | location | temperature | humidity
-------------------------------+----------+-------------+----------
 2017-07-28 11:42:42.846621+00 | office   |        70.1 |     50.1
(1 row)
```

---

## UPDATE Commands <a id="update"></a>

Updates in TimescaleDB work as expected in standard SQL ([PostgreSQL docs][postgres-update]).

```sql
UPDATE conditions SET temperature = 70.2, humidity = 50.0
  WHERE time = '2017-07-28 11:42:42.846621+00' AND location = 'office';
```

An update command can touch many rows at once, i.e., the following
will modify all rows found in a 10-minute block of data.

```sql
UPDATE conditions SET temperature = temperature + 0.1
  WHERE time >= '2017-07-28 11:40' AND time < '2017-07-28 11:50';
```

>vvv TimescaleDB achieves much higher insert performance compared to
 vanilla PostgreSQL when inserts are localized to the most recent time
 interval (or two).  If your workload is heavily based on UPDATEs to old
 time intervals instead, you may observe significantly lower write
 throughput.

---

## UPSERT Functionality <a id="upsert"></a>

TimescaleDB supports UPSERTs in the same manner as PostgreSQL
via the optional `ON CONFLICT` clause ([PostgreSQL docs][postgres-upsert]).
If such a clause is provided, rather than cause an error,
an inserted row that
conflicts with another can either (a) do nothing or (b) result in a
subsequent update of that existing row.

In order to create a conflict, an insert must be performed on
identical value(s) in column(s) covered by a unique index. Such an
index is created automatically when marking column(s) as PRIMARY KEY
or with a UNIQUE constraint.

Following the examples given above, an INSERT with an identical
timestamp and location as an existing row will succeed and create an
additional row in the database.

If, however, the `conditions` table had been created with a UNIQUE
constraint defined on one or more of the columns (either at table
creation time or via an ALTER command):

```sql
CREATE TABLE conditions (
    time        TIMESTAMPTZ       NOT NULL,
    location    TEXT              NOT NULL,
    temperature DOUBLE PRECISION  NULL,
    humidity    DOUBLE PRECISION  NULL,
    UNIQUE (time, location)
);
```

then the second attempt to insert to this same time will normally
return an error.

Now, however, the INSERT command can specify that nothing be done on
a conflict. This is particularly important when writing many rows as
one batch, as otherwise the entire transaction will fail (as opposed
to just skipping the row that conflicts).

```sql
INSERT INTO conditions
  VALUES ('2017-07-28 11:42:42.846621+00', 'office', 70.1, 50.0)
  ON CONFLICT DO NOTHING;
```

Alternatively, one can specify how to update the existing data:
```sql
INSERT INTO conditions
  VALUES ('2017-07-28 11:42:42.846621+00', 'office', 70.2, 50.1)
  ON CONFLICT (time, location) DO UPDATE
    SET temperature = excluded.temperature,
        humidity = excluded.humidity;
```

>vvv Unique constraints must include all partitioning keys as their prefix.
 This above example works if either time, or time and
 location, are used to partition the hypertable (i.e., are the arguments
 to `create_hypertable`).  If the schema had an additional column
 like `device` which was alternatively used for space
 partitioning, then the constraint would have
 to be `UNIQUE(time, device)` or `UNIQUE(time, device, location)`.

<!-- -->
>vvv TimescaleDB does not yet support `ON CONFLICT ON CONSTRAINT`
 functionality, so conflicts must currently occur over a unique index.
 This limitation will be removed in a future version. For now, the suggested
 approach is either to explicitly define a unique index or specify that one
 column is UNIQUE.

---

## DELETE <a id="delete"></a>

**Need text here**

[postgres-insert]: https://www.postgresql.org/docs/current/static/sql-insert.html
[postgres-update]: https://www.postgresql.org/docs/current/static/sql-update.html
[postgres-upsert]: https://www.postgresql.org/docs/current/static/sql-insert.html#SQL-ON-CONFLICT
