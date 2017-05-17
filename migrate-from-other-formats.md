# Migrate data from other data formats

Something something to migrate data from your current database to TimescaleDB requires conversion of your data to `.csv` or some similar file format.  Here are the steps to do it.

If you are migrating from another database, your data is likely in one of two formats we like to call _narrow row_ and _wide row_.

_Wide row_ format is similar to the way that TimescaleDB stores data, where each row is assigned to a specific timestamp and each column is assigned to a specific metric (i.e. temperature, device_id, event_name).  For these cases, ***

_Narrow row_ format is typical for some column-store databases, where each row is for a particular metric/device and each column is assigned to a particular timestamp.  For this type of data, some minor conversion to a form more suitable to TimescaleDB is required.  ***

*steps*
