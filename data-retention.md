## Data Retention <a id="data-retention"></a>

TimescaleDB allows efficient deletion of old data at the chunk level
using the `drop_chunks()` function.

```sql
SELECT drop_chunks(interval '24 hours', 'conditions');
```

This will drop all chunks from the hypertable 'conditions' that _only_ include
data older than this duration, and will _not_ delete any
individual rows of data in chunks.

For example, if one chunk has data more than 36 hours old, a second
chunk has data between 12 and 36 hours old, and a third chunk has the
most recent 12 hours of data, only the first chunk is dropped when
executing this `drop_chunks()` command. Thus, in this scenario,
the `conditions` hypertable will still have data stretching back 36 hours.

For more information on the `drop_chunks()` function and related
parameters, please review the [API documentation][drop_chunks].

### Automatic Data Retention Policies

The `drop_chunks()` command can be combined with an external tool for
job scheduling, like `crontab` or `systemd`, to implement automatic
data retention policies. Below we give some examples of how to
implement such policies.

Note that the path to `psql` and the parameters to connect to the
database might differ depending on setup and need to be modified
accordingly in the examples below.

#### Using Crontab

The following cron job will drop chunks every day at 3am:

```bash
0 3 * * * /usr/bin/psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT drop_chunks(interval '24 hours', 'conditions');" >/dev/null 2>&1
```

The above cron job can easily be installed by running

```bash
crontab -e
```

to edit the current user's crontab with the user's default editor, and
then saving and exiting.

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


#### Deploying in the Cloud or Orchestration Frameworks

If your database is a cloud-hosted instance or runs in a container
orchestration framework (such as Kubernetes), it might not be possible
to schedule cron jobs or systemd timers on the database host. In such
circumstances, it is entirely possible to schedule a job on a
different host or a "sidecar" container that remotely calls the
database by changing `localhost` in the `psql` command to the hostname
of the database instance, and potentially adding parameters for
authentication.

Alternatively, the cloud provider might provide other means of
scheduling jobs or tasks. For instance, Kubernetes allows you to
easily run [cron jobs][kube_cronjob] that are managed by Kubernetes
itself.


[drop_chunks]: /api#drop_chunks
[unit]: https://www.freedesktop.org/software/systemd/man/systemd.unit.html
[timer]: https://www.freedesktop.org/software/systemd/man/systemd.timer.html
[kube_cronjob]: https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/
