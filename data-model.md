# Data model

TimescaleDB utilizes a "wide-table" data model, which is quite common in the world of
relational databases. This makes Timescale somewhat different than most other time-series
databases, which typically use a "narrow-table" model.

Here we discuss why we chose the wide-table model,
and how we recommend using it for time-series data, using an Internet of Things (IoT)
 example.

Imagine a distributed group of 1,000 IoT devices designed to collect
environmental data at various intervals. This data could include:

- **Identifiers:** `device_id`, `timestamp`
- **Metadata:** `location_id`, `device_type`, `firmware_version`, `customer_id`
- **Device metrics:** `cpu_1m_avg`, `free_mem`, `used_mem`, `net_rssi`, `net_loss`, `battery`
- **Sensor metrics:** `temperature`, `humidity`, `pressure`, `CO`, `NO2`, `PM10`

For example, your incoming data may look like this:

timestamp | device_id | cpu_1m_avg | free_mem | temperature | location_id | device_type
---:|---:|---:|---:|---:|---:|---:
2017-01-01 01:02:00 | abc123 | 80 | 500MB | 72 | 335 | field
2017-01-01 01:02:23 | def456 | 90 | 400MB | 64 | 335 | roof
2017-01-01 01:02:30 | ghi789 | 120 | 0MB | 56 | 77 | roof
2017-01-01 01:03:12 | abc123 | 80 | 500MB | 72 | 335 | field
2017-01-01 01:03:35 | def456 | 95 | 350MB | 64 | 335 | roof
2017-01-01 01:03:42 | ghi789 | 100 | 100MB | 56 | 77 | roof

Now, let's look at various ways to model this data.

## Narrow-table model

Most time-series databases would represent this data in the following way:
- Represent each metric as a separate entity (e.g., represent `cpu_1m_avg`
  and `free_mem` as two different things)
- Store a sequence of "time", "value" pairs for that metric
- Represent the metadata values as a "tag-set" associated with that
metric/tag-set combination

In this model, each metric/tag-set combination is considered an individual
"time-series" containing a sequence of time/value pairs.

Using our example above, this approach would result in 9 different "time-series":
1. {*name*: cpu_1m_avg, *device_id*: abc123, *location_id*: 335, *device_type*: field}
1. {*name*: cpu_1m_avg, *device_id*: def456, *location_id*: 335, *device_type*: roof}
1. {*name*: cpu_1m_avg, *device_id*: ghi789, *location_id*: 77, *device_type*: roof}
1. {*name*: free_mem, *device_id*: abc123, *location_id*: 335, *device_type*: field}
1. {*name*: free_mem, *device_id*: def456, *location_id*: 335, *device_type*: roof}
1. {*name*: free_mem, *device_id*: ghi789, *location_id*: 77, *device_type*: roof}
1. {*name*: temperature, *device_id*: abc123, *location_id*: 335, *device_type*: field}
1. {*name*: temperature, *device_id*: def456, *location_id*: 335, *device_type*: roof}
1. {*name*: temperature, *device_id*: ghi789, *location_id*: 77, *device_type*: roof}

Each with its own set of time/value sequences.

Now, this approach may make sense if you collect each of your metrics
independently, with little to no metadata.

But in general, we believe that this approach is limiting. It loses the
inherent structure in the data, making it
harder to ask a variety of useful questions. For example:
- What was the state of the system when `free_mem` went to 0?
- How does `cpu_1m_avg` correlate with `free_mem`?
- What is the average `temperature` by `location_id`?

We also find this approach cognitively confusing. Are we really collecting
9 different time-series, or just one collection of data with a variety
of metadata and metrics readings?

## Wide-table model

In contrast, TimescaleDB uses a wide-table model, which reflects the inherent
structure in the data.

Our wide-table model actually looks exactly the same as the initial data stream:

timestamp | device_id | cpu_1m_avg | free_mem | temperature | location_id | device_type
---:|---:|---:|---:|---:|---:|---:
2017-01-01 01:02:00 | abc123 | 80 | 500MB | 72 | 42 | field
2017-01-01 01:02:23 | def456 | 90 | 400MB | 64 | 42 | roof
2017-01-01 01:02:30 | ghi789 | 120 | 0MB | 56 | 77 | roof
2017-01-01 01:03:12 | abc123 | 80 | 500MB | 72 | 42 | field
2017-01-01 01:03:35 | def456 | 95 | 350MB | 64 | 42 | roof
2017-01-01 01:03:42 | ghi789 | 100 | 100MB | 56 | 77 | roof

Here, each row is a new reading, with a set of measurements and metadata at a
given time. This allows us to preserve relationships within the data, and
ask more questions than before.

Of course, this not a new format: it's what one would commonly find within
a relational database. Which is also why we find this format more intuitive.

## JOINs with relational data

TimescaleDB's data model also has another similarity with relational
databases: it supports JOINs. Specifically, one can store additional
metadata in a secondary table, and then utilize that data at query time.

In our example, one could have a separate locations table, 
mapping `location_id` to additional metadata for that location. For example:

location_id | name | latitude | longitude | zip_code | region
---:|---:|---:|---:|---:
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


**Next:**  [How is TimescaleDB's architecture different?](/introduction/architecture)
