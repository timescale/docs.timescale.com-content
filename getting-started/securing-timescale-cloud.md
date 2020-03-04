# Securing network access to Timescale Cloud

One very critical piece of securing your database within Timescale Cloud is network protection.
First you must protect your system from the outside and work inward. The most basic 
network protection that can be applied is to limit the set of ports for access, 
thus reducing the attack surface area.

Exposing a minimal set of ports is a good start, but another layer you can apply 
is to protect the inbound traffic to a minimal set of source IP ranges. 
[Timescale Cloud][timescale-cloud] provides the ability to configure which source 
IP addresses are allowed to connect your TimescaleDB instance through the connection port.

This tutorial will walk you through how to configure this capability.

### Before you start

Be sure to follow the instructions to [setup Timescale Cloud][timescale-cloud-install] to
get signed up and create your first database instance.

### Step 1 - Navigate to your TimescaleDB instance

Once you have a database instance setup in the [Timescale Cloud portal][timescale-portal],
browse to this service and click on the 'Overview' tab. In the 'Connection Information' 
section, you will see the port number that is used for database connections. This is 
the port we will protect by managing inbound access.

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/overview-tab.png" alt="Timescale Cloud Overview tab"/>

### Step 2 - Find the allowed IP addresses section

Scroll down to find the 'Allowed IP Addresses' section. By default, this value is set to 
`0.0.0.0/0` which is actually wide-open.

>:WARNING: This wide-open setting simplifies getting started since it will accept incoming traffic from all sources, but you will absolutely want to narrow this range.

If you are curious about how to interpret this [Classless Inter-Domain Routing][cidr-wiki] (CIDR) syntax, 
check out [this great online tool][cidr-tool] to help decipher CIDR.

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/allowed-ip.png" alt="Allowed IP addresses"/>

### Step 3 - Change the allowed IP addresses section

Click 'Change' and adjust the CIDR value based on where your source traffic will come from. 
For example, entering a value of `192.168.1.15/32` will ONLY allow incoming traffic from a 
source IP of `192.168.1.15` and will deny all other traffic.

### Step 4 - Save your changes
Click 'Save Changes' and see this take effect immediately.

### Conclusion
Limiting IP address inbound access is just one option to improve the security of your Timescale 
Cloud database instance. There are many other types of security measures you should take into 
account when securing your data. To learn more about security options within Timescale Cloud, 
visit the [Timescale Cloud Knowledge Base][timescale-cloud-kb].

[timescale-cloud]: https://www.timescale.com/products
[timescale-cloud-install]: /getting-started/installation/timescale-cloud/installation-timescale-cloud
[hello-timescale]: /tutorials/tutorial-hello-timescale
[timescale-portal]: https://portal.timescale.cloud
[cidr-wiki]: https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing
[cidr-tool]: http://www.subnet-calculator.com/cidr.php
[timescale-cloud-kb]: https://kb.timescale.cloud/en/collections/1600092-security