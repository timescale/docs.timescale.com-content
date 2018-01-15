## From Source (Windows) <a id="installation-source"></a>

**Note: TimescaleDB only supports PostgreSQL 9.6 and 10+**

#### Prerequisites

- A standard **PostgreSQL 9.6 or 10 64-bit** installation
- Visual Studio 2017 (with [CMake][] and Git components)  
  **or** Visual Studio 2015/2016 (with [CMake][] version 3.4+ and Git components)
- Make sure all relevant binaries are in your PATH: `pg_config`, `cmake`, `MSBuild`

#### Build & Install with Local PostgreSQL
>ttt It is **highly recommended** that you checkout the latest
tagged commit to build from (see the repo's [Releases][github-releases] page for that)

Clone the repository from [Github][github-timescale]:

```bash
git clone https://github.com/timescale/timescaledb.git
cd timescaledb
git checkout <release_tag>  # e.g., git checkout x.y.z
```

If you are using Visual Studio 2017 with the CMake and Git components,
you should be able to open the folder in Visual Studio, which will take
care of the rest.

If you are using an earlier version of Visual Studio:
```bash
# Bootstrap the build system
./bootstrap.bat

# To build the extension from command line
cd build
MSBuild.exe timescaledb.sln

# To install
MSBuild.exe /p:Configuration=Release INSTALL.vcxproj

# Alternatively, open build/timescaledb.sln in Visual Studio and build,
# then open & build build/INSTALL.vcxproj
```

#### Update `postgresql.conf`

Also, you will need to edit your `postgresql.conf` file to include
necessary libraries, and then restart PostgreSQL.

```bash
# First, locate your postgresql.conf file
psql -d postgres -c "SHOW config_file;"
```

Then modify `postgresql.conf` to add required libraries.  Note that
the `shared_preload_libraries` line is commented out by default.
Make sure to uncomment it when adding our library.

```bash
shared_preload_libraries = 'timescaledb'
```

Then, restart the PostgreSQL instance.

[CMake]: https://cmake.org/
[github-timescale]: https://github.com/timescale/timescaledb
[github-releases]: https://github.com/timescale/timescaledb/releases
