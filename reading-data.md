# Reading data

## SELECT Commands <a id="select"></a>

TimescaleDB supports **full SQL**.

Data can be queried from a hypertable using the standard SELECT SQL command
([PostgreSQL docs][postgres-select]), including with arbitrary WHERE clauses,
GROUP BY and ORDER BY commands, JOINS, subqueries, window functions,
user-defined functions (UDFs), HAVING clauses, and so on.

In other words, if you already know SQL&mdash;or use tools that speak SQL
or PostgreSQL&mdash;you already know how to use TimescaleDB.

From basic queries:

```sql
-- Return the last 100 entries written to the database
SELECT * FROM conditions LIMIT 100;

-- Return the more recent 100 entries by time order
SELECT * FROM conditions ORDER BY time DESC LIMIT 100;

-- Number of data entries written in past 12 hours
SELECT COUNT(*) FROM conditions
  WHERE time > NOW() - interval '12 hours';
```
To more advanced SQL queries:
```sql
-- Information about each 15-min period for each location
-- over the past 3 hours, ordered by time and temperature
SELECT time_bucket('15 minutes', time) AS fifteen_min,
    location, COUNT(*),
    MAX(temperature) AS max_temp,
    MAX(humidity) AS max_hum
  FROM conditions
  WHERE time > NOW() - interval '3 hours'
  GROUP BY fifteen_min, location
  ORDER BY fifteen_min DESC, max_temp DESC;


-- How many distinct locations with air conditioning
-- have reported data in the past day
SELECT COUNT(DISTINCT location) FROM conditions
  JOIN locations
    ON conditions.location = locations.location
  WHERE locations.air_conditioning = True
    AND time > NOW() - interval '1 day'
```

---

## Advanced Analytic Queries  <a id="advanced-analytics"></a>

TimescaleDB can be used for a variety of analytical queries, both through its
native support for PostgreSQL's full range of SQL functionality, as well as
additional functions added to TimescaleDB (both for ease-of-use and for better
query optimization).

The following list is just a sample of some of its analytical capabilities.

### Median/Percentile

PostgreSQL has inherent methods for determining median values and percentiles
namely the function `percentile_cont` ([PostgreSQL docs][percentile_cont]).  An example query
for the median temperature is:

```sql
SELECT percentile_cont(0.5)
  WITHIN GROUP (ORDER BY temperature)
  FROM conditions;
```

### Cumulative Sum

One way to determine cumulative sum is using the SQL
command `sum(sum(column)) OVER(ORDER BY group)`.  For example:

```sql
SELECT host, sum(sum(temperature)) OVER(ORDER BY location)
  FROM conditions
  GROUP BY location;
```

### Moving Average

For a simple moving average, you can use the `OVER` windowing function over
some number of rows, then compute an aggregation function over those rows. The
following computes the smoothed temperature of a device by averaging its last
10 readings together:

```sql
SELECT time, AVG(temperature) OVER(ORDER BY time
      ROWS BETWEEN 9 PRECEDING AND CURRENT ROW)
    AS smooth_temp
  FROM conditions
  WHERE location = 'garage' and time > NOW() - '1 day'
  ORDER BY time DESC;
```
### Time Bucket

TimescaleDBs [time_bucket][] acts as a more powerful version of the PostgreSQL function [date_trunc][].  It accepts arbitrary time intervals as well as optional offsets and returns the bucket start time.

```sql
SELECT time_bucket('5 minutes', time) five_min, avg(cpu)
  FROM metrics
  GROUP BY five_min
  ORDER BY five_min DESC LIMIT 10;
```

### First, Last

TimescaleDB defines functions for [first][] and [last][],
which allow you to get the value of one column as ordered by another.

```sql
SELECT location, last(temperature, time)
  FROM conditions
  GROUP BY location;
```

### Histogram

TimescaleDB also provides a [histogram][] function.
The following example defines a histogram with five buckets defined over
the range 60..85. The generated histogram has seven bins where the first
is for values below the minimun threshold of 60, the middle five bins are for
values in the stated range and the last is for values above 85.


```sql
SELECT location, COUNT(*),
    histogram(temperature, 60.0, 85.0, 5)
   FROM conditions
   WHERE time > NOW() - interval '7 days'
   GROUP BY location;
```
This query will output data in the following form:
```bash
 location   | count |        histogram
------------+-------+-------------------------
 office     | 10080 | {0,0,3860,6220,0,0,0}
 basement   | 10080 | {0,6056,4024,0,0,0,0}
 garage     | 10080 | {0,2679,957,2420,2150,1874,0}
```

What analytic functions are we missing?  [Let us know on github][issues].

[postgres-select]: https://www.postgresql.org/docs/current/static/sql-select.html
[percentile_cont]: https://www.postgresql.org/docs/current/static/functions-aggregate.html#FUNCTIONS-ORDEREDSET-TABLE
[indexing]: /using-timescaledb/schema-management#indexing
[time_bucket]: /api#time_bucket
[date_trunc]: https://www.postgresql.org/docs/current/static/functions-datetime.html#functions-datetime-trunc
[first]: /api#first
[last]: /api#last
[histogram]: /api#histogram
[issues]: https://github.com/timescale/timescaledb/issues
