>:WARNING: Our clustering capabilities are currently in private beta and
are not available through this installation method.

## From Source (Windows) [](installation-source)

**Note: TimescaleDB requires PostgreSQL 11.4+ or 12.0+. Support for
PostgreSQL 9.6.3+ and 10.9+ is deprecated and will be removed in a
future release.**

#### Prerequisites

- A standard **PostgreSQL :pg_version: 64-bit** installation
- Visual Studio 2017 (with [CMake][] and Git components)  
  **or** Visual Studio 2015/2016 (with [CMake][] version 3.4+ and Git components)
- Make sure all relevant binaries are in your PATH: `pg_config` and `cmake`

#### Build & Install with Local PostgreSQL
>:TIP: It is **highly recommended** that you checkout the latest
tagged commit to build from (see the repo's [Releases][github-releases] page for that)

Clone the repository from [GitHub][github-timescale]:

```bash
git clone https://github.com/timescale/timescaledb.git
cd timescaledb
git checkout <release_tag>  # e.g., git checkout x.y.z
```

If you are using Visual Studio 2017 with the CMake and Git components,
you should be able to open the folder in Visual Studio, which will take
care of the rest.

If you are using an earlier version of Visual Studio:

>:WARNING: This install step has to be made as admin.

```bash
# Bootstrap the build system
bootstrap.bat

# To build the extension from command line
cmake --build ./build --config Release

# To install
cmake --build ./build --config Release --target install

# Alternatively, open build/timescaledb.sln in Visual Studio and build,
# then open & build build/INSTALL.vcxproj
```

#### Update `postgresql.conf`

You will need to edit your `postgresql.conf` file to include
the TimescaleDB library, and then restart PostgreSQL. First, locate your
`postgresql.conf` file:

```bash
psql -d postgres -c "SHOW config_file;"
```

Then modify `postgresql.conf` to add the required library.  Note that
the `shared_preload_libraries` line is commented out by default.
Make sure to uncomment it when adding our library.

```bash
shared_preload_libraries = 'timescaledb'
```
>:TIP: If you have other libraries you are preloading, they should be comma separated.

Then, restart the PostgreSQL instance.

>:TIP: Our standard binary releases are licensed under the Timescale License. This means that you can use all of our free Community capabilities and seamlessly
activate Enterprise capabilities.  
To build a version of this software that contains
source code that is only licensed under Apache License 2.0, pass `-DAPACHE_ONLY=1`
to `bootstrap`.   
For more information about licensing, please read our [blog post][blog-post] about the subject.

[CMake]: https://cmake.org/
[github-releases]: https://github.com/timescale/timescaledb/releases
[github-timescale]: https://github.com/timescale/timescaledb
[blog-post]: https://www.timescale.com/blog/how-we-are-building-an-open-source-business-a7701516a480
