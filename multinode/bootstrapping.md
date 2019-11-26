# Data Node Bootstrapping [](distdb-bootstrap)

Scaling up TimescaleDB is achieved by adding data nodes to an access
node using the [`add_data_node`][add_data_node] and
[`attach_data_node`][attach_data_node] functions. In order for a data
node to be available to the access node it is necessary to ensure that
it is properly setup to work as a data node. This process is referred
to as *bootstrapping the data node*, which is done automatically each
time a data node is added to an access node (unless `bootstrap` is
false, in which case it just verifies that the data node is properly
set up).

The steps performed when boostrapping a data node are:

1. Connect to the data node and authenticate the user.
1. Check that the database is on the data node and create it
   otherwise.
2. Check that the TimescaleDB extension is available in the database or
   create it otherwise.
3. Set metadata on the data node.

## Authentication during bootstrapping

All connections to the data node are made as the current user on the
access node. Which requires that:

1. The current user exists on both the data node and access node.
2. The data node is set up to handle logins using either certificates
   or password files, as described in the [Data Node Authentication
   Chapter][distdb-auth].

## Adding data nodes to the access node

A new data node is added to the access node using the
[`add_data_node`][add_data_node] command.

```sql
SELECT * FROM add_data_node('data_node_1', 'data1.example.com');
```

The access node has to ensure that the database on the data node is
properly configured by either bootstrapping the database or verifying
that the database exists and is correctly configured. This is
controlled with the `bootstrap` option, which can be either `true`
(indicating that the data node should be bootstrapped) or `false`
(indicating that the data node will only be validated, but no
bootstrapping will take place).

```sql
SELECT * FROM add_data_node('data_node_1', 'data1.example.com',
                            boostrap => false);
```

The default value for the `bootstrap` option is `true`, which means
that the data node is bootstrapped when added.

## Setting up the database on the data node

The database to bootstrap on the data node will have the name of the
current database on the access node by default. For example, if you
are connected to the `postgres` database on the access node, the
database name will be `postgres` on the data node as well.

To provision the data node in a different database on the instance use
the `database` option to the [`add_data_node`][add_data_node] command,
for example:

```sql
SELECT * FROM add_data_node('data_node_1', 'data1.example.com',
                            database => 'my_database');
```

This is particularly useful if you want to experiment with having data
nodes and access nodes in the same Postgres instance.

### Bootstrapping the database

If `bootstrap` is `true` (which is the default), the access node will
first connect to either the `postgres` database or, if the `postgres`
database does not exist, to the `template0` database on the data node,
and create a new database:

```sql
CREATE DATABASE <database>
   TEMPLATE template0 OWNER <owner>
   ENCODING <encoding> LC_COLLATE <collation>
   LC_CTYPE <character type>
```

Here, the `owner` is the user connected on the access node and the
`encoding`, `collation`, and `character type` parameters are taken
from the current database on the access node.

Once the database is created, the access node disconnects and
continues by connecting to the database and proceeds with
bootstrapping the extension. If the database already exists on the
data node, the procedure validates the database and proceeds with
setting up the extension.

### Validating the database

The database will be validated by checking that the encoding,
character type, and collation are the same as the current database on
the access node.

## Setting up the extension

The `timescaledb` extension needs to be installed in the database on
the data node, so the next step is ensuring that there is a valid
extension installed in the database by either:

* Creating the extension.
* Verifying that the extension is compatible with the extension
  installed on the access node.

### Creating the schema for the extension

To install the extension, a schema is created to store objects that
the `timescaledb` extension needs. The schema name on the data node is
set to match the extension schema name on the access node. If you have
created the `timescaledb` extension in the default manner, `public`
will be used for the schema on the access node, hence `public` will be
used on the data node as well.

If the schema name on the access node is `public`, no new schema is
created on the data node, but otherwise it is expected that the schema
name does not exist. In the event that the schema name exists (but is
not `public`), an error will be raised and the bootstrapping will
abort.

To change the schema used on the access node and data node, you can
create a new schema on the access node, then create the extension with
the schema that you want:

```sql
CREATE SCHEMA magic;
CREATE EXTENSION timescaledb SCHEMA magic;
```

When validating the schema, it is necessary that the schema is owned
by the current user, or is `public`.

>:TIP: Creating the extension in a non-default schema will
> automatically place all TimescaleDB functions into that
> schema. Therefore, all function references must be qualified within
> that schema. For example, to call `create_hypertable` from the
> previous magic schema:
> 
> ```sql
> SELECT * FROM magic.create_hypertable('conditions', 'time', 3);
> ```

### Installing the extension

After the schema is created, the extension is installed using the
`CREATE EXTENSION` command with the `SCHEMA` option to refer to the
schema from the section above. The schema name for the extension will
be either `public` or a dedicated schema name.

If the extension already exists, it is validated to ensure that it can
be used with the access node, then the procedure sets the metadata.

### Validating the extension

Validation of the extension checks that the extension on the data node
is of a version that is compatible with the version on the access node
and that the access node has permissions to use the extension.

The extension on the data node is compatible with the extension on the
access node if the major versions are the same, and the minor version
on the data node is before or the same as the minor version on the
access node. The difference in the patch version doesn't affect compatibility. For example:

- Compatible: data node v1.3.1, access node v1.5.1
- Compatible: data node v1.3.5, access node v1.3.1
- Incompatible: data node v1.4.1, access node v1.3.1
- Incompatible: data node v2.0.0, access node v1.3.1

In addition to validating the version, it is necessary to ensure that
the access node has sufficient privileges on the data node. This
requires that the connected user is the owner of the extension.

## Set the metadata

Once the extension is set up, the data node is marked as belonging to
the access node by setting the `dist_id` of the data node to the UUID
of the access node.

[distdb-auth]: /getting-started/setup/data-node-authentication
[add_data_node]: /api#add_data_node
[attach_data_node]: /api#attach_data_node
