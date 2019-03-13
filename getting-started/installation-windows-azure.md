## Installing from Azure Database for PostgreSQL

TimescaleDB is currently available on [Azure Database for PostgreSQL][azure-postgresql] versions 9.6 and 10. To install TimescaleDB, you need to include it in the server’s shared preloaded libraries. A change to PostgreSQL’s shared preloaded libraries requires a restart to take effect.

*Note: TimescaleDB is only available in version 1.1 from Azure Database for PostgreSQL*

>:TIP: Azure Database for PostgreSQL currently only runs the OSS version of TimescaleDB. This means that advanced features included in TimescaleDB Community and Enterprise are not available on Azure Database for PostgreSQL. For more information on how to choose the right option for you, please view our feature matrix.

### Using the Azure Portal
1. Select your Azure Database for PostgreSQL server.
1. On the left menu, select server parameters.
1. Search for the `shared_preloaded_libraries` parameter.
1. Type in `timescaledb`.
1. Select save to preserve your changes. You will receive a notification once the changes are saved.
1. After the notification, restart the server to apply these changes. To learn how to restart a server, see [Restart an Azure Database for PostgreSQL server using Azure portal][azure-restart].

You can now enable the TimescaleDB extension in your desired PostgreSQL database. Connect to the database and issue the following command:

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
```

Next you can [set up][setup] the database either by [creating a hypertable][create-hypertable] from scratch or [migrating existing time-series data in PostgreSQL][migrate-data].


[azure-postgresql]: https://azure.microsoft.com/en-us/services/postgresql/
[azure-restart]: https://docs.microsoft.com/en-us/azure/postgresql/howto-restart-server-portal
[setup]: /getting-started/setup
[create-hypertable]: /getting-started/creating-hypertables
[migrate-data]: /getting-started/migrating-data
