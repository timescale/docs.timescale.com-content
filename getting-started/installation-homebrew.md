## Homebrew [](homebrew)

This will install both TimescaleDB *and* PostgreSQL via Homebrew.

**Note: TimescaleDB requires PostgreSQL 9.6.3+, 10.2+, or 11.0+**

#### Prerequisites

- [Homebrew][]

#### Build & Install

>:WARNING: If you have another PostgreSQL installation
(such as through Postgres.app), the following instructions will
cause problems. If you wish to maintain your current version of PostgreSQL
outside of Homebrew we recommend installing from source.  Otherwise please be
sure to remove non-Homebrew installations before using this method.

```bash
# Add our tap
brew tap timescale/tap

# To install
brew install timescaledb

# Post-install to move files to appropriate place
/usr/local/bin/timescaledb_move.sh
```

#### Configure your database

There are a [variety of settings that can be configured][config] for your
new database. At a minimum, you will need to update your `postgresql.conf` file
to include our library to the parameter `shared_preload_libraries`.
The easiest way to get started is to run `timescaledb-tune`, which is
installed as a dependency when you install via Homebrew:
```bash
timescaledb-tune
```

This will ensure that our extension is properly added to the parameter
`shared_preload_libraries` as well as offer suggestions for tuning memory,
parallelism, and other settings.

To get started you'll now need to restart PostgreSQL and add
a `postgres` superuser (used in the rest of the docs):
>:WARNING: If you are still on PostgreSQL 9.6 or 10 via Homebrew, you should
replace `postgresql` with <code>postgresql&#64;9.6</code> for 9.6 or
<code>postgresql&#64;10</code> for 10.

```bash
# Restart PostgreSQL instance
brew services restart postgresql

# Add a superuser postgres:
createuser postgres -s
```

>:TIP: Our standard binary releases are licensed under the Timescale License.
This means that you can use all of our free Community capabilities and
seamlessly activate Enterprise capabilities.
If you want to use a version that contains _only_ Apache 2.0 licensed
code, you should use `brew install timescaledb --with-oss-only`.
For more information about licensing, please read our [blog post][blog-post]
about the subject.

[config]: /getting-started/configuring
[Homebrew]: https://brew.sh/
[blog-post]: https://blog.timescale.com/how-we-are-building-an-open-source-business-a7701516a480
