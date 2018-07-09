## Windows ZIP Installer [](installation-windows)

**Note: TimescaleDB requires PostgreSQL 9.6 or later+**

#### Prerequisites

- [Visual C++ Redistributable for Visual Studio 2015][c_plus] (included in VS 2015 and later)
- A standard **PostgreSQL (9.6 or 10) 64-bit** installation
- Make sure all relevant binaries are in your PATH: (use [pg_config][])

#### Build & Install

1. Download the the .zip file for your PostgreSQL version: [PostgreSQL 9.6][windows-dl-pg9.6] or [PostgreSQL 10][windows-dl-pg10]

1. Extract the zip file locally

1. Run `setup.exe`, making sure that PostgreSQL is not currently running

1. If successful, a `cmd.exe` window will pop open and you will see the following:
```bash
TimescaleDB installation completed succesfully.
Press ENTER/Return key to close...
```
Go ahead and press ENTER to close the window


#### Update `postgresql.conf`

You will need to edit your `postgresql.conf` file to include
necessary libraries, and then restart PostgreSQL. First, locate your postgresql.conf file:

```bash
psql -d postgres -c "SHOW config_file;"
```

Then modify `postgresql.conf` to add required libraries.  Note that
the `shared_preload_libraries` line is commented out by default.
Make sure to uncomment it when adding our library.

```bash
shared_preload_libraries = 'timescaledb'
```
>:TIP: If you have other libraries you are preloading, they should be comma separated.

Then, restart the PostgreSQL instance.

[c_plus]: https://www.microsoft.com/en-us/download/details.aspx?id=48145
[pg_config]: https://www.postgresql.org/docs/10/static/app-pgconfig.html
[windows-dl-pg9.6]:  https://timescalereleases.blob.core.windows.net/windows/timescaledb-postgresql-9.6_x.y.z-windows-amd64.zip
[windows-dl-pg10]: https://timescalereleases.blob.core.windows.net/windows/timescaledb-postgresql-10_x.y.z-windows-amd64.zip
