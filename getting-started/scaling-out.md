# Scaling out using Distributed Hypertables

TimescaleDB supports multi-node clustering by leveraging the hypertable and chunk primitives.
Hypertables are used to handle large amount of data by chunking it up
in smaller pieces, chunks, allowing operations to execute efficiently. When
the amount of data grows beyond what you can handle with a single
machine, you can distribute the data chunks over several machines by using
*distributed hypertables*.

Distributed hypertables are similar to normal hypertables, but they
add an additional layer of partitioning of the hypertable by distributing chunks 
across *data nodes*.

In the multi-node topology ([architecture][]), all nodes are TimescaleDB instances.
The data are distributed and stored in TimescaleDB instances, called data nodes.
The distributed data are accessed through distributed hypertable
on another TimescaleDB instance, called *access node*.
The access node is entry point for any access to data in the cluster.

![Deployment diagram for distributed hypertables]()

## Working with Data Nodes

Data nodes act as the containers of the hypertable chunks and are
necessary to be able to create distributed hypertables. Data nodes are
added to the current database using [`add_data_node`][add_data_node]
and removed using [`delete_data_node`][delete_data_node].

Note that a data node is local object on the access node that points to another database, 
typically on a remote host. The host could, however, be the same as the access node; 
this allows setting up a distributed database on a single server for, e.g., testing purposes. 
To achieve scale-out, however, each data node should be 
their own physical server with separate CPU and disk resources.

When creating the
data node, you should provide a (local) name to use when referring to
the data node as well as the host to connect to.

```sql
SELECT add_data_node('node1', host => 'dn1.example.com');
SELECT add_data_node('node2', host => 'dn2.example.com');
```

Deleting a data node is done in a similar manner.

```sql
SELECT delete_data_node('node1');
```

Note that a data node cannot be deleted if it contains data for a
hypertable.

### Information Schema for Data Nodes

The data nodes that have been added to the database can be found by
querying the `timesscaledb_information.data_node` view.

| Column            | Type    | Description                                               |
|-------------------|---------|-----------------------------------------------------------|
| `node_name`       | name    | Data node name                                            |
| `owner`           | oid     | Oid of the user, who added the data node                  |
| `options`         | text[]  | Options used when creating the data node                  |
| `node_up`         | boolean | Data node responds to ping                                |
| `num_dist_tables` | bigint  | Number of distributed hypertables that use this data node |
| `num_dist_chunks` | numeric | Total number of chunks stored in data node                |
| `total_dist_size` | text    | Total amount of data stored in data node                  |

## Working with Distributed Hypertables

As previously mentioned, distributed hypertables are similar to normal
hypertable with the difference that distributed hypertables will
store chunks across remote data nodes instead of locally.
This means that
to create a hypertable, you need to have added at least one data node
before starting to create distributed hypertables.

### Creating Distributed Hypertables

As with normal hypertables, you have to start by creating a regular
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

You can now start inserting data into the distributed hypertable and
it will automatically be partitioned on the available data nodes. You
can find more information for how work with data in hypertables in the
chapter [Creating Hypertables][creating-hypertables].

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

If a data node is storing data for a hypertable and is not replicated,
then you will get an error.

```
postgres=# select detach_data_node('node1', hypertable => 'conditions');
ERROR:  detaching data node "node1" would mean a data-loss for hypertable "conditions" since data node has the only data replica
HINT:  Ensure the data node "node1" has no non-replicated data before detaching it.
```

[architecture]: /introduction/architecture#timescaledb-clustering
[attach_data_node]: /api#attach_data_node
[creating-hypertables]: /getting-started/creating-hypertables
[detach_data_node]: /api#detach_data_node
