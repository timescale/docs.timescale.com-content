# Scaling out using Distributed Hypertables

TimescaleDB supports multi-node clustering by leveraging the hypertable and chunk primitives.
Hypertables are used to handle large amount of data by breaking it up
into smaller pieces (chunks), allowing operations to execute efficiently. When
the amount of data is expected to be beyond what a single machine can handle,
you can distribute the data chunks over several machines by using
*distributed hypertables*.
Distributed hypertables are similar to normal hypertables, but they
add an additional layer of hypertable partitioning by distributing chunks
across *data nodes*.

In the multi-node topology ([architecture][]), all nodes are TimescaleDB instances.
The data are distributed and stored in TimescaleDB instances, called data nodes.
The distributed data are accessed through a distributed hypertable
on another TimescaleDB instance, called the *access node*.
The access node is the entry point for any access to data in the cluster.

## Working with Data Nodes

Data nodes act as the containers for the hypertable chunks and are
necessary to create distributed hypertables. Data nodes are
added to the current database using [`add_data_node`][add_data_node]
and removed using [`delete_data_node`][delete_data_node].

Note that:

* Data nodes are added as objects locally and just connect to an
  existing database server.

* You should already have a running database server on some host.

When creating the data node, you should:

* Provide a name to use when referring to the data node from
  this database.

* Provide the host where the hypertable partition for the distributed
  hypertable should be stored.

* Ensure that the user used for connecting to the data node has
  `CREATEDB` permissions or be a superuser. This is necessary since
  `create_distributed_hypertable` expect to be able to create a
  database on the remote data node.

```sql
SELECT add_data_node('node1', host => 'dn1.example.com');
SELECT add_data_node('node2', host => 'dn2.example.com');
```

Deleting a data node is done in a similar manner.

```sql
SELECT delete_data_node('node1');
```
>:TIP: Note that a data node cannot be deleted if it contains data for a
hypertable.

### Information Schema for Data Nodes

The data nodes that have been added to the database can be found by
querying the
[`timescaledb_information.data_node`][timescaledb_information-data_node] view.

## Working with Distributed Hypertables

As previously mentioned, distributed hypertables are similar to normal
hypertable with the difference that distributed hypertables will
partition the data and store it on remote data nodes. This means that
to create a distributed hypertable, you need to have added at least one data node
before starting.

### Creating Distributed Hypertables

As with normal hypertables, start by creating a regular
table to hold the data, then transform it into a distributed
hypertable. In contrast to when creating a normal hypertable, we use
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

You can now insert data into the distributed hypertable and
it will automatically be partitioned on the available data nodes. You
can find more information for how work with data in hypertables in the
section [Creating Hypertables][creating-hypertables].

### Changing the Number of Data Nodes for a Distributed Hypertable

By default, distributed hypertables will use all available data nodes,
but individual data nodes can be added and removed from already
created distributed hypertables using
[`attach_data_node`][attach_data_node] and
[`detach_data_node`][detach_data_node].

For example, if you add a new data node to the cluster, it will not automatically be
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
