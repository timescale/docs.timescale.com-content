>:WARNING: Our scaling out capabilities are currently in BETA and
are not available through this installation method. For more information,
please [contact us][contact] or join the #multinode-beta channel in our 
[community Slack][slack].

## Installing from Azure Database for PostgreSQL

TimescaleDB is currently available on [Azure Database for PostgreSQL][azure-postgresql] versions 9.6 and 10. To install TimescaleDB, you need to include it in the server’s shared preloaded libraries. A change to PostgreSQL’s shared preloaded libraries requires a restart to take effect.

*Note: Only TimescaleDB v1.1.1 is available on Azure Database for PostgreSQL*

>:TIP: Azure Database for PostgreSQL currently only runs the OSS version of TimescaleDB. This means that advanced features included in TimescaleDB Community and Enterprise are not available on Azure Database for PostgreSQL. For more information on how to choose the right option for you, please view our [feature matrix][matrix].

### Using the Azure Portal
1. Select your Azure Database for PostgreSQL server.
1. On the left menu, select server parameters.
1. Search for the `shared_preload_libraries` parameter.
1. Type in `timescaledb`.
1. Select save to preserve your changes. You will receive a notification once the changes are saved.
1. After the notification, restart the server to apply these changes. To learn how to restart a server, see [Restart an Azure Database for PostgreSQL server using Azure portal][azure-restart].

You can now enable the TimescaleDB extension in your desired PostgreSQL database. Connect to the database and issue the following command:

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
```


[azure-postgresql]: https://azure.microsoft.com/en-us/services/postgresql/
[matrix]: https://www.timescale.com/products
[azure-restart]: https://docs.microsoft.com/en-us/azure/postgresql/howto-restart-server-portal
[contact]: https://www.timescale.com/contact
[slack]: https://slack.timescale.com/
