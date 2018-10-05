## Installing from an Amazon AMI (Ubuntu)

TimescaleDB is currently available as an Ubuntu 16.04 Amazon EBS-backed AMI. AMIs are
distributed by region, and our AMI is currently available in `us-east-1`, `us-east-2`,
`us-west-1`, and `us-west-2`. Note that this image is built to use an EBS attached volume
rather than the default disk that comes with EC2 instances.

See below for the image id corresponding to each region for the most recent TimescaleDB version:

Region | Image id
--- | ---
us-east-1 | ami-0ecf0cc105d5a8fc0
us-east-2 | ami-0bd0ceaa391794533
us-west-1 | ami-03645fd772b136a5a
us-west-2 | ami-0566aa080793cac7c


To launch the AMI, go to the `AMIs` section of your AWS EC2 Dashboard and select
`Public Images` under the dropdown menu. Filter the image-id by the image id for your
region, select the image, and click the `Launch` button.

You can also use the image id to build an instance using Cloudformation, Terraform,
the AWS CLI, or any other AWS deployment tool that supports building from public AMIs.
