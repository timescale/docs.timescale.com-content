# Data Node Authentication [](distdb-auth)

In a [multi-node environment][scaling-out], it is necessary to ensure that the access
node have the necessary roles and permissions on all the data nodes
where distributed hypertables are placed.

This is critical since when TimescaleDB is executing a query or
command it will use the same role on the data nodes as on the access
node. This means that the same roles need to exist on the data nodes
and the access node need to have authentication set up for those
roles.

In a typical setup, you will create the distributed hypertable in a
database and use the same database on all the data nodes. This means
that you need to ensure that a user that is connected to the access
node can access the same databases on the data nodes.

>:WARNING: Setting up a secure system is a complex task and this section
should not be read as recommending any particular security measures
for securing your system. The chapter contains technical
instructions for how to set up the different authentication methods.

## Setting up Password Authentication [](distdb-auth-pass)

The easiest authentication to set up is password
authentication. Configuring password authentication between the access
node and data nodes is a two step process:

1. Each data node needs to be configured to accept and authenticate
   connections using passwords.

2. The access node needs data node passwords for each role using the
   access node. We will deal with each step separately below.

In this section, the focus is on setting up SCRAM SHA-256 password
authentication. For other password authentication methods, [see the
PostgreSQL manual][auth-password].

>:TIP: The `password` method should not be used since it sends the
> password in cleartext, and the `md5` is using a cryptographic hash
> function that is no longer considered secure.

### Setting up Password Authentication on the Data Node [](distdb-auth-pass-data-node)

In order to set up password authentication for a user `new_user`, it
is necessary to update the HBA (Host-Based Authentication) file on the
data nodes to enable password authentication for `new_user`. The
default name of the HBA file is `pg_hba.conf`. Details of [the
`pg_hba.conf` format can be found in the PostgreSQL
manual.][postgresql-hba].

In this case, you want to give `new_user` in the `example.com` domain
access to all databases on the data node, so add the following line to
the `pg_hba.conf`.

```
host    all    new_user    .example.com    scram-sha-256
```

Once you have set up the authentication method on the data node, you
need to check the configuration file (normally `postgresql.conf` in
the data directory of the data node server) and make sure that the
`hba_file` option is correctly set.

### Setting up Passwords on the Access Node [](distdb-auth-pass-access-node)

To execute queries across data nodes, the access node needs to connect
to data nodes as the user executing the query. This means that the
access node needs passwords for the current user on each data node,
and these are stored in a password file on the access node.

The default name of the password file is `passfile` and it is located
in the data directory for the PostgreSQL server. You can set the name
to something else in the `postgresql.conf` file for the access node
using the option `timescaledb.passfile`.

```
timescaledb.passfile = 'pgpass.conf'
```

**Password file format.** The password file format is [described in
the PostgreSQL manual][passfile-format] and consists of lines of the
format:

```
hostname:port:database:username:password
```

So, in order to add a password for our user `new_user` and use
password `xyzzy`, you can create a password file with the following
contents:

```
*:*:*:new_user:xyzzy
```

[postgresql-hba]: https://www.postgresql.org/docs/current/auth-pg-hba-conf.html
[auth-password]: https://www.postgresql.org/docs/current/auth-password.html
[passfile-format]: https://www.postgresql.org/docs/current/libpq-pgpass.html
[scaling-out]: /getting-started/scaling-out

