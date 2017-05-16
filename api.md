# *** API/Command reference

## psql commands and metacommands
Here we list some of the most common `psql` commands and metacommands.  For a complete list, check out the [PostgreSQL psql page][psql].

### Commands

### `-c `*command*
### `--command=`*command*

Tells `psql` to execute the string *command* without entering the client shell.
The *command* string xcan be **either** a backslash command or a SQL command, but not a combination.  Multiple `-c` commands can be chained.

### `-d `*name*
### `--dbname=`*name*

Denotes the *name* of the database to connect to.

### `-h `*hostname*
### `--host=`*hostname*

Denotes the *hostname* of the machine where the PostgreSQL server is running.

---

### Metacommands

### `\c`, `\connect` `[[ -reuse-previous=on|off ] [ database_name [ username ] [ host ] [ port ] | connectioninfo ]]`

Tells `psql` to connect to a PostgreSQL server using the given parameters.

## Schema commands

## INSERT commands

## SELECT commands

## Advanced query commands

### Median/percentile

PostgreSQL has inherent methods for determining median values and percentiles namely the function `percentile_cont`[link][percentile_cont].  An example query for the median cpu_usage would be:
```SQL
SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY cpu_usage)
FROM cpu
```

### Cumulative sum

One way to determine cumulative sum would be:
```SQL
sum(sum(column)) OVER(ORDER BY group)
```
Example:
```SQL
SELECT host, sum(sum(cpu_usage)) OVER(ORDER BY host)
FROM cpu
GROUP BY host;
```

### First, last
The Timescale functions for `first` and `last` are [here][first-last]


## [TimescaleDB commands](/api/api-timescaledb)

[psql]:https://www.postgresql.org/docs/9.6/static/app-psql.html
[first-last]:/api/api-timescaledb#first-last
