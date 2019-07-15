# Scaling out using Distributed Hypertables

>:WARNING: Running TimescaleDB in a multi-node setup is currently in PRIVATE BETA.
This method of deployment is not meant for production use. For more information, please
[contact us][contact].

TimescaleDB supports multi-node clustering by leveraging the hypertable and chunk primitives.
Hypertables are used to handle large amount of data by breaking it up
into smaller pieces (chunks), allowing operations to execute efficiently. When
the amount of data is expected to be beyond what a single machine can handle,
you can distribute the data chunks over several machines by using
*distributed hypertables*.
Distributed hypertables are similar to normal hypertables, but they
add an additional layer of hypertable partitioning by distributing chunks
across *data nodes*.

Data nodes together with an *access node* constitute a distributed database
([architecture][]). All the nodes are TimescaleDB instances,
i.e., hosts with a running PostgreSQL server and loaded TimescaleDB extension.
While the data nodes store distributed chunks, the access node is
the entry point for clients to access distributed hypertables.

## Working with Data Nodes

Data nodes act as containers for hypertable chunks and are
necessary to create distributed hypertables. Data nodes are
added to a distributed database on an access node
using [`add_data_node`][add_data_node]
and removed using [`delete_data_node`][delete_data_node].

Note that:

* Data nodes are added as objects locally and connect to an
  existing PostgreSQL instance.

* You should already have a running PostgreSQL server on the data node host.

* Ensure that the data node has password authentication enabled
  in their `pg_hba.conf` files for any non-superusers.

When creating the data node, you should:

* Provide a name to use when referring to the data node from
  this database.

* Provide the host where the hypertable partition for the distributed
  hypertable should be stored.

* Provide the remote password, which will be used by the current user
  during access to the created remote data node.

* Provide a bootstrap user and password, which is used to
  create the data node. If the current user can be used, then
  the boostrap user and password can be omitted.

* Ensure that the bootstrap user used for connecting to the data node
  is a superuser.
  This is necessary since
  `add_data_node` expects to be able to create a
  database on the remote data node and create
  a TimescaleDB extension within it.

* Ensure that the local user has `USAGE` privileges on the `timescaledb_fdw`
  foreign data wrapper on the access node.

```sql
SELECT add_data_node('node1', host => 'dn1.example.com',
  password=>'<remote_password>', bootstrap_user=>'<superuser>',
  bootstrap_password=>'<superuser_password>');
SELECT add_data_node('node2', host => 'dn2.example.com',
  password=>'<remote_password>', bootstrap_user=>'<superuser>',
  bootstrap_password=>'<superuser_password>');
```

Any additional users that will access a distributed hypertable currently
need their own user mappings per data node with a `user` and `password` option.
A user mapping can be created for a data node as follows:

```sql
CREATE USER MAPPING FOR <another_user> SERVER node1
  OPTIONS (user '<remote_user>' password '<remote_password>');
```
The additional users also need `USAGE` permissions on the `timescaledb_fdw`
foreign data wrapper and any data node (server) objects.

Deleting a data node is done by calling `delete_data_node`:

```sql
SELECT delete_data_node('node1');
```
>:TIP: Note that a data node cannot be deleted if it contains data for a
hypertable, since otherwise data would be lost.

### Information Schema for Data Nodes

The data nodes that have been added to the distributed database
can be found by querying the
[`timescaledb_information.data_node`][timescaledb_information-data_node] view.

## Working with Distributed Hypertables

As previously mentioned, distributed hypertables are similar to normal
hypertables with the difference that distributed hypertables will
partition the data and store it on remote data nodes. This means that
to create a distributed hypertable, you need to have added at least one data node
before starting.

### Creating Distributed Hypertables

As with normal hypertables, start by creating a regular
table to hold the data, then transform it into a distributed
hypertable. In contrast to creating a normal hypertable, we use
the function
[`create_distributed_hypertable`][create_distributed_hypertable].

```sql
CREATE TABLE conditions (
  time        TIMESTAMPTZ       NOT NULL,
  location    TEXT              NOT NULL,
  temperature DOUBLE PRECISION  NULL,
  humidity    DOUBLE PRECISION  NULL
);

SELECT create_distributed_hypertable('conditions', 'time', 'location');
```

>:WARNING: If there are no data nodes available, you will get an error
>when executing `create_distributed_hypertable` and the distributed
>hypertable will not be created.

This creates a multi-dimensional distributed hypertable
partitioned along `time` and `location`.
You can now insert data into the distributed hypertable and
it will automatically be partitioned on the available data nodes
by using the provided space partition. You
can find more information for how to work with data in hypertables in the
section [Creating Hypertables][creating-hypertables].

### Changing the Number of Data Nodes for a Distributed Hypertable

By default, distributed hypertables will use all available data nodes,
but individual data nodes can be added and removed from already
created distributed hypertables using
[`attach_data_node`][attach_data_node] and
[`detach_data_node`][detach_data_node].

For example, if you add a new data node to the distributed database,
it will not automatically be
added to existing distributed hypertables, so it is necssary to attach
it explicitly.

```sql
SELECT add_data_node('node3', host => 'dn3.example.com',
  password=>'<remote_password>', bootstrap_user=>'<superuser>',
  bootstrap_password=>'<superuser_password>');
SELECT attach_data_node('node3', hypertable => 'conditions');
```

Once the data node has been attached, any new chunks will also be
distributed to the hypertable on the new data node.

In a similar way, if you want to remove a data node from a distributed
hypertable, you can use [`detach_data_node`][detach_data_node].

```sql
SELECT detach_data_node('node1', hypertable => 'conditions');
```

If a data node is storing data for a hypertable,
then you will get an error.

```sql
SELECT detach_data_node('node1', hypertable => 'conditions');
ERROR:  detaching data node "node1" would mean a data-loss for hypertable "conditions" since data node has the only data replica
HINT:  Ensure the data node "node1" has no non-replicated data before detaching it.
```

[add_data_node]: /api#add_data_node
[architecture]: /introduction/architecture#timescaledb-clustering
[attach_data_node]: /api#attach_data_node
[create_distributed_hypertable]: /api#create_distributed_hypertable
[creating-hypertables]: /getting-started/creating-hypertables
[delete_data_node]: /api#delete_data_node
[detach_data_node]: /api#detach_data_node
[timescaledb_information-data_node]: /api#timescaledb_information-data_node
[contact]: https://www.timescale.com/contact
