# Setting up Multi-Node TimescaleDB

>:WARNING: Distributed hypertables are currently in BETA and
are not yet meant for production use. For more information, please
[contact us][contact] or join the #multinode-beta channel in our 
[community Slack][slack].

Data nodes together with an *access node* constitute the
multi-node TimescaleDB architecture
([architecture][]). All the nodes are TimescaleDB instances,
i.e., hosts with a running PostgreSQL server and loaded TimescaleDB extension.
While the data nodes store distributed chunks, the access node is
the entry point for clients to access distributed hypertables.

So before you take these steps, make sure you install TimescaleDB on all the
servers you want to use as your access node and data nodes for your multi-node
configuration. Please see these instruction for [installing][install] and
[setting up][setup] TimescaleDB.

Once you create a multi-node configuration of TimescaleDB, you can create
[distributed hypertables][distributed-hypertables] across multiple data nodes
in order to scale out in terms of storage capacity and parallel query
executation.

>:WARNING: There are some [limitations][distributed-hypertable-limitations] to
using distributed hypertables that might be good to review before getting
started.

## Configuring Data Nodes [](config-data-nodes)

Data nodes act as containers for hypertable chunks and are
necessary to create distributed hypertables. Data nodes are
added to a distributed database on an access node
using [`add_data_node`][add_data_node]
and removed using [`delete_data_node`][delete_data_node].

Note that:

* A data node is represented on the access node by a local object that
  contains the configuration needed to connect to a database on a
  PostgreSQL instance. The [`add_data_node`][add_data_node] command is
  used to create this object.

* You should already have a running PostgreSQL server on an instance
  that will host a data node. The data node's database will be created
  when executing the [`add_data_node`][add_data_node] command on the
  access node and should _not_ exist prior to adding the data
  node.

* The instance need to have a compatible version of the TimescaleDB
  extension available on the data node: typically the same version of
  the extension should be used on both the access node and the data
  node.

* PostgreSQL instances that will act as data nodes are assumed to
  contain the same roles and permissions as the access node
  instance. Currently, such roles and permissions need to be created
  manually, although there is a [utility command][distributed_exec]
  that can be used to create roles and permissions across data nodes.

* A data node needs
  [`max_prepared_transactions`][max_prepared_transactions]
  set to a value greater than zero. Validate this configuration setting.

When creating the data node, you should:

* Run `add_data_node` as a superuser that can authenticate with the
  data node instance. This can be done by setting up either password
  or certificate [authentication][data-node-auth].

* Provide a name to use when referring to the data node from
  the access node database.

* Provide the host name, and optionally port, of the PostgreSQL
  instance that will hold the data node.

After creating the data node:

* Ensure that non-superusers have `USAGE` privileges on the
  `timescaledb_fdw` foreign data wrapper and any
  data node objects they will use on the access node.

* Ensure that each user of a distributed hypertable has a way to
  [authenticate][data-node-auth] with the data nodes they
  are using.

```sql
SELECT add_data_node('node1', host => 'dn1.example.com');

SELECT add_data_node('node2', host => 'dn2.example.com');
```

Deleting a data node is done by calling [`delete_data_node`][delete_data_node]:

```sql
SELECT delete_data_node('node1');
```
>:TIP: A data node cannot be deleted if it contains data for a
hypertable, since otherwise data would be lost and leave the
distributed hypertable in an inconsistent state.

### Information Schema for Data Nodes

The data nodes that have been added to the distributed database
can be found by querying the
[`timescaledb_information.data_node`][timescaledb_information-data_node] view.

## Data Node Authentication [](data-node-auth)

In a multi-node environment, it is necessary to ensure
that the access node has the necessary roles and permissions on all
data nodes where distributed hypertables are placed.

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
measures for securing your system. The section contains technical
instructions for how to set up the different authentication methods.

### Setting up Password Authentication [](distdb-auth-pass)

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

#### Setting up Password Authentication on the Data Node [](distdb-auth-pass-data-node)

In order to set up password authentication for `new_user` using
password `xyzzy`, you need to:

1. Set the correct password encryption method.
2. Enable password authentication for the user.
3. Reload the server to read the new configuration.
4. Add the user on the data node with the right password.

##### Set up password encryption method

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

##### Enable password authentication

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

##### Reload server configuration

To reload the server configuration, you can use the following command
on the data node:

```bash
pg_ctl reload
```

##### Add new user on data node

You can add the new user on the data node by connecting to it using
`psql` and using [`CREATE ROLE`][postgresql-create-role]:

```sql
CREATE ROLE new_user WITH LOGIN PASSWORD 'xyzzy';
```

#### Setting up Password Authentication on the Access Node [](distdb-auth-pass-access-node)

To execute queries across data nodes, the access node needs to connect
to data nodes as the user executing the query. This means that the
access node needs to be configured for password authentication and
need the passwords for the current user on each data node.

To set up password authentication on the access node, you need to:

1. Set the correct password encryption method.
2. Create a password file.
4. Reload the server configuration.

##### Set up password encryption method

First, you need to edit the PostgreSQL configuration file
`postgresql.conf` in the data directory and set `password_encryption`
to the right password encryption method, in our case
`scram-sha-256`. The configuration file should contain the line:

```
password_encryption = 'scram-sha-256'		# md5 or scram-sha-256
```

##### Create a password file

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

##### Reload server configuration

Reload the server configuration using `pg_ctl reload` and you are
ready to go

### Setting up Certificate Authentication [](distdb-auth-cert)

Using certificates for authentication is more complicated to set up,
but both more secure and easier to automate.

The steps to set up certificate authentication for a distributed
database are:

1. Set up a certificate authority that can sign certificates and
   create a root certificate.
2. Generate a key and certificate for the access node and data nodes.
3. Configure the access node and data node to use the certificates and
   to accept certified connections.
3. Generate a key and certificate for each user.

To use certificates, each instance involved in certificate
authentication uses three files:

- A *root certificate*, which we will assume is named `root.crt`. This
  is the certificate that identifies the Certification Authority (CA)
  we have decided we trust. It contains the public key of the CA (or
  CAs, in the event that there is a certificiation authority chain)
  and can be freely copied between servers.
- A *certificate* that is signed by the CA. This contains the public
  key and is used to verify signatures and can also be freely copied.
- A *key* that contains the private key. This is used to sign messages
  and should be kept secure on the instance where it is generated.

For each user on the access node, we need a signed certificate and a
key. For the access node, the root certificate can be shared and we
only need a single root certificate on the access node.

For the data node, we need a certificate and key specially generated
for the data node. The root certificate can be copied from the access
node.

#### Setting up a Certification Authority

A Certificate Authority is needed as a trusted third party, so you
need to be able to sign other certificates. If you are in a production
environment, you probably have a CA already setup, in which case you
can use that instead. If you do not have a CA key set up, this section
is for you.

The key of the certificate authority is used to sign Certificate
Signing Requests (CSRs), and the certificate of the certificate
authority is what is used as a root certificate for other parties.

A common way to set up certificate authentication when demonstrating
it is by using self-signed certificates for the clients, but in this
chapter you will instead use a toy certificate authority. This is more
similar to a real production setup.

>:WARNING: The Certificate Authority key is central to your security
>and needs to be treated with care. Ideally, the key should be
>generated and used on a secured machine dedicated for this
>purpose. Typically, the key should not leave the machine and you
>should even consider the risk of backups being compromised.

To generate a key into the file `auth.key` you can use `openssl`:

```bash
openssl genpkey -algorithm rsa -out auth.key
```

To generate a root certificate for the toy CA, you can generate a
self-signed root certificate using `openssl`.

```
$ openssl req -new -key auth.key -days 3650 -out root.crt -x509
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:US
State or Province Name (full name) [Some-State]:New York
Locality Name (eg, city) []:New York
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Example Company Pty Ltd
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:http://cert.example.com/
Email Address []: 
```

The common name is here the (imaginary) location of the root
certificate, which in theory would allow a user to download the
certificate from a known location and verify that it is the correct
one. In this case, the value is not checked but it is possible to have
different policies on what is allowed as common name.

Remember that the root certificate only contains public information and
can be distributed freely between machines. Actually, it is more secure
to distribute it widely since anybody interested in using the root
certificate can be more certain that she got the right certificate if it
is available at many locations.

#### Generating keys and certificates for the instances

Once you have a root certificate authority you can create certificates
for the both the data node and the access node. On the data node you
need a signed certificate to certify to the access node that the data
node is valid. On the access node you need to have a signed
certificate so that the access node can sign user certificates.

The default names for the instance key and certificate is `server.key`
and `server.crt` respectively and they are placed in the data
directory of the instance, so let's use those names. If you do not
like the names you can use any other name, but need to set
`ssl_key_file` and `ssl_cert_file` appropriately. To create a server
certificate, you need to:

1. Generate a Certificate Signing Request `server.csr` for the
   instance and also generate a new key `server.key`. You can use the
   command above to generate the key and then generate the CSR
   separately, but there is support in `openssl` to generate both with
   one command:

   ```bash
   openssl req -out server.csr -new -newkey rsa:2048 -nodes \
	   -keyout server.key
   ```

2. You now need to sign the CSR using the CA key, so use the toy CA
   key `auth.key` that you generated before.

   ```bash
   openssl ca -extensions v3_intermediate_ca -days 3650 -notext \
	   -md sha256 -in server.csr -out server.crt
   ```

3. Move the server files `server.crt` and `server.key` into the data
   directory of the PostgreSQL instance, if they are not already
   there.

4. Copy the root certificate file `root.crt` from the certificate
   authority into the data directory of the instance.


#### Configure the instance to use SSL authentication

You now need to configure the instance to use SSL authentication by
setting the `ssl` option to `on` in the `postgresql.conf`
configuration file and set `ssl_ca_file` in the configuration file for
the instance.

Typically this is done on the data node, but you might want to do that
for the access node as well if you want to use certificate
authentication to log into the access node as well.

```
ssl = on
ssl_ca_file = 'root.crt'
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

Strictly speaking, you do not need to set `ssl_cert_file` and
`ssl_key_file` since you are using the default file names here, but it
does not hurt to set them explicitly.

After you have edited the `postgresql.conf` on the data node, you need
to configure `pg_hba.conf` to accept certificates for users, in
particular, you want the access node to be accepted provided it has a
properly signed certificate. If you add the line below, any user that
belongs to the role `ssl_cert` will be allowed to log in.

```
hostssl all +ssl_cert all cert clientcert=1
```

Also create the role `ssl_cert` on the data node.

```sql
CREATE ROLE ssl_cert;
```

#### Generate user keys and certificates

The access node does not have any user keys nor certificates, so it
cannot yet log into the data node. The user keys and certificates are
normally stored in `timescaledb/certs` under the data directory, so we
need to store the user key files and user certificate files here.

>:TIP: The location of the user certificates and keys are relative to
>`ssl_dir`, so you can place it outside the data directory by setting
>`ssl_dir` to some other value.

The key and certificate file names are constructed by taking the MD5
sum of the role name and using it as the base for both the key and the
certificate files. This means that the key file for `postgres` will be
`e8a48653851e28c69d0506508fb27fc5.key` and the certificate file name
will be `e8a48653851e28c69d0506508fb27fc5.crt`.

We generate a key and certificate file in a similar way to how we do
it for the instance key and certificate, but sign it using the
instance key instead of the certification authority. In the data
directory of the access node, you can do it through the following steps:

1. Compute the base name for the files, generate a subject
   identifier, and create names for the key and certificate files. 

   ```bash
   pguser=postgres
   base=`echo -n $pguser | md5sum | cut -c1-32`
   subj=/C=US/ST=New York/L=New York/O=Timescale/OU=Engineering/CN=$pguser
   key_file=timescaledb/certs/$base.key
   crt_file=timescaledb/certs/$base.crt
   ```

   Here we copy most of the data from the server certificate for the
   subject, but the common name (`CN`) needs to be set to the user
   name.

2. Generate a new random user key.

   ```bash
   openssl genpkey -algorithm RSA -out $key_file
   ```
   
3. Generate a certificate signing request. The CSR file is just
   temporary, so we can place it in directly in the data directory. It
   will be removed later.

   ```bash
   openssl req -new -sha256 -key $key_file -out $base.csr -subj $subj
   ```

4. Sign the certificate signing request with the instance key.

   ```bash
   openssl ca -batch -keyfile server.key -extensions v3_intermediate_ca \
	   -days 3650 -notext -md sha256 -in $base.csr -out $crt_file
   rm $base.csr
   ```
   
5. Append the instance certificate to the user certificate. This is
   necessary to complete the certificate verification chain and make
   sure that all certificates are available on the data node, up to a
   trusted certificate (stored in `root.crt`).

   ```bash
   cat >>$crt_file <server.crt
   ```

6. Add the user to the `ssl_cert` role on the data node.

   ```sql
   GRANT ssl_cert TO postgres;
   ```

If everything worked well, you have now set up the data node to accept
certificate authentication, created keys for the data and access node,
and created a certificiate for the user. You should now be able to add
data nodes to the access node in the normal manner.

[postgresql-hba]: https://www.postgresql.org/docs/current/auth-pg-hba-conf.html
[postgresql-create-role]: https://www.postgresql.org/docs/current/sql-createrole.html
[auth-password]: https://www.postgresql.org/docs/current/auth-password.html
[passfile-format]: https://www.postgresql.org/docs/current/libpq-pgpass.html

[install]: /getting-started/installation
[setup]: /getting-started/setup
[distributed-hypertables]: /using-timescaledb/distributed-hypertables
[add_data_node]: /api#add_data_node
[drop_chunks]: /api#drop_chunks
[distributed_exec]: /api#distributed_exec
[architecture]: /introduction/architecture#single-node-vs-clustering
[attach_data_node]: /api#attach_data_node
[delete_data_node]: /api#delete_data_node
[timescaledb_information-data_node]: /api#timescaledb_information-data_node
[data-node-auth]: /getting-started/setup-multi-node#data-node-auth
[max_prepared_transactions]: https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-MAX-PREPARED-TRANSACTIONS
[distributed-hypertable-limitations]: /using-timescaledb/limitations#distributed-hypertable-limitations
[contact]: https://www.timescale.com/contact
[slack]: https://slack.timescale.com/
