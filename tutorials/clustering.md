# Scaling out across multiple nodes

>:WARNING: Running TimescaleDB in a multi-node setup is currently in PRIVATE BETA.
This method of deployment is not meant for production use.

Now that you have installed TimescaleDB and know how to create hypertables,
we are going to go ahead and create a new distributed hypertable.

First, you need to create a distribute database that contains your distributed
hypertable.

1. TimescaleDB installed on at least 2 nodes. In this tutorial, we will
distribute our hypertable across 2 nodes, so we will spin up 3 nodes here

First, you are going to create a distributed database and
