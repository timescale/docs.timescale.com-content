# Exploring Timescale Forge

Welcome to Timescale Forge! Timescale Forge combines the power and reliability 
of TimescaleDB with a fully-managed, cloud-native experience that is easy to 
start and less expensive to operate.

This tutorial will walk you through setting up your Timescale Forge account and
completing your first tutorial project.

### Step 1: Create a Timescale Forge account

Provide your full name, email address, and a strong password to start:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/forge_images/timescale-forge-signup-page.png" alt="Sign up for Timescale Forge"/>

You will need to confirm your account by clicking the link you receive via 
email. If you do not receive this link, please first check your spam folder 
and, failing that, please [contact us][contact-timescale].

### Step 2: Create your first service

 After you complete account verification, you can visit the 
 [Timescale Forge console][forge-console] and login with your credentials.

 To begin, click 'Create service'.

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/forge_images/timescale-forge-service-creation.png" alt="Set up a Timescale Forge service"/>

1. First, supply your service name (e.g., `acmecorp-test` or `acmecorp-dev`).
1. Next, choose your CPU and memory configuration, from (0.5 CPU, 2GB RAM) to (4 CPU, 16 GB RAM).
1. Select your storage requirements, from 25 GB to 500 GB.  Note with TimescaleDB compression, this is typically equivalent to 400 GB to over 8 TB of uncompressed storage (although compression rates can vary based on your data).
1. Note the estimated cost of running your chosen configuration. Feel free to [contact us][contact-timescale] if you would like to discuss pricing and configuration options best suited for your use case.
1. Click 'Create service' once your configuration is complete.

>:NOTE: We'll be adding additional CPU and storage configurations in the future.  We'll also be adding the ability to quickly switch CPU configurations and storage options for your existing database with just a click, so you can scale with your usage needs.  For now, please [reach out][contact-timescale] if you need to reconfigure a existing service.

After you select 'Create service', you will see confirmation of your service account and
password information. You should save the information in this confirmation screen in 
a safe place:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/forge_images/timescale-forge-service-confirmation.png" alt="View Timescale Forge service information"/>

>:WARNING: If you forget your password in the future, you can reset your password from the *service dashboard*.

It will take a couple minutes for your service to be provisioned. When your database is 
ready for connection, you should see a green `Running` label above the service in the
service dashboard.

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/forge_images/timescale-forge-service-dashboard.png" alt="View all Timescale Forge services"/>

Select any service to view *service details*. You can obtain connection, 
configuration, and utilization information. In addition, you can reset the
password for your service, power down or power up any service (which stops
or starts your compute, although your storage persists), or delete
a service altogether.

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/forge_images/timescale-forge-service-details.png" alt="View Timescale Forge service information"/>

### Step 3: Complete your first tutorial

Congratulations! You are now up and running with Timescale Forge. In order to
familiarize yourself with the features and capabilities of the product, we
recommend that you complete the [Hello, Timescale!][hello-timescale] tutorial.

To simplify operations with TimescaleDB, each Timescale Forge service comprises a
single "database" per PostgreSQL terminology, and all Timescale Forge services
come with TimescaleDB already installed. So skip the `CREATE DATABASE` step
and the "adding the TimescaleDB extension" step of the tutorial and
jump right to the "Define your data schema" section of the [Hello, Timescale!][hello-timescale]
tutorial. Wherever the instructions indicate that you should use the `nyc_data`
database, use `tsdb` instead. `tsdb` is the default database name for every
Timescale Forge service. And if you need another database, it's just a click away.

### Step 4: Learn more about TimescaleDB

Read about TimescaleDB features in our documentation:

- Create your first ”[hypertable][hypertable-info]”.
- Run your first query using [time_bucket()][time-bucket-info].
- Trying more advanced time-series functions, starting with [gap filling][gap-filling-info] or [real-time aggregates][aggregates-info].

### Step 5: Keep testing during your free trial and enter your billing information when you’re ready

You’re now on your way to a great start with Timescale!

You will have an unthrottled, 30-day free trial with Timescale Forge to 
continue to test your use case. Before the end of your trial, we encourage you 
to add your credit card information. This will ensure a smooth transition after 
your trial period concludes.

### Summary

We’re excited to play a small part in helping you build a best-in-class 
time-series application or monitoring tool. If you have any questions, please 
feel free to [join our community Slack group][slack-info] 
or [contact us][contact-timescale] directly.

Now, it's time to forge!

[billing-info]: /forge/managing-billing-payments
[slack-info]: https://slack-login.timescale.com
[install-psql]: /getting-started/install-psql-tutorial
[hello-timescale]: /tutorials/tutorial-hello-timescale
[forge-console]: https://console.forge.timescale.com/login
[contact-timescale]: https://www.timescale.com/contact
[hypertable-info]: https://docs.timescale.com/latest/using-timescaledb/hypertables
[time-bucket-info]: https://docs.timescale.com/latest/using-timescaledb/reading-data#time-bucket
[gap-filling-info]: https://docs.timescale.com/latest/getting-started/migrating-data
[aggregates-info]: https://docs.timescale.com/latest/tutorials/continuous-aggs-tutorial
