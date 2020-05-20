# Exploring TimescaleDB Enterprise

TimescaleDB currently offers three product lines: OSS, Community, and Enterprise.
The Enterprise offering features automated data management that enables hands-free data retention policies
and data re-ordering on disk. For an overview of how TimescaleDB product lines differ,
please take a look at our [Products][products] page.

## Requesting a License Key

It is easy to get started with TimescaleDB Enterprise. In fact, if you are already
running TimescaleDB Community, all you have to do is obtain a license key to unlock
all Enterprise capabilities. No software upgrade or downgrade is required. We offer a free 30-day license
that you can request [online][license]. The license will be sent to you via email.

To upgrade or obtain a full Enterprise license key (beyond the free 30-day trial), please [contact sales][contact-sales].

## Activating TimescaleDB Enterprise

Before you can activate TimescaleDB Enterprise, you must have a Timescale-Licensed version of
TimescaleDB up and running. Note, the standard binaries we make available are released under the Timescale License.

>:WARNING: If you explicitly built or downloaded an Apache 2.0 binary, you will not be able to
directly activate TimescaleDB Enterprise. You must upgrade to a Timescale-Licensed binary first.
Please note that this also applies to any TimescaleDB versions prior to v1.2.0.

First connect to the PostgreSQL instance:

```bash
# Connect to PostgreSQL, using a superuser named 'postgres'
psql -U postgres -h localhost
```

Next, input the license key you received via email:

```sql
ALTER SYSTEM SET timescaledb.license_key='<license_key>';

-- Reload your PostgreSQL configs
SELECT pg_reload_conf();
```

>:TIP: You can alternatively set your license key prior to starting TimescaleDB by including
`timescaledb.license_key = '<license_key>'` in your `postgresql.conf` file.
The usual location of `postgresql.conf` is `/usr/local/var/postgres/postgresql.conf`,
but this may vary depending on your setup. If you are unsure where your `postgresql.conf` file
is located, you can query PostgreSQL with any database client (e.g., `psql`)
using `SHOW config_file;`. If you already used `ALTER SYSTEM SET`, this method will not work.

Now make sure that your license key was set correctly:

```sql
SELECT * FROM timescaledb_information.license;
```

You'll be able to use the above command to check your license type and license expiration date.

Continue exploring our enterprise features in our API docs.

 
[products]: https://www.timescale.com/products
[license]: https://www.timescale.com/enterprise-signup
[contact-sales]: https://www.timescale.com/contact
