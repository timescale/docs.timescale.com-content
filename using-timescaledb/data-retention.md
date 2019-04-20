# Data Retention [](data-retention)

TimescaleDB allows efficient deletion of old data at the chunk level
using the `drop_chunks` function.

```sql
SELECT drop_chunks(interval '24 hours', 'conditions');
```

This will drop all chunks from the hypertable 'conditions' that _only_ include
data older than this duration, and will _not_ delete any
individual rows of data in chunks.

For example, if one chunk has data more than 36 hours old, a second
chunk has data between 12 and 36 hours old, and a third chunk has the
most recent 12 hours of data, only the first chunk is dropped when
executing `drop_chunks`. Thus, in this scenario,
the `conditions` hypertable will still have data stretching back 36 hours.

For more information on the `drop_chunks` function and related
parameters, please review the [API documentation][drop_chunks].

### Automatic Data Retention Policies :enterprise_function:

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
[unit]: https://www.freedesktop.org/software/systemd/man/systemd.unit.html
[timer]: https://www.freedesktop.org/software/systemd/man/systemd.timer.html
[add_drop_chunks_policy]: /api#add_drop_chunks_policy