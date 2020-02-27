# Exploring Timescale Cloud

Welcome to Timescale Cloud. Timescale Cloud is a Database as a Service (DBaaS) 
offering that provides an easy way for you to analyze time-series. Powered 
by [TimescaleDB][timescale-features], you can create database instances in the 
cloud and automate many of your most common operational tasks. This allows you 
to spend more time focusing on your time-series workloads and less time worrying 
about database management.

Before we start, let's review a few core concepts and phrases:

- **Account**: Your Timescale Cloud account. You can register for a Timescale Cloud account on the [Timescale Cloud signup][sign-up] page.
- **Project**: An empty Project is created for you automatically when you sign-up. Projects organize groups of Services, and have different billing settings. You can use Projects as a way to organize Services in your account and provide access to those Services with other users.
- **Service**: A Service is an instance that corresponds to a cloud service provider tier (e.g., AWS Timescale-Pro-512-IO-Optimized). You can access all your Services from the 'Services' tab for a given Project.
- **Database**: Databases are created within a Service. You can view and create a Database within a Service by selecting one of your Services, and then selecting the 'Databases' tab.
- **Service Plans**: A Service Plan defines the configuration and level of database management that will be performed for a given TimescaleDB deployment.

### Step 1: Sign up for Timescale Cloud

Visit the [Timescale Cloud signup page][sign-up] and supply your name, email address, and password.

Once you've submitted the information, verify your account by clicking on the link in the
email you receive. If you don't receive this email shortly after submitting the form,
check your spam folder.

### Step 2: Create your first service

After you complete account verification, you can visit the [Timescale Cloud portal][timescale-cloud-portal] 
and login with your credentials.

You can create a new service by clicking on the `Create a new service` button.

In the resulting screen, you'll see several options that enable you to choose:

- **Service type**. Today, we support TimescaleDB and Grafana services.
- **Cloud provider**. We support Amazon Web Services, Google Cloud, or Microosft Azure.
- **Cloud region**. We support most cloud regions offered by each cloud provider.
- **Service plan**. We support many common configurations of CPU, memory, storage, backup, and nodes. *If you're still a Timescale Cloud trial user*, we recommend using the `Dev` plan as it will be most cost effective during your evaluation period.

>:TIP: During your Timescale Cloud trial, you have up to $300 USD in credits to use.
This will be sufficient to complete all our tutorials and run a few test projects.

If you're interested in learning more about pricing of Timescale Cloud, visit the
[Timescale Cloud pricing calculator][timescale-pricing]. Or, [contact us][contact]
and we will be happy to walk you through the best Timescale Cloud configuration
for your use cases.

Once you've selected your service options, click `Create Service`.

It will take a few minutes for your service to provision in your cloud. Now is
a good time to familiarize yourself with some of the [features of TimescaleDB][using-timescale]
and our [getting started tutorial][hello-timescale].

### Step 3: Install psql

Nearly all of our tutorials require some working knowledge of `psql`, the command-line
utility for configuring and maintaining PostgreSQL. We recommend
[installing psql][install-psql].

### Step 4: Connect to your database using psql

You will see a green `Running` label and a green dot under the "Nodes" column when 
your instance is ready for use.

Once your instance is ready, navigate to the ‘Overview Tab’ of your Timescale 
Cloud dashboard and locate your `host`, `port`, and `password`, as highlighted below.

<img class="main-content__illustration" src="https://s3.amazonaws.com/docs.timescale.com/hello-timescale/NYC_figure1_1.png" alt="NYC Taxis"/>

Afterward, connect to your Timescale Cloud database from `psql`
by typing the command below into your terminal,
ensuring that you replace the {curly brackets} with your real
password, hostname, and port number found in the overview tab.

```bash
psql -x "postgres://tsdbadmin:{YOUR_PASSWORD_HERE}@{YOUR_HOSTNAME_HERE}:{YOUR_PORT_HERE}/defaultdb?sslmode=require"
```

You should see the following connection message:

```bash
psql (12.2, server 11.6)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.
tsdbadmin@defaultdb=>
```

### Step 5: Verify that TimescaleDB is installed

To verify that TimescaleDB is installed, run the `\dx` command
to list all installed extensions to your PostgreSQL database.
You should see something similar to the following output:

```sql
                  List of installed extensions
| Name        | Version | Schema     | Description                                  |
|-------------|---------|------------|----------------------------------------------|
| plpgsql     | 1.0     | pg_catalog | PL/pgSQL procedural language                 |
| timescaledb | 1.6.0   | public     | Enables scalable inserts and complex queries |
```

### Step 6: Hello, Timescale!

Congratulations! You are now up and running with Timescale Cloud. In order to
familiarize yourself with the features and capabilities of the product, we
recommend that you complete the [Hello, Timescale!][hello-timescale] tutorial.
 
[timescale-cloud-portal]: http://portal.timescale.cloud
[sign-up]: https://www.timescale.com/cloud-signup
[timescale-features]: https://www.timescale.com/products
[timescale-pricing]: https://www.timescale.com/products#cloud-pricing
[contact]: https://www.timescale.com/contact
[using-timescale]: /using-timescaledb
[hello-timescale]: /tutorials/tutorial-hello-timescale
[install-psql]: /getting-started/install-psql-tutorial