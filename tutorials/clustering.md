# Tutorial: Scaling out TimescaleDB

>:WARNING: Distributed hypertables are currently in BETA and
are not yet meant for production use. For more information, please
[contact us][contact] or join the #multinode-beta channel in our 
[community Slack][slack].

TimescaleDB can be run in a multi-node setup, with one primary access node distributing
writes and queries to multiple data nodes. For more information on the actual
underlying architecture, you can view our [architecture][architecture] section.

This tutorial will walk you through setting up a three-node distributed
database and creating a distributed hypertable. You will learn how to enable
password authentication and add new roles to your distributed database.

## Setting up

It is assumed before starting this tutorial you will have three networked machines set up with:
- TimescaleDB version 2.0 (beta) or greater
- PostgresSQL 12 or 11

For the sake of this tutorial we will refer to these machines as
`access.example.com`, `data1.example.com`, `data2.example.com`. You will also
need a common superuser role on each postgres instance. This tutorial
will assume the `postgres` role for this, but you may substitute any
role common to all machines with superuser permission.

### Update your Postgres configuration

First of all, if you haven't yet run the `timescaledb-tune` utility, it's
highly recommended that you do so before starting. Do this for all of your
nodes.
```bash
sudo timescaledb-tune
```

In addition, make sure you've enabled prepared transactions on your data
nodes. This is essential for allowing Timescale distributed transactions to
work. Prepared transactions are disabled by default, so make sure you have
this line in `postgresql.conf` on every data node.
```
max_prepared_transactions = 150
```

To achieve good query performance you need to enable partitionwise aggregation,
at least on the access node. This pushes down aggregation queries to the 
data nodes. This setting can be enabled in a session or, ideally, in 
`postgresql.conf`:

```
enable_partitionwise_aggregate = on
```


### Set password encryption

You are now ready to set up the network communication between the nodes and
add authentication. For more details and options for this step, please visit
the [data node authentication][data-node-authentication] page.

In this example you'll be adding `scram-sha-256` password authentication to your
nodes. The first step of this is to enable password encryption on all the nodes
by adding the following to `postgresql.conf`:

```
password_encryption = 'scram-sha-256'
```

>:WARNING: This setting is not automatically applied to any existing passwords.
Any existing roles will have to update to new passwords to take advantage of
the encryption. You can do this in Postgres by using the [`ALTER ROLE` command][postgres-alterrole]
to specify the new password (this can be the same as the old password).

After making this change, restart the postgres service so the changes made so
far can take effect.

### Set up the access node

The next step is to enable `access.example.com` to send the passwords for the
users of the system. Create a new file `passfile` in the Postgres data
directory, and add the following lines:
```
*:*:*:postgres:postgres
*:*:*:testuser:testpass
```

This will result in the access node always using password `postgres` for role
`postgres` and `testpass` for role `testuser` whenever connecting to any data
node. You'll be creating this `testuser` role later in this tutorial. Make sure
that this file is readable by system user who will be running the postmaster.

### Set up the data nodes

Next we will set up the data nodes to accept incoming connections from the
access node for the expected roles. The first thing you need to do here is
to make sure that Postgres will listen for incoming connections. Add the
following to `postgresql.conf`:
```
listen_addresses = '*'
```

Next, add the roles you want to allow to `pg_hba.conf`:
```
host    all    postgres    access.example.com    scram-sha-256
host    all    testuser    access.example.com    scram-sha-256
```

This allows connections to the `postgres` and `testuser` roles, but only from
the access node, and only using `scram-sha-256` authentication.

Finally, make sure that the `postgres` role's password matches the password in
the `passfile` on the access node. Run the following postgres command on all of
your data nodes.

```sql
ALTER ROLE postgres PASSWORD 'postgres';
```

Note that if you did not restart postgres after changing the
`password_encryption` above, the password will not be properly encrypted and
you will not be able to connect to this data node as `postgres`. In that case
simply rerun the command once Postgres is running with the proper password
encryption.

Restart Postgres on all of your nodes one more time to ensure it is running
with the proper configuration.

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

### Add data nodes

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

### Create a new role

Now that you have created a database and added a couple data nodes, let's go
ahead and create a new user role we can use for our distributed database.
You can use Timescale's `distributed_exec` function to perform this action on
the data nodes:
```sql
CREATE ROLE testuser WITH LOGIN PASSWORD 'testpass';
SELECT * FROM distributed_exec($$ CREATE ROLE testuser WITH LOGIN PASSWORD 'testpass' $$);
```

This creates the same user role on all the data nodes. It is important that
the user is created with `LOGIN` permission for them to perform distributed
operations. Note that the text of the command, including the password, is sent
over the network to the data node, so you may want to make sure you've
configured postgres to use SSL before running such commands in production.

The last necessary step is to grant this user access to Postgres's
foreign server objects:
```sql
GRANT USAGE ON FOREIGN SERVER dn1, dn2 to testuser;
```

### Create the distributed hypertable

Now you can log in as the new `testuser` and create a distributed hypertable.
With the following commands, we'll create a distributed hypertable for
collecting temperature readings from sensors:

```sql
SET ROLE testuser;
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

### View data distribution

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
[data-node-authentication]: /getting-started/setup/data-node-authentication
[postgres-alterrole]: https://www.postgresql.org/docs/current/sql-alterrole.html
[contact]: https://www.timescale.com/contact
[slack]: https://slack.timescale.com/
