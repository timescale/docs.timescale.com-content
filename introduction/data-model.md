# Data Model

As a relational database supporting full SQL, TimescaleDB supports flexible data models
that can be optimized for different use cases. This makes Timescale somewhat different from
most other time-series databases, which typically use "narrow-table" models.

Specifically, TimescaleDB can support both wide-table and narrow-table models. Here, we discuss
the different performance trade-offs and implications of these two models using an Internet of
Things (IoT) example.

Imagine a distributed group of 1,000 IoT devices designed to collect
environmental data at various intervals. This data could include:

- **Identifiers:** `device_id`, `timestamp`
- **Metadata:** `location_id`, `dev_type`, `firmware_version`, `customer_id`
- **Device metrics:** `cpu_1m_avg`, `free_mem`, `used_mem`, `net_rssi`, `net_loss`, `battery`
- **Sensor metrics:** `temperature`, `humidity`, `pressure`, `CO`, `NO2`, `PM10`

For example, your incoming data may look like this:

timestamp | device_id | cpu_1m_avg | free_mem | temperature | location_id | dev_type
---:|---:|---:|---:|---:|---:|---:
2017-01-01 01:02:00 | abc123 |  80 | 500MB | 72 | 335 | field
2017-01-01 01:02:23 | def456 |  90 | 400MB | 64 | 335 | roof
2017-01-01 01:02:30 | ghi789 | 120 |   0MB | 56 |  77 | roof
2017-01-01 01:03:12 | abc123 |  80 | 500MB | 72 | 335 | field
2017-01-01 01:03:35 | def456 |  95 | 350MB | 64 | 335 | roof
2017-01-01 01:03:42 | ghi789 | 100 | 100MB | 56 |  77 | roof


Now, let's look at various ways to model this data.

## Narrow-table Model

Most time-series databases would represent this data in the following way:
- Represent each metric as a separate entity (e.g., represent `cpu_1m_avg`
  and `free_mem` as two different things)
- Store a sequence of "time", "value" pairs for that metric
- Represent the metadata values as a "tag-set" associated with that
metric/tag-set combination

In this model, each metric/tag-set combination is considered an individual
"time series" containing a sequence of time/value pairs.

Using our example above, this approach would result in 9 different "time series", each of which is defined by a unique set of tags.
```
1. {name:  cpu_1m_avg,  device_id: abc123,  location_id: 335,  dev_type: field}
2. {name:  cpu_1m_avg,  device_id: def456,  location_id: 335,  dev_type: roof}
3. {name:  cpu_1m_avg,  device_id: ghi789,  location_id:  77,  dev_type: roof}
4. {name:    free_mem,  device_id: abc123,  location_id: 335,  dev_type: field}
5. {name:    free_mem,  device_id: def456,  location_id: 335,  dev_type: roof}
6. {name:    free_mem,  device_id: ghi789,  location_id:  77,  dev_type: roof}
7. {name: temperature,  device_id: abc123,  location_id: 335,  dev_type: field}
8. {name: temperature,  device_id: def456,  location_id: 335,  dev_type: roof}
9. {name: temperature,  device_id: ghi789,  location_id:  77,  dev_type: roof}
```
The number of such time series scales with the cross-product of the
cardinality of each tag, i.e., (# names) &times; (# device ids) &times; (#
location ids) &times; (device types). Some time-series databases struggle as
cardinality increases, ultimately limiting the number of device types and devices
you can store in a single database.

TimescaleDB supports narrow models and does not suffer from the same cardinality limitations
as other time-series databases do. A narrow model makes sense if you collect each metric
independently. It allows you to add new metrics as you go by adding a new tag without
requiring a formal schema change.

However, a narrow model is not as performant if you are collecting many metrics with the
same timestamp, since it requires writing a timestamp for each metric. This ultimately
results in higher storage and ingest requirements. Further, queries that correlate different metrics
are also more complex, since each additional metric you want to correlate requires another
JOIN. If you typically query multiple metrics together, it is both faster and easier to store them
in a wide table format, which we will cover in the following section.

## Wide-table Model

TimescaleDB easily supports wide-table models. Queries across multiple metrics are
easier in this model, since they do not require JOINs. Also, ingest is faster
since only one timestamp is written for multiple metrics.

A typical wide-table model would match
a typical data stream in which multiple metrics are collected at a given timestamp:

timestamp | device_id | cpu_1m_avg | free_mem | temperature | location_id | dev_type
---:|---:|---:|---:|---:|---:|---:
2017-01-01 01:02:00 | abc123 | 80 | 500MB | 72 | 42 | field
2017-01-01 01:02:23 | def456 | 90 | 400MB | 64 | 42 | roof
2017-01-01 01:02:30 | ghi789 | 120 | 0MB | 56 | 77 | roof
2017-01-01 01:03:12 | abc123 | 80 | 500MB | 72 | 42 | field
2017-01-01 01:03:35 | def456 | 95 | 350MB | 64 | 42 | roof
2017-01-01 01:03:42 | ghi789 | 100 | 100MB | 56 | 77 | roof

Here, each row is a new reading, with a set of measurements and metadata at a
given time. This allows us to preserve relationships within the data, and
ask more interesting or exploratory questions than before.

Of course, this is not a new format: it's what one would commonly find within
a relational database.

## JOINs with Relational Data

TimescaleDB's data model also has another similarity with relational
databases: it supports JOINs. Specifically, one can store additional
metadata in a secondary table, and then utilize that data at query time.

In our example, one could have a separate locations table,
mapping `location_id` to additional metadata for that location. For example:

location_id | name | latitude | longitude | zip_code | region
---:|---:|---:|---:|---:|---:
42 | Grand Central Terminal | 40.7527° N | 73.9772° W | 10017 | NYC
77 | Lobby 7 | 42.3593° N | 71.0935° W | 02139 | Massachusetts

Then at query time, by joining our two tables, one could ask questions
like: what is the average `free_mem` of our devices in `zip_code` 10017?

Without joins, one would need to denormalize their data and store
all metadata with each measurement row. This creates data bloat,
and makes data management more difficult.

With joins, one can store metadata independently, and update mappings
more easily.

For example, if we wanted
to update our "region" for `location_id` 77 (e.g., from "Massachusetts"
to "Boston"), we can make this change without having to go back and
overwrite historical data.


**Next:**  [How is TimescaleDB's architecture different?][architecture]

[architecture]: /introduction/architecture
