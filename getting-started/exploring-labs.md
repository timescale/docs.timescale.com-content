# Setup [](setup)
Now that you’ve been invited to Timescale Labs, you’re ready to work 
with some data. The first thing to do is to create a new database. 
Timescale Labs is a PostgreSQL database with TimescaleDB extensions 
already installed. Timescale Labs automatically provisions and manages 
a TimescaleDB instance in Amazon Web Services.

>:WARNING: Timescale Labs is in private alpha. [Request an invite][invite-request] . We will keep this document updated as we add features, but the screenshots and instructions may be temporarily out of date.

## Sign in to Timescale Labs [](signin)
Sign in to Timescale Labs and you’ll see that a `timescale_demo` 
service is automatically created for you. Click on the service 
and you’ll see a screen similar to this:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/labs_config_screen.png" alt="timescale labs config screen"/>

## Connect to your Timescale Labs database [](connect)
To connect to the database, you’ll need to make sure the `psql` 
utility is installed on your command line. Follow the instructions for 
your platform in order to 
[setup the psql command-line utility][setup-psql]).

Take note of the hostname and password (blacked out in the screenshot 
above) for your Timescale Labs instance.

Connecting to your Timescale database is as easy as copying and pasting 
your service URL. Note that the link you copied from the start screen 
will look different than the one below; `example-password`, `example-host`, 
and `example-port` will be replaced with actual values for your instance.

```bash
psql postgres://tsdbadmin:example-password@example-host:example-port/tsdb?sslmode=require
``` 

## Upload data to Timescale Labs [](upload)
Suppose you want to setup schema and upload data to your Timescale database, 
as described in the 
[Sample Datasets tutorial][sample-datasets-tutorials]. 

You can experiment with a Device Ops dataset, called 
[:DOWNLOAD_LINK: `devices_small`][devices-small-dataset]
(representing metrics collected from mobile devices, like CPU, memory, network 
etc) and/or a Weather dataset, called 
[:DOWNLOAD_LINK: `weather_small`][weather-small-dataset]
(representing temperature and humidity data from a variety of locations).

For the Device Ops dataset, you’d first set up your schema:
```bash
psql -x "postgres://tsdbadmin:example-password@example-host:example-port/tsdb?sslmode=require" < devices.sql
```

Enter your password when prompted, then connect to your database with psql 
and copy in data to the appropriate tables:

```bash
\COPY readings FROM devices_small_readings.csv CSV
\COPY device_info FROM devices_small_device_info.csv CSV
```

Similarly, for the Weather dataset, you’d set up your schemas as follows:

```bash
psql -x "postgres://tsdbadmin:example-password@example-host:example-port/tsdb?sslmode=require" < weather.sql
```

And then connect to psql and copy in data to the appropriate tables:

```bash
\COPY conditions FROM weather_small_conditions.csv CSV
\COPY locations FROM weather_small_locations.csv CSV
```

# Next Steps [](nextsteps)
To get the most out of your Timescale Labs experience, follow the 
[Device Ops tutorial][device-ops-tutorial] or the 
[Weather data tutorial][device-weather-tutorial]. 
We've designed TimescaleDB with simplicity in mind, and these tutorials will 
get you up and running quickly.

If you have questions about Timescale Labs, want to provide 
feedback, or need help with more advanced setup requirements, please reach 
out to us [on our community Slack](https://timescaledb.slack.com/archives/CRG0JJ6AF).

Remember, Timescale Labs is in private alpha. Don’t be shy! 
Tell us what you want to see us build next.

[invite-request]: https://labs.timescale.com/
[setup-psql]: https://blog.timescale.com/tutorials/how-to-install-psql-on-mac-ubuntu-debian-windows/
[sample-datasets-tutorials]: /tutorials/other-sample-datasets
[devices-small-dataset]: https://timescaledata.blob.core.windows.net/datasets/devices_small.tar.gz
[weather-small-dataset]: https://timescaledata.blob.core.windows.net/datasets/weather_small.tar.gz
[device-ops-tutorial]: /tutorials/other-sample-datasets#in-depth-devices
[device-weather-tutorial]: /tutorials/other-sample-datasets#in-depth-weather)