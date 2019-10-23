# Scaling out using Distributed Hypertables

>:WARNING: Distributed hypertables are currently in PRIVATE BETA and
are not yet meant for production use. For more information, please
[contact us][contact].

Hypertables handle large amounts of data by breaking it up into
smaller pieces (chunks), allowing operations to execute
efficiently. When the amount of data is expected to be beyond what a
single machine can handle, you can distribute the data chunks over
several machines by using *distributed hypertables*. There are some
[limitations][distributed-hypertable-limitations] to using distributed
hypertables that might be good to review before getting
started. Distributed hypertables are otherwise similar to normal
hypertables, but they add an additional layer of hypertable
partitioning by distributing chunks across *data nodes*.

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

* A data node is represented on the access node by a local object that
  contains the configuration needed to connect to a database on a
  PostgreSQL instance. The [`add_data_node`][add_data_node] command is
  used to create this object.

* You should already have a running PostgreSQL server on an instance
  that will host a data node. The data node's database will
  be created when executing the [`add_data_node`][add_data_node]
  command on the access node and should _not_ exist prior to adding
  the data node.

* PostgreSQL instances that will act as data nodes are assumed to
  contain the same roles and permissions as the access node
  instance. Currently, such roles and permissions need to be created
  manually, although there is a [utility command][distributed_exec]
  that can be used to create roles and permissions across data nodes.

* A data node needs
  [`max_prepared_transactions`][max_prepared_transactions]
  set to a value greater than zero.

When creating the data node, you should:

* Run `add_data_node` as a superuser that can authenticate with the
  data node instance. This can be done by setting up either password
  or certificate [authentication][data-node-authentication].

* Provide a name to use when referring to the data node from
  the access node database.

* Provide the host name, and optionally port, of the PostgreSQL
  instance that will hold the data node.

After creating the data node:

* Ensure that non-superusers have `USAGE` privileges on the
  `timescaledb_fdw` foreign data wrapper and any
  data node objects they will use on the access node.

* Ensure that each user of a distributed hypertable has a way to
  [authenticate][data-node-authentication] with the data nodes they
  are using.

```sql
SELECT add_data_node('node1', host => 'dn1.example.com');

SELECT add_data_node('node2', host => 'dn2.example.com');
```

Deleting a data node is done by calling `delete_data_node`:

```sql
SELECT delete_data_node('node1');
```
>:TIP: A data node cannot be deleted if it contains data for a
hypertable, since otherwise data would be lost and leave the
distributed hypertable in an inconsistent state.

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
SELECT add_data_node('node3', host => 'dn3.example.com');

SELECT attach_data_node('node3', hypertable => 'conditions');
```

Once the data node has been attached, any new chunks will also be
distributed to the hypertable on the new data node.

In a similar way, if you want to remove a data node from a distributed
hypertable, you can use [`detach_data_node`][detach_data_node].

```sql
SELECT detach_data_node('node1', hypertable => 'conditions');
```

Note that you cannot detach a data node that still holds data for the
hypertable. However, if the distributed hypertable is subject to a
retention policy, it is possible to block new data on a data node and
wait until the existing data on the data node moves outside the
retention window. This is achieved by first blocking new chunks on the
data node:

```sql
SELECT block_new_chunks('node1', hypertable => 'conditions');
```

This will prohibit new data from being stored on the data node. Once
the data node's data is outside the retention window,
[`drop_chunks`][drop_chunks] can be used to delete the data on the data
node.

[add_data_node]: /api#add_data_node
[drop_chunks]: /api#drop_chunks
[distributed_exec]: /api#distributed_exec
[architecture]: /introduction/architecture#timescaledb-clustering
[attach_data_node]: /api#attach_data_node
[create_distributed_hypertable]: /api#create_distributed_hypertable
[creating-hypertables]: /getting-started/creating-hypertables
[delete_data_node]: /api#delete_data_node
[detach_data_node]: /api#detach_data_node
[timescaledb_information-data_node]: /api#timescaledb_information-data_node
[contact]: https://www.timescale.com/contact
[data-node-authentication]: /getting-started/data-node-authentication
[max_prepared_transactions]: https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-MAX-PREPARED-TRANSACTIONS
[distributed-hypertable-limitations]: /using-timescaledb/limitations#distributed-hypertable-limitations
