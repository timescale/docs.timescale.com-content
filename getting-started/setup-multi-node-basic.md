# Set up multi-node TimescaleDB [](basic-multi-node-setup)

A multi-node TimescaleDB implementation consists of: 
- One access node to handle ingest, data routing and act as an entry 
point for user access; 
- One or more data nodes to store and organize distributed data.     

All nodes begin as single-node TimescaleDBs, i.e., hosts with a running 
PostgreSQL instance and a loaded TimescaleDB extension. This is assumed for 
"access node" and "data node" in the instructions. More detail on 
the architecture can be found in the [Architecture][architecture] section.

TimescaleDB multi-node can be created as part of a self-managed deployment
or (coming soon) as a managed cloud deployment.  In order to set up a
self-managed cluster, including how to configure the nodes for secure
communication and creating users/roles across servers, please follow
[these instructions][advanced setup].

In the case of Timescale Cloud and Forge, the created services already contain
PostgreSQL with TimescaleDB loaded and the created user `tsdbadmin` as superuser.
In this case, all you will need to do is decide which service should be the access
node, and follow the instructions in the next section.  More information will be
forthcoming as TimescaleDB multi-node is made available on these cloud platforms.

## Initialize data nodes from the access node [](init_data_nodes_on_access_node)
While connected to the access node (psql), use the command:

```sql
SELECT add_data_node('example_node_name', host => 'example_host_address');
```

`example_node_name` should be a unique name for the node. `example_host_address` 
is the host name or IP address of the data node.

The system should be up and running at this point.

## (Optional) Add user roles to the distributed database

After adding your data nodes, it is possible to create and use distributed hypertables,
but only if running as a superuser common to all nodes (e.g., by default,
the `postgres` user).

If using a self-managed multi-node cluster, you may wish to create new users with
multi-node access, or add access to existing roles.  Please refer to the following
sections depending on the authentication mechanism you are using:
- Adding roles using [trust authentication][trust_role_setup]
- Adding roles using [password authentication][password_role_setup]
- Adding roles using [certificate authentication][certificate_role_setup]

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
[trust_role_setup]: /getting-started/setup-multi-node-basic/setup-multi-node-auth#multi-node-auth-trust-roles
[password_role_setup]: /getting-started/setup-multi-node-basic/setup-multi-node-auth#multi-node-auth-password-roles
[certificate_role_setup]: /getting-started/setup-multi-node-basic/setup-multi-node-auth#multi-node-auth-certificate-roles
[postgresql-hba]: https://www.postgresql.org/docs/current/auth-pg-hba-conf.html
[max_prepared_transactions]: https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-MAX-PREPARED-TRANSACTIONS
[distributed hypertables]: /using-timescaledb/distributed-hypertables
[add_data_node]: /api#add_data_node
[attach_data_node]: /api#attach_data_node
[delete_data_node]: /api#delete_data_node
[detach_data_node]: /api#detach_data_node
[distributed_exec]: /api#distributed_exec