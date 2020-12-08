# Setting up TimescaleDB 2.0 Multi-node on Timescale Forge

TimescaleDB 2.0  [introduces a number of new features][changes-in-tsdb2] 
to supercharge time-series data even further. One of the most anticipated new features 
is what we call **multi-node** - the ability to create a cluster of TimescaleDB 
instances to scale both reads and writes. 

In this how-to, we’ll show you how to create a multi-node cluster in your Timescale 
Forge account using TimescaleDB 2.0-RC3. 

This document details a “DIY” multi-node experience on Forge until the console UI 
provides thetools to do it. In the future we will offer a point-and-click multi-node 
experience within the Timescale Forge console UI, but we wanted to provide a way 
for users to setup and test this feature before that interface is available. 

If you’re ready to set up a TimescaleDB multi-node cluster as part of your Timescale 
Forge account, continue on! If you want to follow along but don't yet have a Timescale 
Forge account, [sign-up today for a 100% free, 30-day trial][sign-up]!

## Overview of multi-node setup

Multi-node clusters consist of at least two or more TimescaleDB instances 
(called **Services** in Timescale Forge). Each cluster has one access node (AN) 
and one or more data nodes (DN). As outlined in our [architecture blog posts][distributed-architechture], 
the access node is intended to be the only TimescaleDB instance that you or your 
applications connect to once the cluster is set up. It becomes the “brains” and 
traffic controller of all distributed hypertable activity. In contrast, data nodes 
are not intended to be accessed directly once joined to a multi-node cluster.

>:TIP:A proper TimescaleDB cluster should have at least two data nodes to begin 
realizing the benefits of distributed hypertables. While it is technically possible
to add just one data node to a cluster, this will often perform worse than a 
single TimescaleDB instance and is not recommended. 

## Step 1: Create Services for Access and Data node Services

First, you need to create new Services within your Forge account. As mentioned 
earlier, you should create _at least_ three Services to set up a multi-node cluster: 
one access node and two data nodes. 

Because there is currently no way to distinguish between the access node and data 
nodes within the Timescale Forge console, **we strongly recommend that you include 
“AN” and “DN” in the names of each service, respectively (eg. “AN-mycluster”, 
“DN1-mycluster”, “DN2-mycluster”, etc.)**. Again, remember that Services can only
assume one role in a cluster (access or data node), and only one Service can act 
as the access node.

For simplicity you can start with the same hardware configuration for all the 
Services. On Timescale Forge, Service configuration can be modified later to better 
tune access and data node requirements.

>:TIP:More advanced users might consider using larger disks on data nodes (this is 
where the distributed hypertable data is stored) and more memory and CPU for the 
access node.


## Step 2: Upgrade the Services to v2.0

Currently, any newly created Service in Timescale Forge still uses TimescaleDB 
1.7.4 by default. This will be the case until we release TimescaleDB 2.0 for 
production (sometime in late December 2020). Therefore,  to enable multi-node 
functionality, you need to manually upgrade each TimescaleDB Service to the newest 
 TimescaleDB 2.0 version available, currently Release Candidate 3 (RC3).

To do this, we recommend using `psql` to connect to all Services created in Step 1 
and running an extension update command.

```bash
psql -X -h {hostname} -p {port} tsdb tsdbadmin
```

There are a few things to note when running this command on Forge.

 * First, note that we’ve passed the `-X ` parameter to `psql`. This prevents `psql`
  from preloading the existing extension which would block the update command. 
 * Second, you must connect with the `tsdbadmin` user for this update to work on 
 your Timescale Forge Services.

Once you are connected to each service, immediately run the following SQL command 
to update TimescaleDB version to 2.0:

```SQL
ALTER EXTENSION timescaledb UPDATE TO "2.0.0-rc3"; 
```

**Note: that the above command has to be the first command to run once you’ve connected**.

To verify that the update was successful, run the `\dx` command to list the version 
of TimescaleDB that is currently active in the database. You should see “2.0.0-rc3” 
listed under “Version” as shown below.

```bash
tsdb=> \dx
                       List of installed extensions
    Name     |  Version  |   Schema   |       Description                            
-------------+-----------+------------+---------------------------------------
 plpgsql     | 1.0       | pg_catalog | PL/pgSQL procedural language
 timescaledb | 2.0.0-rc3 | public     | Enables scalable inserts and complex queries for time-series data
```

## Step 3: Add Data Nodes to the cluster

Once you’ve created your new Services and upgraded TimescaleDB, you’ll enable 
communication between the access node and all data nodes. The currently supported 
method for enabling communication between nodes is through **user mapping authentication**.

This is also a manual process for now.  As we continue to develop Timescale Forge
and multi-node functionality, this process will be a much smoother user experience,
completed directly from the Timescale Forge Console.


### About user mapping authentication

We currently support **user mapping authentication** because it allows users to 
continue connecting with the `tsdbadmin` PostgreSQL user for all data access and
cluster management. It also allows you to continue making secure (SSL) connections
to your Timescale Forge Access node. 

With user mapping authentication, you don’t need to manage any new users, however, 
**you  need to have the passwords for the `tsdbadmin` user from each data node at hand**. 

The main limitation of this approach is that any password changes to the connected
`tsdbadmin` user on a data node will break the mapping connection and impact normal 
cluster operations. Any time a password is changed on a data node, you'll need to 
complete the mapping process outlined below must be done again to re-establish the
connection between the access node and the affected data node. [You can read about 
user mapping in the PostgreSQL documentation][postgres-user-mapping].

### Step 3a: Add each data node

Connect to the access node using the `tsdbadmin` user and add a data node to our 
cluster. Make sure to have the password for the `tsdbadmin` user **_of each data node_** 
you are adding.

```SQL
psql -h {AN hostname} -p {port} tsdb tsdbadmin

SELECT add_data_node('dn1', host => 'your_DN1_hostname', port => port_number_here , password => 'tsdbadmin_user_password_for_DN1', bootstrap => false);
```

To list added data nodes we can run `\des+` command if using `psql`. 

```bash
tsdb=> \des+
List of foreign servers
-[ RECORD 1 ]--------+------------------------------------------------------------------------------------
Name                 | dn1
Owner                | multinode
Foreign-data wrapper | timescaledb_fdw
Access privileges    | 
Type                 | 
Version              | 
FDW options          | (host 'fd71nenmk8.c8mhe44nad.dev.metronome-cloud.com', port '34612', dbname 'tsdb')
Description          | 
```

### Step 3b: Add a User Mapping for each data node

Now we can create a `USER MAPPING `that will enable communication between the 
access node and data node.

```SQL
CREATE USER MAPPING FOR tsdbadmin SERVER dn1 OPTIONS (user 'tsdbadmin', password 'tsdbadmin_user_password_for_DN1');
```

Repeat these steps for each additional data node that you want to add to the 
cluster. **Always invoke these commands from the access node!**

## Step 4: Create a distributed hyptertable

Finally, can create a distributed hypertable and add data to verify everything is
set up and working correctly.

```SQL
-- Create your regular table
CREATE TABLE sensor_data (
  time TIMESTAMPTZ NOT NULL,
  sensor_id INTEGER,
  temperature DOUBLE PRECISION,
  cpu DOUBLE PRECISION
);

-- Convert the table to a distributed hypertable
SELECT create_distributed_hypertable('sensor_data', 'time', 'sensor_id');

-- Insert some test data to verify you are error free
INSERT INTO sensor_data VALUES  ('2020-12-09',1,32.2,0.45);
```

One major point to recognize about the SQL above is the declaration of a partition 
column (`sensor_id`) for the distributed hypertable. This is intentional, and 
**recommended**, for distributed hypertable setups. Previously, with regular, 
single-node hypertables, there was often little benefit in specifying a partition 
key when creating the hypertable. With distributed hyptertables, however, adding
a partition key is essential to ensure that data is distribute across data nodes 
on something more than just time. Otherwise, all data for a specific time range 
will go to one chunk on one node, rather than being distributed across each data 
node for the same time range.

### Adding another user (optional)

One of the other advantages of user mapping based approach allows us to add 
additional users to the multi-node cluster.

From the **access node**, create a new user and GRANT all privileges. 

```SQL
CREATE ROLE mn_user1 LOGIN PASSWORD 'password';
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mn_user1;
```

While connected to the access node we can use a specially designed function to 
execute SQL commands against data nodes:

```SQL
CALL distributed_exec(query => 'CREATE ROLE mn_user1 LOGIN PASSWORD $$password$$', node_list => '{dn1}');
CALL distributed_exec(query => 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mn_user1;', node_list => '{dn1}');
```

Finally we add a user mapping for our newly added user so that the AN can connect 
to the DN with the new user.

```SQL
CREATE USER MAPPING FOR mn_user1 SERVER dn1 OPTIONS (user 'mn_user1', password 'password');
```

A few final reminders as you begin to explore the opportunities of a multi-node server:

1. Multi-node clusters can still use _regular_, non-distributed features like 
regular hypertables, PostgreSQL tables, and continuous aggregations. The data 
stored in any of these object will reside only on the access node.
2. There is no limitation on the number of distributed hypertables a user can 
create on the access node.
3. Finally, remember that once a Service is marked as an access node or data node,
 it cannot be used to create another TimescaleDB cluster. 

## Summary

Now that you have a basic TimescaleDB multi-node cluster, consider using one of 
our [large sample datasets][sample-data]
to create more distributed hypertables, or consider using your new cluster 
as a target for Prometheus data via [Promscale][promscale].
Whatever your time-series data need, TimescaleDB multi-node opens up an entirely 
new level of opportunity for your time-series data.

And as always, consider joining our vibrant community [Slack channel][slack] to ask
questions and learn from Timescale staff and other community members. 

[sign-up]: https://forge.timescale.com/signup
[timescale-forge-setup]: /getting-started/exploring-forge
[slack]: https://slack.timescale.com/
[changes-in-tsdb2]: /release-notes/changes-in-timescaledb-2
[distributed-architechture]: https://blog.timescale.com/blog/building-a-distributed-time-series-database-on-postgresql/
[postgres-user-mapping]: https://www.postgresql.org/docs/current/view-pg-user-mappings.html
[sample-data]: /tutorials/other-sample-datasets
[promscale]: https://github.com/timescale/promscale