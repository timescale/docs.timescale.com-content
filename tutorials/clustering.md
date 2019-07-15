# Tutorial: Scaling out TimescaleDB

>:WARNING: Running TimescaleDB in a multi-node setup is currently in PRIVATE BETA.
This method of deployment is not meant for production use.

TimescaleDB can be run in a multi-node setup, with one primary access node distributing
writes and queries to multiple data nodes. For more information on the actual
underlying architecture, you can view our [architecture][architecture] section.

In this tutorial, we will show how you can create a distributed hypertable within
a distributed database. We will set up the distributed database with one primary access node
and two data nodes across three distinct TimescaleDB instances.

Prerequisites:
- 3 instances of TimescaleDB installed (private BETA branch only)
- A superuser set up on all 3 instances of TimescaleDB
- Network connectivity between the 3 TimescaleDB instances
- Must be on PG11

## Define the topology for your distributed database

Now that you have 3 running instances of TimescaleDB, you can go ahead and set up your
distributed database. Connect to the instance that you would like to act as the access node,
and create a new database there.

```sql
CREATE DATABASE multinode;
\c multinode
CREATE EXTENSION timescaledb;
```

Now, you can tell your access node that currently contains the multinode database to add
data nodes that it can use them to store distributed hypertables.

```sql
SELECT add_data_node('dn1',host=>'<address>', if_not_exists=>'true',
password=>'<remote_password>', bootstrap_user=>'<superuser>',
bootstrap_password=>'<superuser_password>');
SELECT add_data_node('dn2',host=>'<address>', if_not_exists=>'true',
password=>'<remote_password>', bootstrap_user=>'<superuser>',
bootstrap_password=>'<superuser_password>');
```

Let's go through exactly what the `add_data_node` command is doing. The first
argument represents the local name of a data node that you can use to refer to
data nodes when running commands on the access node. The `host` parameter is
what the access node will use to actually access the remote data node. The
`if_not_exists` parameter will bootstrap a database on the remote data node if
an associated database does not yet exist. The `password` parameter is used each
time the access node connects to a data node once the data node is created. This
`password` is associated with the current user of the system. The
`bootstrap_user` and `bootstrap_password` parameters are used when a data node is
initially logged into, and needs to be a superuser. If you're already logged in as a
superuser, the `bootstrap_user` and `bootstrap_password` parameters are optional.

You can check whether or not the data nodes have been connected successfully by
using our informational views.

```sql
SELECT * FROM timescaledb_information.data_node;
```

Now that we've created a database and connected a couple data nodes, let's go ahead
and create a distributed hypertable. With the following commands, we'll create
a hypertable and then distribute it.

```sql
CREATE TABLE distributed (time timestamptz NOT NULL, id integer, value numeric);
SELECT create_distributed_hypertable('distributed','time', 'id');
```

To check how your data is being distributed, let's generate some sample data.

```sql
WITH RECURSIVE CTE as (
  SELECT timestamptz '2019-01-01 00:00:00' as x, 3::int as y, 80.0::float as z
  UNION ALL
    SELECT x + interval '1 minute', (y+random()*10)::int, greatest(least((z+((random()-0.5)*1))::float,100::float), 0::float)
    FROM CTE where x < '2019-04-01'
)
INSERT INTO distributed SELECT * FROM CTE;

SELECT * FROM timescaledb_information.hypertable;
```

You can also check how you data is actually being distributed by running the following:

```sql
SELECT * FROM hypertable_relation_size('distributed');
```

That's it! You can now use TimescaleDB in a multi-node setup.


[architecture]: /introduction/architecture#timescaledb-clustering
