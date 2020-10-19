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

### Native Replication for Distributed Hypertables [](native-replication)

A hypertable can have a *replication factor* that tells how many
replicas of chunks that should be created. The default replication
factor is 1, which means that each row of data is written to a single
chunk. If you set the replication factor of a hypertable to a higher
value, chunks will be replicated and each row of data will be written
to that many chunks.

To create a hypertable with a replication factor higher than 1, you
can use the `replication_factor` parameter to
[`create_distributed_hypertable`][create_distributed_hypertable]. For
example, if you want to create a hypertable where each chunk has three
replicas:

```sql
SELECT create_distributed_hypertable('conditions', 'time', 'location',
	replication_factor => 3);
```

If you already have a hypertable and instead want to change the
replication factor, you can use the function
[`set_replication_factor`][set_replication_factor].

```sql
SELECT set_replication_factor('conditions', 3);
```

Having a replication factor larger than one is a simple way to ensure
that you have redundancy of the data and that a crash of a data node
will not cause you to lose the data. This, however, comes at the cost
of an increased average commit time and more data to manage.

Read-only query execution is not affected by the redundant data: the
query will just be split up and send the sub-query to *one* of the
replicas (not all of them), so the replication factor does not affect
query execution time in any significant manner.

When executing a commit on the access node, the commit will
acknowledge the transaction until it has received acknowledgements
that the transaction is committed on all data nodes. If the
transaction fails on one more data nodes, or a connection times out,
the transaction will be aborted.

#### Limitations

The distributed commit protocol is stable and ensures transactional
semantics even in the presence of data node failures, but if a data
node crashes permanently, it has to be replaced with a new data node
that is consistent with the other data nodes.

To be able to recover the system into a operational state, you
therefore have to ensure that you have a standby of each data node. On
failure, you then need to promote it to be the primary and add a new
standby to handle further crashes. The standby can be either a
[warm][warm-standby] or a [hot standby][hot-standby].

[hot-standby]: https://www.postgresql.org/docs/current/hot-standby.html
[warm-standby]: https://www.postgresql.org/docs/current/warm-standby.html
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
