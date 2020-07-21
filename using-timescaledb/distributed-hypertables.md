# Distributed Hypertables

>:WARNING: Distributed hypertables are currently in BETA and
are not yet meant for production use. For more information, please
[contact us][contact] or join the #multinode-beta channel in our 
[community Slack][slack].

Hypertables handle large amounts of data by breaking it up into
smaller pieces (chunks), allowing operations to execute
efficiently. When the amount of data is expected to be beyond what a
single machine can handle, you can distribute the data chunks over
several machines by using *distributed hypertables*.

Distributed hypertables are otherwise similar to normal hypertables, but
distributed hypertables will also spread the chunks of a hypertable across
multiple data nodes. Thus to create a distributed hypertable, you need to have
added at least one data node before starting. Distributed hypertables are
typically also partitioned by an additional column, such as server or container
ID, device ID, or ticker symbol. It is not strictly required, but can improve
performance since individual time intervals are spread over several data nodes.

Data nodes together with an *access node* constitute the
multi-node TimescaleDB architecture
([architecture][]). All the nodes are TimescaleDB instances,
i.e., hosts with a running PostgreSQL server and loaded TimescaleDB extension.
While the data nodes store distributed chunks, the access node is
the entry point for clients to access distributed hypertables.

For more information about setting up a multi-node architecture, including
configuring access nodes and data nodes, please follow our [getting started
with multi-node instructions][getting-started-multi-node].

>:WARNING: There are some [limitations][distributed-hypertable-limitations] to
using distributed hypertables that might be good to review before getting
started.

### Creating Distributed Hypertables [](create)

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

### Changing the Number of Data Nodes for a Distributed Hypertable [](changing-data-nodes)

By default, distributed hypertables will use all available data nodes when
created. But, if you add new data nodes to the distributed database, they are
not automatically added to existing distributed hypertables, and you need to
explicitly attach them using [`attach_data_node`][attach_data_node].

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
[data retention policy][data-retention], it is possible to block new data
on a data node and wait until the existing data on the data node moves
outside the retention window. This is achieved by first
[blocking new chunks][block_new_chunks] on the data node:

```sql
SELECT block_new_chunks('node1', hypertable => 'conditions');
```

This will prevent data from being added or updated on the data node. Once
the data node's data is outside the retention window,
[`drop_chunks`][drop_chunks] can be used to delete the data on the data
node.

[getting-started-multi-node]: /getting-started/setup-multi-node
[add_data_node]: /api#add_data_node
[drop_chunks]: /api#drop_chunks
[block_new_chunks]: /api#block_new_chunks
[architecture]: /introduction/architecture#single-node-vs-clustering
[attach_data_node]: /api#attach_data_node
[create_distributed_hypertable]: /api#create_distributed_hypertable
[creating-hypertables]: /getting-started/creating-hypertables
[delete_data_node]: /api#delete_data_node
[detach_data_node]: /api#detach_data_node
[data-retention]: /using-timescaledb/data-retention
[distributed-hypertable-limitations]: /using-timescaledb/limitations#distributed-hypertable-limitations
[contact]: https://www.timescale.com/contact
[slack]: https://slack.timescale.com/
