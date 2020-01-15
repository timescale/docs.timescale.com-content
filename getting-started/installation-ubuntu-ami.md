## Installing from an Amazon AMI (Ubuntu) [](installation-ubuntu-ami)

TimescaleDB is currently available as an Ubuntu 18.04 Amazon EBS-backed AMI. AMIs are
distributed by region, and our AMI is currently available in US and EU
regions. Note that this image is built to use an EBS attached volume
rather than the default disk that comes with EC2 instances.

See below for the image id corresponding to each region for the most recent TimescaleDB version:

Region | Image ID
--- | ---
us-east-1 (North Virginia) | ami-04d670853b622d07c
us-east-2 (Ohio) | ami-09d4034a29286e5a6
us-west-1 (North California) | ami-0f138af5f72c294fe
us-west-2 (Oregon) | ami-03141b09430eef55b
eu-central-1 (Germany) | ami-0f3e18535cafa2110
eu-north-1 (Sweden) | ami-06644c92da82b79ec
eu-west-1 (Ireland) | ami-0fd8cfbfa092f15e5
eu-west-2 (England) | ami-05253816a7eb43e83
eu-west-3 (France) | ami-08448f9efd8c5a785


To launch the AMI, go to the `AMIs` section of your AWS EC2 Dashboard run the following steps:

* Select `Public Images` under the dropdown menu.
* Filter the image id by the image id for your region and select the image.
* Click the `Launch` button.

You can also use the image id to build an instance using Cloudformation, Terraform,
the AWS CLI, or any other AWS deployment tool that supports building from public AMIs.

TimescaleDB is installed on the AMI, but you will still need to follow the steps for
initializing a database with the TimescaleDB extension. See our [setup][] section for details.
Depending on your user/permission needs, you will also need to set up a postgres superuser for your
database by following these [postgres instructions][]. Another possibility is using the operating
system's `ubuntu` user and modifying the [pg_hba][].

>:WARNING: AMIs do not know what instance type you are using beforehand. Therefore
the PostgreSQL configuration (postgresql.conf) that comes with our AMI uses the default
settings, which are not optimal for most systems. Our AMI is packaged with `timescaledb-tune`,
which you can use to tune postgresql.conf based on the underlying system resources of your instance.
See our [configuration][] section for details.

>:TIP: These AMIs are made for EBS attached volumes. This allows for snapshots, protection of
data if the EC2 instance goes down, and dynamic IOPS configuration. You should choose an
EC2 instance type that is optimized for EBS attached volumes. For information on choosing the right
EBS optimized EC2 instance type, see the AWS [instance configuration page][].

[setup]: /getting-started/setup
[postgres instructions]: http://suite.opengeo.org/docs/latest/dataadmin/pgGettingStarted/firstconnect.html
[pg_hba]: https://www.postgresql.org/docs/current/static/auth-pg-hba-conf.html
[configuration]: /getting-started/configuring
[instance configuration page]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-ec2-config.html
