# Data Retention [](data-retention)

An intrinsic part of time-series data is that new data is accumulated
and old data is rarely, if ever, updated and the relevance of the data
diminishes over time.  It is therefore often desirable to delete old
data to save disk space.

As an example, if you have a hypertable definition of `conditions`
where you collect raw data into chunks of one day:

```sql
CREATE TABLE conditions(
    time TIMESTAMPTZ NOT NULL,
    device INTEGER,
    temperature FLOAT
);

SELECT * FROM create_hypertable('conditions', 'time',
       chunk_time_interval => '1 day'::interval);
```

If you collect a lot of data and realize that you never actually use
raw data older than 30 days, you might want to delete data older than
30 days from `conditions`.

However, deleting large swaths of data from tables can be costly and
slow if done row-by-row using the standard `DELETE` command. Instead,
TimescaleDB provides a function `drop_chunks` that quickly drop data
at the granularity of chunks without incurring the same overhead.

For example:

```sql
SELECT drop_chunks(interval '24 hours', 'conditions');
```

This will drop all chunks from the hypertable `conditions` that _only_
include data older than this duration, and will _not_ delete any
individual rows of data in chunks.

For example, if one chunk has data more than 36 hours old, a second
chunk has data between 12 and 36 hours old, and a third chunk has the
most recent 12 hours of data, only the first chunk is dropped when
executing `drop_chunks`. Thus, in this scenario,
the `conditions` hypertable will still have data stretching back 36 hours.

For more information on the `drop_chunks` function and related
parameters, please review the [API documentation][drop_chunks].

### Data Retention with Continuous Aggregates

Continuing on the example above, you have discovered that you need
daily summary of the average, minimum, and maximum temperature for
each day, so you have created a continuous aggregate
`conditions_summary_daily` to collect this data:

```sql
CREATE VIEW conditions_summary_daily
WITH (timescaledb.continuous) AS
SELECT device,
       time_bucket('1 day'::interval, "time") AS bucket,
       AVG(temperature),
       MAX(temperature),
       MIN(temperature)
FROM conditions
GROUP BY device, bucket;
```

When you now try to drop chunks from `conditions` you get an error:

```
postgres=# SELECT drop_chunks('30 days'::interval, 'conditions');
ERROR:  cascade_to_materializations options must be set explicitly
HINT:  Hypertables with continuous aggs must have the cascade_to_materializations option set to either true or false explicitly.
```

Since the data in `conditions_summary_daily` is now dependent on the
data in `conditions` you have to explicitly say if you want to remove
this data from the continuous aggregate using the
`cascade_to_materializations` option. Not giving a value when there is
a continuous aggregate defined on a hypertable will generate an error,
as you can see above. To drop the chunks from `condition` and cascade
it to drop the corresponding chunks in the continuous aggregate you
set `cascade_to_materializations` to `TRUE`:

```
postgres=# SELECT COUNT(*)
postgres-#   FROM drop_chunks('30 days'::INTERVAL, 'conditions',
postgres-#                    cascade_to_materializations => TRUE);
 count 
-------
    61
(1 row)
```

To only remove chunks from the hypertable `conditions` and not cascade
to dropping chunks on the continuous aggregate
`conditions_summary_daily` you can provide the value `FALSE` to
`cascade_to_materialization`, but only after you have removed the
dependency on the corresponding chunks in the continuous aggregate. To
do that, use `ALTER VIEW` to change the
`ignore_invalidation_older_than` parameter in the continuous aggregate
to the same range that you intend to remove from the hypertable.

```sql
ALTER VIEW conditions_summary_daily SET (
   timescaledb.ignore_invalidation_older_than = '29 days'
);

SELECT drop_chunks('30 days'::interval, 'conditions',
                   cascade_to_materialization => FALSE);
```

Dropping chunks from the materialized view is similar to dropping
chunks from the tables with raw data. You can drop the chunks of the
continuous aggregate using `drop_chunks`, but you need to set
`ignore_invalidation_older_than` to ensure that new data outside the
dropped region does not update the materialized table.

```sql
ALTER VIEW conditions_summary_daily SET (
   timescaledb.ignore_invalidation_older_than = '29 days'
);

SELECT drop_chunks(INTERVAL '30 days', 'conditions_summary_daily');
```

### Automatic Data Retention Policies

TimescaleDB includes a background job scheduling framework for automating data
management tasks, such as enabling easy data retention policies.

To add such data retention policies, a database administrator can create,
remove, or alter policies that cause `drop_chunks` to be automatically executed
according to some defined schedule.

To add such a policy on a hypertable, continually causing chunks older than 24
hours to be deleted, simply execute the command:
```sql
SELECT add_drop_chunks_policy('conditions', interval '24 hours');
```

To subsequently remove the policy:
```sql
SELECT remove_drop_chunks_policy('conditions');
```

The scheduler framework also allows one to view scheduled jobs:
```sql
SELECT * FROM timescaledb_information.drop_chunks_policies;
```

For more information, please see the [API documentation][add_drop_chunks_policy].


### Using External Job Schedulers

While the built-in scheduling framework automates data retention, the
`drop_chunks` command can be combined with an external tool for job scheduling,
like `crontab` or `systemd`, to schedule such commands.

#### Using Crontab

The following cron job will drop chunks every day at 3am:

```bash
0 3 * * * /usr/bin/psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT drop_chunks(interval '24 hours', 'conditions');" >/dev/null 2>&1
```

The above cron job can easily be installed by running `crontab -e`.


#### Using a Systemd Timer

On a systemd-based OS (most modern Linux distributions), a systemd [unit][] with
accompanying unit [timer][] can also be used to implement a
retention policy.

First, create, e.g., `/etc/systemd/system/retention.service` unit file:

```ini
[Unit]
Description=Drop chunks from the 'conditions' table

[Service]
Type=oneshot
ExecStart=/usr/bin/psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT drop_chunks(interval '24 hours', 'conditions');"
```

Then create a timer to run this unit, e.g., `/etc/systemd/system/retention.timer`:

```ini
[Unit]
Description=Run data retention at 3am daily

[Timer]
OnCalendar=*-*-* 03:00:00

[Install]
WantedBy=timers.target
```

Once these units have been created, run

```
systemctl daemon-reload
systemctl enable retention.timer
systemctl start retention.timer
```

To make systemd load the timer unit, enable it by default on bootup,
and immediately start it.


[drop_chunks]: /api#drop_chunks
[add_drop_chunks_policy]: /api#add_drop_chunks_policy
[unit]: https://www.freedesktop.org/software/systemd/man/systemd.unit.html
[timer]: https://www.freedesktop.org/software/systemd/man/systemd.timer.html
