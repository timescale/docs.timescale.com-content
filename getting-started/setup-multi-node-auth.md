# Setting up a self-managed multi-node environment

If you have multiple instances of PostgreSQL running, you can set them up to
act as a TimescaleDB multi-node environment.

To start, you'll need to have the following:
- One PostgreSQL instance to act as an access node
- One or more PostgreSQL instances to act as data nodes
- TimescaleDB [installed][install] and [set up][setup] on all nodes
- Access to a superuser role (e.g. `postgres`) on all nodes

## Multi-node configuration

In additions to the [normal configuration for TimescaleDB][configuration], it is also necessary to
change the parameter `max_prepared_transactions` to a non-zero value on all nodes
(if not already set, '150' is recommended). The parameter is located in
`postgresql.conf`, typically in the data directory. If it isn't there, connect to
the node (`psql`) and get the path with:

```sql
SHOW config_file;
```

Note that it will be necessary to reload the configuration if modified.

```bash
pg_ctl reload
```

## Node-to-node communication [](#node-communication)

Once you have your instances set up, the next task is configuring your PostgreSQL
instances to accept connections from the access node to the data nodes.  However,
this task requires different steps depending on what authentication mechanism
you want to use on your nodes.  The simplest approach is to simply trust all
incoming connections, and is discussed in [this section](#multi-node-auth-trust).

Setting up a secure system is a complex task and this section should not 
be read as recommending any particular security measures for securing 
your system.  That said, here are two technical examples for how to 
enable authentication, [password authentication](#multi-node-auth-password) and 
[certificate authentication](#multi-node-auth-certificate).

### Trust authentication [](multi-node-auth-trust)

This is the quickest path to getting a multi-node environment up and running,
but should not be used for any sort of secure data.

>:WARNING: The "trust" authentication method allows insecure access to all 
nodes.  For production implementations, please use more secure 
methods of authentication.

#### 1. Edit authentication configuration file on data nodes
Client authentication is usually configured in the `pg_hba.conf` ([reference doc][postgresql-hba])
file located in the data directory.  If the file is not located 
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

#### 2. Reload server configuration
Reload the server configuration on each data node for the changes to take effect:

```bash
pg_ctl reload
```

#### 3. Attach the data nodes to the access node

Once the nodes are properly configured, you can continue following the [multi-node setup][attach_multi_node_nodes].

#### 4. Setting up additional roles [](multi-node-auth-trust-roles)
There are no additional configuration changes that need to be done for trust
authentication, as connections from all users on the access node are trusted by
the data nodes.  You can simply perform the following commands on the access node.

First, create the role on the access node if not already present:
```sql
CREATE ROLE testrole;
```

Next, allow that role to access the foreign server objects for the data nodes. Run
the following, making sure to include all data node names:
```sql
GRANT USAGE ON FOREIGN SERVER <data node name>, <data node name>, ... TO testrole;
```

Finally add the role to all of the data nodes. Use the [distributed_exec command][distributed_exec]
to do this from the access node:
```sql
CALL distributed_exec($$ CREATE USER testrole WITH LOGIN $$);
```

It's important that the role be created with LOGIN permission on the data nodes, even if it
doesn't have such permission on the access node.  Aside from this, any other
permissions the user has should be the same on the data node to ensure operations
behave the same on all nodes.

---
### Password authentication [](multi-node-auth-password)
This method is for SCRAM SHA-256 password authentication. For other 
password authentication methods, [see the PostgreSQL docs][auth-password].  
The method assumes the presence of a `postgres` user/password combination
that exists on all nodes.  Steps are as follows:

1. Set the password encryption method for the access node and the data nodes
2. Enable authentication for connections from the access node to the data nodes
3. Create/update the `passfile` on the access node with all user/password 
pairs
4. Reload all nodes to update configuration
5. Attach data nodes to the access node
6. Add any additional users

#### 1. Set the password encryption method for access node and data nodes
First set the password encryption method to `scram-sha-256` within the PostgreSQL 
configuration file `postgresql.conf` on each node. Add this line to the file:

```bash
password_encryption = 'scram-sha-256'		# md5 or scram-sha-256
```

Note that any previously created user passwords will need to be recreated to 
incorporate the new encryption.

#### 2. Enable password authentication on the data nodes
Password authentication is set by modifying the HBA file (by default `pg_hba.conf`
in the data directory, can also be found via `SHOW hba_file` in psql). Add a
line to `pg_hba.conf` to enable encrypted authentication between the access node and
the data node for all users:

```bash
# IPv4 local connections:
# TYPE  DATABASE  USER  ADDRESS      METHOD
host    all       all   192.0.2.20   scram-sha-256 #where '192.0.2.20' is the access node IP
```

#### 3. Create a password file on the access node
The password file `passfile` enables the access node to connect securely to data 
nodes and is by default located in the data directory ([PostgreSQL documentation][passfile]). 
If a file doesn't exist, create one with the new user information.  Add a line for each user, 
starting with the `postgres` user:

```bash
*:*:*:postgres:xyzzy #assuming 'xyzzy' is the password for the 'postgres' user
```

Then apply the correct permissions to the file:

```
chmod 0600 passfile
```

#### 4. Reload server configuration
Reload the server configuration on each node for the changes to take effect:

```bash
pg_ctl reload
```

#### 5. Attach the data nodes to the access node

Once the nodes are properly configured, you can continue following the [multi-node setup][attach_multi_node_nodes].

#### 6. Setting up additional roles [](multi-node-auth-password-roles)

First, new roles must be added to `passfile` on the access node (create in step 2 above).
```bash
*:*:*:testrole:foobar
```

First, create the role on the access node if needed, and grant it usage to the foreign server
objects for the data nodes:
```sql
CREATE ROLE testrole PASSWORD 'foobar';
GRANT USAGE ON FOREIGN SERVER <data node name>, <data node name>, ... TO testrole;
```

Finally, use [`distributed_exec`][distributed_exec] to add the role to all of the data nodes. In addition to LOGIN,
make sure to provide the `PASSWORD` parameter matching the passfile:
```sql
CALL distributed_exec($$ CREATE USER testrole WITH LOGIN PASSWORD 'foobar'$$);
```

---
### Certificate authentication [](multi-node-auth-certificate)
This method is more complex to set up than password authentication, but 
more secure and easier to automate.

The steps to set up certificate authentication are:

1. Set up a certificate authority (CA) that can sign certificates and
   create a root certificate.
2. Generate a key and certificate each for the access node and data nodes.
3. Configure the access node and data node to use the certificates and
   to accept certified connections.
4. Set up each user with appropriate permissions (keys, certificates, privileges).
5. Attach data nodes to the access node.
6. Add any additional users.

To use certificates, each node involved in certificate
authentication uses three files:

- A *root CA certificate*, which we assume to be named `root.crt`, which 
  serves as the root of trust in the system. It is used to verify other 
  certificates.
- A node *certificate* that provides the node with a trusted identity in the  
  system. The node certificate is signed by the CA.  
- A private *key* that provides proof of ownership of the node certificate. In the 
case of the access node, this key is also used to sign user certificates. The key 
should be kept secure on the node instance where it is generated.

The access node also needs a private key and certificate pair for each user (role) 
in the database that will be used to connect and execute queries on the data 
nodes. The access node can use its own node certificate to create and sign new 
user certificates, as described further below.

#### 1. Set up a certificate authority

A CA is necessary as a trusted third party to sign other certificates.  The _key_
of the CA is used to sign Certificate Signing Requests (CSRs), and the 
_certificate_ of the CA is used as a root certificate for other parties. 
Creating a new CA is not necessary if there is already one available to be 
employed.  In that case skip to the next step.

First, generate a private key called `auth.key`:

```bash
openssl genpkey -algorithm rsa -out auth.key
```

Generate a self-signed root certificate for the CA:
```
openssl req -new -key auth.key -days 3650 -out root.crt -x509

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

#### 2. Generate keys and certificates for nodes

Keys and certificates serve similar but distinct purposes for the data nodes and 
access node respectively.  For the data nodes, a signed certificate verifies the 
node to the access node.  For the access node a signed certificate is used to 
sign user certificates for access.

The default names for the node key and certificate are `server.key`
and `server.crt` respectively and they are both placed in the data
directory of the instance. To create a server certificate:

1. Generate a CSR, `server.csr` for the node and generate a new key, 
`server.key`. To generate both with one command:

  ```bash
  openssl req -out server.csr -new -newkey rsa:2048 -nodes \
  -keyout server.key
  ```

2. Sign the CSR using the previously generated CA key, `auth.key`:

  ```bash
  openssl ca -extensions v3_intermediate_ca -days 3650 -notext \
  -md sha256 -in server.csr -out server.crt
  ```

3. Move the server files `server.crt` and `server.key` into the node's data
  directory.

4. Copy the root certificate file `root.crt` from the certificate
  authority into the node's data directory.

#### 3. Configure the node to use SSL authentication

Configure the node to use SSL authentication by setting the `ssl` option to `on` and setting 
the `ssl_ca_file` value in the `postgresql.conf` configuration file:

```
ssl = on
ssl_ca_file = 'root.crt'
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

This configuration is only required on data nodes, but it can also be applied to 
the access node to enable certificate authentication for login.

>:TIP: `ssl_cert_file` and `ssl_key_file` are here set explicitly, but do not need 
to be set for the default values (`server.crt` and `server.key`).  If the values 
are different from the defaults, they _would_ need to be set explicitly.

Now configure the HBA file (default `pg_hba.conf`) on the data node to accept 
certificates for users.  Add a line to allow any user belonging to the the role 
`ssl_cert` to log in:

```
# TYPE    DATABASE  USER        ADDRESS   METHOD  OPTIONS
hostssl   all       +ssl_cert   all       cert    clientcert=1
```

Create the role `ssl_cert` in the data node (psql):

```sql
CREATE ROLE ssl_cert;
```

### 4. Set up user permissions

The access node does not have any user keys nor certificates, so it cannot yet log 
into the data node.  User key files and user certificates are stored in 
`timescaledb/certs` in the data directory.

>:TIP: You can configure the location of the user certificates and
>keys outside of the data directory using `timescaledb.ssl_dir`.

To generate a key and certificate file:

1. Compute the base name for the files (using [md5sum][]), generate a subject
  identifier, and create names for the key and certificate files. Here, for user
  `postgres`:

  ```bash
  pguser=postgres #change value for a different user name
  base=`echo -n $pguser | md5sum | cut -c1-32`
  subj="/C=US/ST=New York/L=New York/O=Timescale/OU=Engineering/CN=$pguser"
  key_file="timescaledb/certs/$base.key"
  crt_file="timescaledb/certs/$base.crt"
  ```

  Most of the data is copied from the server certificate for the
  subject, but the common name (`CN`) needs to be set to the user
  name.

2. Generate a new random user key.

  ```bash
  openssl genpkey -algorithm RSA -out "$key_file"
  ```

3. Generate a certificate signing request. The CSR file is just
  temporary, so we can place it in directly in the data directory. It
  will be removed later.

  ```bash
  openssl req -new -sha256 -key $key_file -out "$base.csr" -subj "$subj"
  ```

4. Sign the certificate signing request with the node key.

  ```bash
  openssl ca -batch -keyfile server.key -extensions v3_intermediate_ca \
	   -days 3650 -notext -md sha256 -in "$base.csr" -out "$crt_file"
  rm $base.csr
  ```
   
5. Append the node certificate to the user certificate. This is
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

The data node is now set up to accept certificate authentication, the data and 
access nodes have keys and the user has a certificate.

7. On all data nodes, add `USAGE` privileges on the `timescaledb_fdw` foreign data 
wrapper (and any other objects, as necessary).

#### 5. Attach the data nodes to the access node

Once the nodes are properly configured, you can continue following the [multi-node setup][attach_multi_node_nodes].

#### 6. Setting up additional roles [](multi-node-auth-certificate-roles)

Allowing new roles to use the certificate to authenticate is simply a matter of
adding them to the certificate role.  Aside from that, the process of adding new
users should be the same as for [trust authentication](multi-node-auth-trust-roles).

First create the user on the access node if needed and grant it usage on the
foreign server objects corresponding to the data nodes:
```sql
CREATE ROLE testrole;
GRANT USAGE ON FOREIGN SERVER <data node name>, <data node name>, ... TO testrole;
```

Now, add the new role to `ssl_cert`:

```sql
GRANT ssl_cert TO testrole; 
```

And finally add the role to all of the data nodes with [`distributed_exec`][distributed_exec]:
```sql
CALL distributed_exec($$ CREATE USER testrole WITH LOGIN $$);
```

---

## Next steps
To start working with the system, you can look at documentation for [distributed hypertables][].

All functions for modifying the node network are described in the API
docs:
- [add_data_node][]
- [attach_data_node][]
- [delete_data_node][]
- [detach_data_node][]
- [distributed_exec][]

[attach_multi_node_nodes]: /getting-started/setup-multi-node-basic#init_data_nodes_on_access_node
[auth-password]: https://www.postgresql.org/docs/current/auth-password.html
[passfile]: https://www.postgresql.org/docs/current/libpq-pgpass.html
[md5sum]: https://www.tutorialspoint.com/unix_commands/md5sum.htm
[distributed hypertables]: /using-timescaledb/distributed-hypertables
[add_data_node]: /api#add_data_node
[attach_data_node]: /api#attach_data_node
[delete_data_node]: /api#delete_data_node
[detach_data_node]: /api#detach_data_node
[distributed_exec]: /api#distributed_exec
[configuration]: /getting-started/configuring
[install]: /getting-started/installation
[setup]: /getting-started/setup
[postgresql-hba]: https://www.postgresql.org/docs/12/auth-pg-hba-conf.html