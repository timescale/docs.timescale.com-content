## Windows ZIP Installer [](installation-windows)

**Note: TimescaleDB requires PostgreSQL 9.6 or later+**

#### Prerequisites

- A standard **PostgreSQL 9.6 or 10 64-bit** installation
- Make sure all relevant binaries are in your PATH: `pg_config`

#### Build & Install

1. Download the [.zip file from here][windows-dl]

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
>ttt If you have other libraries you are preloading, they should be comma separated.

Then, restart the PostgreSQL instance.

[CMake]: https://cmake.org/
[github-timescale]: https://github.com/timescale/timescaledb
[github-releases]: https://github.com/timescale/timescaledb/releases
[windows-dl]: https://timescalereleases.blob.core.windows.net/windows/timescaledb-x.y.z-windows-amd64.zip
