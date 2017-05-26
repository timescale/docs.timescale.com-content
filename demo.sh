#!/bin/bash

QUERIES_BOTH=(
    "\dt"
    "\d rides"
    "-- This is a comment */#SELECT time_bucket('5 minute', pickup_datetime) as five_min, count(*) from rides #   WHERE pickup_datetime < '2016-01-01 03:00' #   GROUP BY five_min ORDER BY five_min;"
    "-- This is another comment */#SELECT date_trunc('day', pickup_datetime) as day, avg(fare_amount) from rides #   WHERE passenger_count > 1 and pickup_datetime < '2016-01-08' #   GROUP BY day ORDER BY day;"
    "-- This is a comment*/#SELECT DATE_TRUNC('day', pickup_datetime) as day, COUNT(*) FROM rides #   GROUP BY day ORDER BY day #   LIMIT 5;"
#    "EXPLAIN SELECT DATE_TRUNC('day', pickup_datetime) as day, COUNT(*) FROM rides GROUP BY day ORDER BY day LIMIT 1;"
)

QUERIES_TSDB=(
    "-- This is a comment*/#SELECT rate_code, COUNT(vendor_id) as num_trips FROM rides #   WHERE pickup_datetime < '2016-01-08' #   GROUP BY rate_code ORDER BY rate_code;"
    "-- This is a comment*/#SELECT rates.* FROM RATES"
    "-- This is a comment*/#SELECT rates.description, COUNT(vendor_id) as num_trips FROM rides #   JOIN rates on rides.rate_code = rates.rate_code #   WHERE pickup_datetime < '2016-01-08' #   GROUP BY rates.description ORDER BY rates.description;"
    "-- This is a comment*/#SELECT rates.description, COUNT(vendor_id) as num_trips, AVG(dropoff_datetime - pickup_datetime) as avg_trip_duration, AVG(total_amount) as avg_total, AVG(tip_amount) as avg_tip, MIN(trip_distance) as min_distance, AVG(trip_distance) as avg_distance, MAX(trip_distance) as max_distance, AVG(passenger_count) as avg_passengers #   FROM rides #   JOIN rates on rides.rate_code = rates.rate_code #   WHERE rides.rate_code in (2,3) AND pickup_datetime < '2016-02-01' #   GROUP BY rates.description ORDER BY rates.description;"
#    "BEGIN; DROP INDEX rides_rate_code_pickup_datetime_idx; SELECT rates.description, COUNT(vendor_id) as num_trips, AVG(dropoff_datetime - pickup_datetime) as avg_trip_duration, AVG(total_amount) as avg_total, AVG(tip_amount) as avg_tip, MIN(trip_distance) as min_distance, AVG(trip_distance) as avg_distance, MAX(trip_distance) as max_distance, AVG(passenger_count) as avg_passengers FROM rides JOIN rates on rides.rate_code = rates.rate_code WHERE rides.rate_code in (2,3) AND pickup_datetime < '2016-02-01' GROUP BY rates.description ORDER BY rates.description; ROLLBACK; SELECT rates.description, COUNT(vendor_id) as num_trips, AVG(dropoff_datetime - pickup_datetime) as avg_trip_duration, AVG(total_amount) as avg_total, AVG(tip_amount) as avg_tip, MIN(trip_distance) as min_distance, AVG(trip_distance) as avg_distance, MAX(trip_distance) as max_distance, AVG(passenger_count) as avg_passengers FROM rides JOIN rates on rides.rate_code = rates.rate_code WHERE rides.rate_code in (2,3) AND pickup_datetime < '2016-02-01' GROUP BY rates.description ORDER BY rates.description;"
#    "EXPLAIN SELECT COUNT(*) FROM rides;"
#    "\d+ _timescaledb_internal._hyper_1_1_0_7_data;"
#    "SELECT COUNT(*) FROM _timescaledb_internal._hyper_1_1_0_7_data;"
#    "\d"
    "\d rides"
    "-- This is a comment*/#SELECT time_bucket('30 minutes', pickup_datetime) AS thirty_min, COUNT(*) FROM rides #   WHERE ST_Distance(pickup_geom, ST_Transform(ST_SetSRID(ST_MakePoint(-73.9851,40.7589),4326),2163)) < 400 #      AND pickup_datetime < '2016-01-01 18:00' #   GROUP BY thirty_min ORDER BY thirty_min;"
)

if [[ 1 == "$#" ]]; then
    clear
    DBNAME=$1
    if [[ $DBNAME == "demo_nyc" ]]; then
	QUERIES=("${QUERIES_BOTH[@]}" "${QUERIES_TSDB[@]}" )
    else
	QUERIES=("${QUERIES_BOTH[@]}")
    fi
	
    echo "Database: $1"
    echo ""
else
    echo "Usage: "
    echo " demo.sh [database_name] (e.g., demo.sh demo_nyc)"
    exit 1
fi

for q in "${QUERIES[@]}"; do
    echo "QUERY:"
    (IFS='#'; for line in $q; do echo "$line"; done)
    echo ""

    stripped=`echo $q | cut -d '#' -f 2- | tr -d '#'`
    fullquery="\timing \\\\ $stripped"
    #echo $fullquery
    echo $fullquery | psql -q -d $DBNAME
    read -n 1 -s
    #printf "\n\n\n\n"
    clear
done
