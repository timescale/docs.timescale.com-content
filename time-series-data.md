# What is time-series data?

What is this "time-series data" that we keep talking about, and how and why is
it different?

Many applications or databases actually take an (overly) narrow view, and equate
time-series data with something like server metrics of a specific form:

```bash
Name:  CPU

Tags:  Host=MyServer, Region=West

Data:
1990-01-01 01:02:00     70
 1990-01-01 01:03:00     71
1990-01-01 01:04:00     72
1990-01-01 01:05:00     68
```

But time-series data is much **broader** than just this specific form.  It's
really any data -- whether temperature readings from a sensor,
the price of a stock, the status of a machine, or the number of logins
to an app -- that are paired with a timestamp such that the data
represents a real world context and are valuable to analyze over time.

[Jump ahead to the various time-seres data models](/introduction/data-model)

## Characteristics of time-series data

But if you look closely at how it’s produced and ingested, there are important
characteristics that time-series databases like TimescaleDB typically leverage:

- **Time-centric**: Data records always have a timestamp
- **Append only** : Data is almost solely append-only (INSERTs)
- **Recent**: New data is typically about recent time intervals, and we
more rarely make updates or backfill missing data about old intervals.

The frequency or regularity of data is of less importance though; it can be
collected every millisecond or hour.  It can also be collected at regular or
irregular intervals (e.g., when some *event* happens, as opposed to at
pre-defined times).

But haven't databases long had time fields?  A key difference between
time-series data (and the databases that support them), compared to other
data like standard relational "business" data, is that **changes to the
data are inserts, not overwrites**.

## Time-series data is everywhere

Time-series data is everywhere, but there are environments where it is especially
being created in torrents.

- **DevOps**: Server or container metrics (CPU, free memory, net/disk IOPs),
application metrics (request rates, request latency), server or application logs,
error reports, etc.

- **Financial data**: Stock prices, payment records, and transaction events.

- **Internet of Things**: We’re in a midst of a 3rd industrial revolution,
driven by the ubiquitous connectivity of sensors reporting data with high
frequency, whether industrial machines, health applications or other wearables,
transportation and vehicles, consumer devices for smart homes, etc.

- **Event data**: Clickstream data, pageviews, impressions, durations, application
and transaction events, outage errors, system status readings, etc., especially
in e-commerce and adtech.

- **Other data**: In supply-chain and logistics, where schedules and
itineraries are created, barcodes are scanned, and sensors are deployed for
tracking shipments and fleet analytics.  Environmental monitoring is used for a
wide-range of applications, including health and precision agriculture.

**Next:**  [How is TimescaleDB's architecture different?](/introduction/architecture)
