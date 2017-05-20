# Data model

There are several data models common to time-series applications, which we discuss here.  For simplicity, we explain these various choices with the following example.

Consider that an IoT device meant to collect environmental data has various information associated with it that it collects at regular intervals.

- **Identification:**  device_id, timestamp

- **Metadata:** location_id, device_type, firmware_vers, AP_mac

- **Device metrics:**  cpu_1m_avg, cpu_5m_avg, free_mem, used_mem, net_rssi, net_loss, battery

- **Sensor metrics:**  temperature, humidity, pressure, co, no2, pm2.5, pm10

It turns out there are various ways to represent this data, and they all
present various tradeoffs in terms of efficiency:  storage, insert rate,
queries of simple column rollups, more complex queries, etc.

Here we touch on some of the different design choices that can actually be
supported by TimescaleDB.  Some of these are enabled because TimescaleDB
natively supports joins, so you can also store metadata and data separately
if desired.

## Wide tables

Wide-tables are common in many relational databases, where each piece of metadata or metric is just stored as another column.  Simplifying the above example:

timestamp | device_id | loc | firmware | cpu | battery | temp | humidity
---:|---:|---:|---:|---:|---:|---:
2017-01-01 01:02:00 | "abc123" | 15 | "0.1.12" | 1.42 | 85 | 25.2 | 62
2017-01-01 01:02:12 | "def456" | 15 | "0.1.11" | 0.07 | 52 | 25.7 | 64

## Narrow tables and sparse metrics


## Data normalization
