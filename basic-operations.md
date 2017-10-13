# Basic Operations

There are a few basic operations that you will be using frequently
with hypertables within TimescaleDB: *inserting data*, *querying
data*, and *indexing data*.  We are assuming here that you have
already generated a hypertable by [creating one][] or [migrating your
data][].

### Inserting & Querying
Inserting data into the hypertable is done via normal SQL `INSERT` commands,
e.g. using millisecond timestamps:
```sql
INSERT INTO conditions(time, location, temperature, humidity)
  VALUES (NOW(), 'office', 70.0, 50.0);
```

Similarly, querying data is done via normal SQL `SELECT` commands.
```sql
SELECT * FROM conditions ORDER BY time DESC LIMIT 100;
```

SQL `UPDATE` and `DELETE` commands also work as expected. For more
examples of using TimescaleDB's standard SQL interface, please see our
API page ([INSERT][], [SELECT][]).

### Indexing Data <a id="indexing"></a>

Data is indexed via the SQL `CREATE INDEX` command. For instance,
```sql
CREATE INDEX ON conditions (location, time DESC);
```
This can be done before or after converting the table to a hypertable.

#### Indexing Suggestions

Our experience has shown that for time-series data, the most-useful index type
varies depending on your data.

For indexing columns with discrete (limited-cardinality) values (e.g., where you
are most likely to use an "equals" or "not equals" comparator) we suggest using
an index like this (using our hypertable `conditions` for the example):
```sql
CREATE INDEX ON conditions (location, time DESC);
```
For all other types of columns, i.e., columns with continuous values (e.g.,
where you are most likely to use a
"less than" or "greater than" comparator) the index should be in the form:
```sql
CREATE INDEX ON conditions (time DESC, temperature);
```
Having a `time DESC` column specification in the index allows for efficient
queries by column value and time. For example, the index defined above would
optimize the following query:
```sql
SELECT * FROM conditions WHERE location = 'garage'
  ORDER BY time DESC LIMIT 10
```

To understand why composite indexes should be defined in such a
fashion, consider an example with two locations ("office" and "garage"), and
various timestamps and temperatures:

An index on `(location, time DESC)` would be organized in sorted order
as follows:

```
garage-4
garage-3
garage-2
garage-1
office-3
office-2
office-1
```

An index on `(time DESC, location)` would be organized in sorted order
as follow:

```
4-garage
3-garage
3-office
2-garage
2-office
1-garage
1-office
```

One can think of the indexes' btrees as being constructed from most
significant bit downwards, so it first matches on the first character,
then second, etc., while in the above example I conveniently showed
them as two separate tuples.

Now, with a predicate like `WHERE location = 'garage' and time >= 1 and
time < 4`, the top is much better to use: all readings from a given
location are contiguous, so the first bit of indexes precisely finds
all metrics from garage, and then we can use any additional time
predicates to further narrow down the selected set.  With the latter,
you would have to look over all the time records [1,4), and then once
again find the right device in each. Much less efficient.

On the other hand, if our conditional was instead asking `temperature
> 80`, particularly if that conditional matched a larger number of
values.  You still need to search through all sets of time values
matching your predicate, but in each one, your query also grabs a
(potentially large) subset of the values, rather than just one
distinct one.

For sparse data where a column is often NULL, we suggest adding
a `WHERE column IS NOT NULL` clause to the index (unless you are often
searching for missing data). For example,

```sql
CREATE INDEX ON conditions (time DESC, humidity)
  WHERE humidity IS NOT NULL;
```
this creates a more compact, and thus efficient, index.

>ttt <a id="unique_indexes"></a> To a define an index as UNIQUE or PRIMARY KEY, the time column and, if it
exists, the partitioning column **must** be the first (or first two)
columns that comprise the index.  That is, using our running
example, you can define a unique index on just the {time, location} fields,
or to include a third column (say, temperature), the index
must be specified as {time, location, temperature}.  That said, we
find UNIQUE indexes in time-series data to be much less prevalent than
in traditional relational data models.


#### Default Indexes

By default, TimescaleDB automatically creates a time index on your data when a hypertable is created.

```sql
CREATE INDEX ON conditions (time DESC);
```

Additionally, if the `create_hypertable` command specifies an optional
"space partition" in addition to time (say, the `location` column),
TimescaleDB will automatically create the following index:

```sql
CREATE INDEX ON conditions (location, time DESC);
```

This default behavior can be overridden when executing the `create_hypertable` command
([see the API docs][create_hypertable]).


**Next**:  If you would like to see what you can do with a full data set,
you can check out
our [basic tutorial][] or play around on your own with our [sample datasets][].


[creating one]: /getting-started/setup/starting-from-scratch
[migrating your data]: /getting-started/setup/migrate-from-postgresql
[INSERT]: /api#insert
[SELECT]: /api#select
[basic tutorial]: /tutorials/tutorial-hello-nyc
[sample datasets]: /tutorials/other-sample-datasets
[create_hypertable]: /api/api-timescaledb#create_hypertable
