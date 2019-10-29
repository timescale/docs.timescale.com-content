# Tutorial: Scaling out TimescaleDB

>:WARNING: Distributed hypertables are currently in PRIVATE BETA and
are not yet meant for production use. For more information, please
[contact us][contact].

TimescaleDB can be run in a multi-node setup, with one primary access node distributing
writes and queries to multiple data nodes. For more information on the actual
underlying architecture, you can view our [architecture][architecture] section.

In this tutorial, we will show how you can create a distributed hypertable within
a distributed database. We will set up the distributed database with one primary access node
and two data nodes across three distinct TimescaleDB instances.

It is assumed before starting this tutorial you will have three networked machines set up with:
- TimescaleDB version 2.0 (beta) or greater
- PostgresSQL 11

For the sake of this tutorial we will refer to these machines as
`access.example.com`, `data1.example.com`, `data2.example.com`. You will also
need a common superuser role on each postgres instance. This tutorial
will assume the `postgres` role for this, but you may substitute any
role common to all machines with superuser permission.

Beyond this, please ensure that you've completed the following steps.
Some or most of these may not be necessary depending on how you
initially set up your instances:
- Make sure you've enabled `max_prepared_transactions` on all the instances, this parameter is located in `postgresql.conf`. We recommend a setting of at least 150.
- Make sure the data nodes are properly listening for network traffic. `postgresql.conf` should have a `listen_addresses` set to include the access node. If this parameter is missing or just `localhost`, change it to `access.example.com`, or the corresponding IP. You can also set it to `"*"` to not restrict where connections can originate from.
- The superuser role, `postgres` in this example, must have an entry in the `pg_hba.conf` file for the data nodes. This should look something like: ```host    all    postgres    access.example.com    trust``` You can use any CIDR block covering the access node's IP in place of `access.example.com`. For using authentication mechanism's other than `trust`, please see the [authentication guide][data-node-authentication].

After making any of these changes, please restart your Postgres instance to ensure the
new settings take effect.

## Define the topology for your distributed database

Now that you have 3 running instances of TimescaleDB, you can go ahead
and set up your distributed database. Connect to `access.example.com`
as `postgres`, and create a new database `multinode`. It's important that
none of the instances already have a `multinode` database on them
before starting this step:

```sql
CREATE DATABASE multinode;
\c multinode postgres
CREATE EXTENSION timescaledb;
```

You can now add the data nodes to the access node:

```sql
SELECT add_data_node('dn1', host=>'data1.example.com');

SELECT add_data_node('dn2', host=>'data2.example.com');
```

The first argument is the local name of a data node on the access node. The
`host` parameter is the hostname or IP address of the data node.

You can check whether or not the data nodes have been connected successfully by
using our informational views:

```sql
SELECT * FROM timescaledb_information.data_node;
```

Now that we've created a database and added a couple data nodes,
let's go ahead and create a distributed hypertable. With the following
commands, we'll create a distributed hypertable for collecting
temperature readings from sensors:

```sql
CREATE TABLE conditions (time timestamptz NOT NULL, device integer, temp float);

SELECT create_distributed_hypertable('conditions', 'time', 'device');
```

This will partition the `conditions` table along one time dimension
(`time`) and one space dimension (`device`). By default, all
the data nodes are used.

Now, let's generate some sample data in insert it into the
`conditions` table:

```sql
INSERT INTO conditions
SELECT time, (random()*30)::int, random()*80
FROM generate_series('2019-01-01 00:00:00'::timestamptz, '2019-02-01 00:00:00', '1 min') AS time;
```

You can now check the configuration of the distributed hypertable and
how many chunks it holds by running the following:

```sql
SELECT * FROM timescaledb_information.hypertable;
```

You can also see how the data of a distributed hypertable is distributed
on the data nodes by using the `hypertable_data_node_relation_size` function:

```sql
SELECT * FROM hypertable_data_node_relation_size('distributed');
```

The data node view can also show how chunks are distributed across the
nodes:

```sql
SELECT * FROM timescaledb_information.data_node;
```

You can query the distributed hypertable as normal to see the data it
holds:

```sql
SELECT * FROM conditions;
```

That's it! You've now successfully created a distributed hypertable,
inserted data across multiple data nodes, and queried that data.


[architecture]: /introduction/architecture#timescaledb-clustering
[contact]: https://www.timescale.com/contact
[data-node-authentication]: /getting-started/setup/data-node-authentication
