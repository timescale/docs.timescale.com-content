# Set up multi-node TimescaleDB [](basic-multi-node-setup)

A multi-node TimescaleDB implementation consists of: 
- One access node to handle ingest, data routing and act as an entry 
point for user access; 
- One or more data nodes to store and organize distributed data.     

All nodes begin as single-node TimescaleDBs, i.e., hosts with a running 
PostgreSQL instance and a loaded TimescaleDB extension. This is assumed for 
"access node" and "data node" in the instructions. More detail on 
the architecture can be found in the [Architecture][architecture] section.

The multi-node can be created as self-managed or hosted on Timescale Cloud or Forge.

The prerequisites for creating multi-node setup are:
- One PostgreSQL instance to act as an access node
- One or more PostgreSQL instances to act as data nodes
- TimescaleDB [installed][install] and [set up][setup] on all nodes
- Access to a superuser role (e.g. `postgres`) on all nodes

In the case of Timescale Cloud and Forge the created services will already contain
PostgreSQL with TimescaleDB loaded and the created user `tsdbadmin` is superuser.
Then after deciding which service node is an access node and which are data nodes, follow
the instruction to [Initialize data nodes from the access node](#init_data_nodes_on_access_node).

For self-managed multi-node the steps for creating a basic multi-node setup are as follows:

## Basic setup
1. Configure data nodes for communication with the access node
1. Initialize data nodes from the access node 

### Prerequisites

### 1. Configure data nodes for node-to-node communication
To enable communication between the access node and the data nodes, data 
nodes must be configured to authorize connections from the access node.  The 
simplest way is to use "trust" authentication which provides unencumbered client 
access to the nodes. This method must be applied to every data node.

>:WARNING: The "trust" authentication method allows insecure access to all 
nodes.  For production implementations, please use more secure 
methods of authentication (see [advanced setup][] for examples).

#### Edit authentication configuration file on data nodes
Client authentication is usually configured in the `pg_hba.conf`([reference doc]
[postgresql-hba]) file located in the data directory.  If the file is not located 
there, connect to the instance with `psql` and execute the command:

```sql
SHOW hba_file;
``` 

To enable "trust" authentication, add a line to `pg_hba.conf` to allow
access to the instance. Ex: for an access node ip address `192.0.2.20`:

```
# TYPE  DATABASE  USER  ADDRESS      METHOD
host    all       all   192.0.2.20   trust
```

#### Edit main configuration
It is necessary to change the parameter `max_prepared_transactions` to a 
non-zero value if it hasn't been changed already ('150' is recommended). The 
parameter is located in `postgresql.conf`, typically in the data directory. If it 
isn't there, connect to the node (`psql`) and get the path with:

```
SHOW config_file;
```

##### Reload server configuration

To reload the server configuration, you can use the following command
on the data node:

```
pg_ctl reload
```

### 2. Initialize data nodes from the access node [](init_data_nodes_on_access_node)
While connected to the access node (psql), use the command:

```sql
SELECT add_data_node('example_node_name', host => 'example_host_address');
```

`example_node_name` should be a unique name for the node. `example_host_address` 
is the host name or IP address of the data node.

The system should be up and running at this point.

---
## Next steps
To start using the database, see the page on [distributed hypertables][].

To further configure the system (set up secure node-to-node communication, add 
additional users/roles) see [advanced setup][].

All functions for modifying the node network are described in the API
docs:
- [add_data_node][]
- [attach_data_node][]
- [delete_data_node][]
- [detach_data_node][]
- [distributed_exec][]

[architecture]: /introduction/architecture#single-node-vs-clustering
[install]: /getting-started/installation
[setup]: /getting-started/setup
[advanced setup]: /getting-started/setup-multi-node-basic/setup-multi-node-auth
[postgresql-hba]: https://www.postgresql.org/docs/current/auth-pg-hba-conf.html
[max_prepared_transactions]: https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-MAX-PREPARED-TRANSACTIONS
[distributed hypertables]: /using-timescaledb/distributed-hypertables
[add_data_node]: /api#add_data_node
[attach_data_node]: /api#attach_data_node
[delete_data_node]: /api#delete_data_node
[detach_data_node]: /api#detach_data_node
[distributed_exec]: /api#distributed_exec