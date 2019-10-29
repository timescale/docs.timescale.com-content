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
database and use the same database on all the data nodes, so you need
to ensure that a user that is connected to the access node can access
the same databases on the data nodes.

>:WARNING: Setting up a secure system is a complex task and this
section should not be read as recommending any particular security
measures for securing your system. The chapter contains technical
instructions for how to set up the different authentication methods.

## Setting up Password Authentication [](distdb-auth-pass)

The easiest authentication method to set up is password
authentication. Configuring password authentication between the access
node and data nodes is a two step process:

1. Each data node needs to be configured to accept and authenticate
   connections using passwords.

2. The access node needs data node passwords for each role using the
   access node.

In this section, the focus is on setting up SCRAM SHA-256 password
authentication. For other password authentication methods, [see the
PostgreSQL manual][auth-password].

Let's assume that you want to add a user `new_user` to both the access
node and data node and that the user should have the password `xyzzy`.

>:TIP: This description is using `scram-sha-256` since the `password`
> method is not recommended (it sends the password in cleartext), and
> the `md5` method is using a cryptographic hash function that is no
> longer considered secure.

### Setting up Password Authentication on the Data Node [](distdb-auth-pass-data-node)

In order to set up password authentication for `new_user` using
password `xyzzy`, you need to:

1. Set the correct password encryption method.
2. Enable password authentication for the user.
3. Reload the server to read the new configuration.
4. Add the user on the data node with the right password.

#### Set up password encryption method

First, you need to edit the PostgreSQL configuration file
`postgresql.conf` in the data directory and set `password_encryption`
to the right password encryption method, in our case
`scram-sha-256`. The configuration file should contain the following
lines:

```
password_encryption = 'scram-sha-256'		# md5 or scram-sha-256
```

>:TIP: A quick way to edit the configuration file is by using Perl:
>
> ```bash
> perl -pi -e "s/^#?(password_encryption) *= *\S+/\1 = 'scram-sha-256'/" \
>    postgresql.conf
> ```
>
> This will rename the original configuration file to
> `postgresql.conf.orig` and set `password_encryption` in
> `postgresql.conf`.
>
> Note that you need to recreate any passwords that were created
> before you made this change for the old passwords to be encrypted
> the correct way.

#### Enable password authentication

The default name of the HBA file is `pg_hba.conf`, so check the
configuration file (normally `postgresql.conf` in the data directory
of the data node server) and make sure that the `hba_file` option is
commented out. That part of the file should look like this:

```
#hba_file = 'ConfigDir/pg_hba.conf' # host-based authentication file
                                    # (change requires restart)
```

After that, you should add a line to the `pg_hba.conf` file giving
`new_user` in the `example.com` domain access to all databases on the
data node and is authenticated using SCRAM SHA-256.

```
# IPv4 local connections:
host    all             new_user        .example.com            scram-sha-256
```

Details of [the `pg_hba.conf` format can be found in the PostgreSQL
manual.][postgresql-hba].

#### Reload server configuration

To reload the server configuration, you can use the following command
on the data node:

```bash
pg_ctl reload
```

#### Add new user on data node

You can add the new user on the data node by connecting to it using
`psql` and using [`CREATE ROLE`][postgresql-create-role]:

```sql
CREATE ROLE new_user WITH LOGIN PASSWORD 'xyzzy';
```

### Setting up Password Authentication on the Access Node [](distdb-auth-pass-access-node)

To execute queries across data nodes, the access node needs to connect
to data nodes as the user executing the query. This means that the
access node needs to be configured for password authentication and
need the passwords for the current user on each data node.

To set up password authentication on the access node, you need to:

1. Set the correct password encryption method.
2. Create a password file.
4. Reload the server configuration.

#### Set up password encryption method

First, you need to edit the PostgreSQL configuration file
`postgresql.conf` in the data directory and set `password_encryption`
to the right password encryption method, in our case
`scram-sha-256`. The configuration file should contain the line:

```
password_encryption = 'scram-sha-256'		# md5 or scram-sha-256
```

#### Create a password file

The default name of the password file is `passfile` and it is located
in the data directory for the PostgreSQL server, so create a file
`passfile` in the data directory of the access node:

```bash
cd <datadir>
cat >passfile <<EOT
*:*:*:new_user:xyzzy
EOT
```

Once you have created the file, you need to make sure that it has the
right permissions:

```bash
cd <datadir>
chmod 0600 passfile
```

The password file format is [described in the PostgreSQL
manual][passfile-format]. The line above use password `xyzzy` whenever
connecting to any other server as user `new_user`.

If you do not like the name `passfile`, you can set the name to
something else in the `postgresql.conf` file for the access node using
the option `timescaledb.passfile`:

```
timescaledb.passfile = 'pgpass.txt'
```

#### Reload server configuration

Reload the server configuration using `pg_ctl reload` and you are
ready to go

[postgresql-hba]: https://www.postgresql.org/docs/current/auth-pg-hba-conf.html
[postgresql-create-role]: https://www.postgresql.org/docs/current/sql-createrole.html
[auth-password]: https://www.postgresql.org/docs/current/auth-password.html
[passfile-format]: https://www.postgresql.org/docs/current/libpq-pgpass.html
[scaling-out]: /getting-started/scaling-out

