# Tutorial: Hello Timescale!

Use case: IoT Analysis and Monitoring

In this tutorial, you will learn:
   1.	How to get started with TimescaleDB and Timescale Cloud* <br>
   2.	How to use TimescaleDB to analyze and monitor data from IoT sensors <br>

Dataset: [NYC taxicab data for January 2016](https://www1.nyc.gov/site/tlc/about/tlc-trip-record-data.page)<br>
Estimated time for completion: 25 minutes.

* This tutorial is primarily designed for users of Timescale Cloud. However, you can follow along just fine if you’re using a self-hosted and/or self-managed version of TimescaleDB.

## Background

<img class="main-content__illustration" style="width: 100%" src="https://s3.amazonaws.com/docs.timescale.com/hello-timescale/NYC_taxis.png" alt="NYC Taxis"/>

New York City is home to more than [8.3 million people](https://www.bloomberg.com/news/articles/2019-04-18/new-york-city-s-population-is-shrinking-demographic-trends). In an effort to support a growing population of New Yorkers and tourists and to reduce their carbon footprint, the New York Data Team has recruited you to help analyze and monitor data from New York’s yellow cab taxis using TimescaleDB. Your work will be critical to how they plan transit upgrades, set budgets, allocate resources, and more.

You have 3 missions:
#### Mission 1: Gear Up [5 minutes]<br>
You will learn how to connect to a hosted database in Timescale Cloud and load data from a CSV file in your local terminal using psql.

#### Mission 2: Analysis [10 minutes]<br>
You will learn how to analyze a time-series dataset using TimescaleDB and PostgreSQL.

#### Mission 3: Monitoring [10 minutes]<br>
You will learn how to use TimescaleDB to monitor IoT devices. You’ll also learn about using TimescaleDB in conjunction with other PostgreSQL extensions like PostGIS, for querying geospatial data.

>:TIP: For simplicity we'll assume that TimescaleDB is installed on a
PostgreSQL server at `localhost` on the default port, and that a user `postgres` exists
with full superuser access. If your setup is different, please modify the
examples accordingly.

# Mission 1: Gear up

<img class="main-content__illustration" style="width: 100%" src="https://s3.amazonaws.com/docs.timescale.com/hello-timescale/NYC_taxis_2.png" alt="NYC Taxis"/>

The New York Data Team is a fictional organization and all goals related to it are fictional. However, this tutorial does realistically reflect the questions real city planning organizations may ask of their data and methods used to answer those questions.

The New York Data Team is using yellow taxi cab data from the [New York City Taxi and Limousine Commission](https://www1.nyc.gov/site/tlc/about/about-tlc.page) (NYC TLC). The NYC TLC is the agency responsible for licensing and regulating New York City’s Yellow taxi cabs and other for hire vehicles. These vehicles are famous for getting New Yorkers and tourists wherever they need to go across all five boroughs.

The NYC TLC has over 200,000 licensee vehicles completing about 1 million trips each day – that’s a lot of trips! Each of these rides produces time-series data, and that data needs a place to be stored. The New York Data Team have chosen TimescaleDB as their time-series database of choice and have asked you to help them get connected.

>:TIP: The steps below assume you’ve already created a Timescale Cloud account and have an instance running (you can still follow the same steps for a local installation of TimescaleDB, just be sure to change the username, password and port numbers


### 1.1 Get Connected

First, download and install psql. Next, navigate to the ‘Overview Tab’ of your Timescale Cloud dashboard and locate your host, port and password, as highlighted in Fig 1.1.

<img class="main-content__illustration" style="width: 100%" src="https://s3.amazonaws.com/docs.timescale.com/hello-timescale/NYC_figure1_1.png" alt="NYC Taxis"/>
                      Fig 1.1: Connection information from the Overview tab in Timescale Cloud <br>

Afterward, connect to your Timescale Cloud database from psql by typing the command in code block 1 into your terminal, ensuring to replace the {curly brackets} with your real password, hostname and port number found in the overview tab.

` psql` <br>
` postgres://tsdbadmin:{YOUR_PASSWORD_HERE}@{|YOUR_HOSTNAME_HERE}:{YOUR_PORT_HERE}/defaultdb?sslmode=require ` <br>
                      Code Block 1

You should see the connection message shown in code block 2 below after successfully connecting:

` psql (11.3, server 11.4) ` <br>
` SSL connection (protocol: TLSv1.2, cipher: ECDHE-RSA-AES256-GCM-SHA384, bits: 256, compression: off)`  <br>
` Type "help" for help.`  <br>

` defaultdb=>`  <br>
                      Code Block 2

To verify that TimescaleDB is installed, run the command in code block 3 which lists all installed extensions to your PostgreSQL database:

` defaultdb=> \dx` <br>
                      Code Block 3

`  defaultdb-> \dx` <br>
`                  List of installed extensions` <br>
| Name        | Version | Schema     | Description                                  |
|-------------|---------|------------|----------------------------------------------|
| plpgsql     | 1.0     | pg_catalog | PL/pgSQL procedural language                 |
| timescaledb | 1.4.2   | public     | Enables scalable inserts and complex queries |
                     Code Block 4     


### 1.2 Define Your Data Schema

As mentioned above, the NYC TLC collects ride-specific data from every vehicle, generating data from millions of rides every day.

They collect the following data about each ride: <br>
    ●	Pickup date and time (as a timestamp) <br>
    ●	Pickup location (latitude and longitude) <br>
    ●	Drop off date and time (as a timestamp) <br>
    ●	Drop off location (latitude and longitude) <br>
    ●	Trip distance (in miles) <br>
    ●	Fares (in USD) <br>
    ●	Passenger count <br>
    ●	Rate type (e.g standard, airport. For more see [RateCodeID in this doc](https://www1.nyc.gov/assets/tlc/downloads/pdf/data_dictionary_trip_records_yellow.pdf}) <br>
    ●	Payment type (Cash, credit card. For more see [Payment_type in this doc](https://www1.nyc.gov/assets/tlc/downloads/pdf/data_dictionary_trip_records_yellow.pdf)) <br>

To efficiently store that data, we’re going to need 3 tables: <br>
    1.	1 hypertable called rides, which will store all of the above data for each ride taken. <br>
    2.	1 regular Postgres table called payment_types, which maps the payment types to their English description. <br>
    3.	1 regular Postgres table called rates, which maps the numeric rate codes to their English description. <br>

See nyc_data_setup.sql [Github link: https://github.com/timescale/examples/tree/master/hello-timescale ] below which defines the schema for our 3 tables:

> -- nyc_data_setup.sql
> -- Create table 'rides' which will store trip data <br>
> `DROP TABLE IF EXISTS "rides";` <br>
> `CREATE TABLE "rides"( ` <br>
>    `vendor_id TEXT,` <br>
>    `pickup_datetime TIMESTAMP WITHOUT TIME ZONE NOT NULL,` <br>
>    `dropoff_datetime TIMESTAMP WITHOUT TIME ZONE NOT NULL,` <br>
>    `passenger_count NUMERIC,` <br>
>    `trip_distance NUMERIC,` <br>
>    `pickup_longitude  NUMERIC,` <br>
>    `pickup_latitude   NUMERIC,` <br>
>    `rate_code         INTEGER,` <br>
>    `dropoff_longitude NUMERIC,` <br>
>    `dropoff_latitude  NUMERIC,` <br>
>    `payment_type INTEGER,` <br>
>    `fare_amount NUMERIC,` <br>
>    `extra NUMERIC,` <br>
>    `mta_tax NUMERIC,` <br>
>    `tip_amount NUMERIC,` <br>
>    `tolls_amount NUMERIC,` <br>
>    `improvement_surcharge NUMERIC,` <br>
>    `total_amount NUMERIC` <br>
> `);` <br>

> -- Create hypertable for rides <br>
> -- This allows us to take advantage of timescaledb's space and time partitioning <br>
> `SELECT` `create_hypertable('rides', 'pickup_datetime', 'payment_type', 2, create_default_indexes=>FALSE)`; <br>
> -- Create indexes (special look up tables/ pointers) on the following columns to speed up data retrieval <br>
> `CREATE INDEX ON` rides (vendor_id, pickup_datetime desc); <br>
> `CREATE INDEX ON` rides (pickup_datetime desc, vendor_id); <br>
> `CREATE INDEX ON` rides (rate_code, pickup_datetime DESC); <br>
> `CREATE INDEX ON` rides (passenger_count, pickup_datetime desc); <br>
>
> -- Create table 'payment_types' to store description of payment types for easy lookup <br>
> `CREATE TABLE IF NOT EXISTS` "payment_types"( <br>
>    payment_type INTEGER, <br>
>    description TEXT <br>
> ); <br>
> `INSERT INTO` payment_types(payment_type, description) `VALUES` <br>
> (1, 'credit card'), <br>
> (2, 'cash'), <br>
> (3, 'no charge'), <br>
> (4, 'dispute'), <br>
> (5, 'unknown'), <br>
> (6, 'voided trip'); <br>

> -- Create table 'rates' to store description of rate codes for for easy lookup <br>
> `CREATE TABLE IF NOT EXISTS` "rates"( <br>
>    rate_code   INTEGER, <br>
>    description TEXT <br>
> ); <br>
> `INSERT INTO` rates(rate_code, description) `VALUES` <br>
> (1, 'standard rate'), <br>
> (2, 'JFK'), <br>
> (3, 'Newark'), <br>
> (4, 'Nassau or Westchester'), <br>
> (5, 'negotiated fare'), <br>
> (6, 'group ride'); <br>

### 1.3 Load trip data into timescaledb

[Note, if the dataset is already pre-loaded into your Timescale Cloud instance, you can skip straight to Mission 2.]

Next, let’s upload the taxi cab data into your Timescale Cloud instance. The data is in a file called nyc_data_rides.csv Download it here [Github Link: https://github.com/timescale/examples/tree/master/hello-timescale].

Then, run the statements contained in nyc_data_setup.sql (from 1.2 above) in psql to create the schemas in your database.

To confirm success, run the command below and check that you see the following tables: <br>
    ●	rides <br>
    ●	Payment_type <br>
    ●	rates <br>

> defaultdb-> `\dt`

The next step is to copy data from nyc_data_rides.csv into the ‘rides’ hypertable. To do this, we’ll use the psql \copy command below: <br>

> defaultdb=> `\COPY` rides `FROM` nyc_data_rides.csv `CSV`

Then, run the following query to validate that your insertion of data:
> `SELECT * FROM` rides
> `LIMIT` 5;

If you see the following result, congrats you’ve successfully completed Mission 1!

> `SELECT * FROM` rides
`LIMIT` 5;
| vendor_id | pickup_datetime     | drop-off_datetime   | passenger_count | trip_distance | pickup_longitude    | pickup_latitude    | rate_code | drop-off_longitude  | drop-off_latitude   | payment_type | fare_amount | extra | mta_tax | tip_amount | tolls_amount | improvement_amount | total_amount |
|-----------|---------------------|---------------------|-----------------|---------------|---------------------|--------------------|-----------|---------------------|---------------------|--------------|-------------|-------|---------|------------|--------------|--------------------|--------------|
| 1         | 2016-01-01 00:00:01 | 2016-01-01 00:11:55 | 1               | 1.2           | -73.979423522949219 | 40.744613647460938 | 1         | -73.992034912109375 | 40.753944396972656  | 2            | 9           | .5    | .5      | 2          | .5           | .5                 | 10           |
| 1         | 2016-01-01 00:00:02 | 2016-01-01 00:11:14 | 1               | 6             | -73.947151184082031 | 40.744613647460978 | 1         | -73.992034912109211 | 40.7539884396989012 | 2            | 19          | 0     | 1       | 3          | 1            | 1                  | 25           |
| 1         | 2016-01-01 00:02:02 | 2016-01-01 00:14:02 | 1               | 4.1           | -73.947151184082031 | 40.744613647460938 | 1         | -73.992034912158711 | 40.7539884396972622 | 2            | 14          | 1     | 1       | 3          | 0            | 1                  | 20           |
| 1         | 2016-01-01 00:02:32 | 2016-01-01 00:05:38 | 1               | 2.6           | -73.979423522949219 | 40.744613647460938 | 1         | -73.992034912104290 | 40.7539884396972656 | 2            | 12          | 1     | 1       | 2          | 0            | 1                  | 17           |
(5 rows)

## Mission 2: Analysis

<img class="main-content__illustration" style="width: 100%" src="https://s3.amazonaws.com/docs.timescale.com/hello-timescale/NYC_picture_3.png" alt="NYC Taxis"/>

The day is 1 February 2016, and the government has just issued a notice that, in an effort to mitigate the impact of global warming, all public entities must take measures to decrease their carbon footprint. New York City has committed to reducing their greenhouse gas emissions by 20% by 2024. Given the number of taxi rides taken each day, they believe studying past taxi rider history will play a major factor in doing so.

The New York Data Team have recruited you to help them make sense of historical taxi ride data, draw insights, and use your analysis to plan for the future. Your goal is to conduct an analysis of all NYC TLC taxi rides taken  in January 2016.

### 2.1 Basic Analysis 

#### 2.1.1 How many rides took place on each day?

The first question that they’ve asked you to explore is simple: How many rides took place on each day during January 2016?

Since TimescaleDB supports full SQL, all that’s required is a simple SQL query to count the number of rides and group/ order them by the day they took place, as seen in query 2.1.1 below:

> -- 2.1.1
> -- What's the total number of rides that took place everyday for first 5 days
> `SELECT` date_trunc('day', pickup_datetime) as day, `COUNT(*) FROM` rides
>   GROUP BY` day `ORDER BY` day

#### 2.1.2 What is the average fare amount for 2+ passengers?

The next question they’d like an answer to is what the daily average fare amount for rides with 2+ passengers for the first week of January? Once again, this is a simple 4 line SQL query with some conditional statements, shown in query 2.1.2 below:

> -- 2.1.2
> -- What is the daily average fare amount for rides with 2 or more passengers
> -- for first 7 days <br>
> `SELECT date_trunc('day', pickup_datetime) as day, avg(fare_amount)
>   FROM rides
>   WHERE passenger_count > 1 AND pickup_datetime < '2016-01-08'
>   GROUP BY day ORDER BY day;`

An interesting aside is that queries like query 2.1.1 and 2.1.2 execute up to 20x faster on TimescaleDB than on a vanilla PostgreSQL database, thanks to Timescale’s automatic time and space partitioning.

#### 2.1.3 How many rides took place by each rate type?

Another thing the New York Data Team would like to know is the breakdown of rides by ride type. We see in query 2.1.3 (a) how to achieve this in SQL:

> -- 2.1.3 (a)
> -- How many rides of each rate type took place in the month? <br>
> `SELECT rate_code, COUNT(vendor_id) as num_trips FROM rides
>  WHERE pickup_datetime < '2016-02-01'
>  GROUP BY rate_code ORDER BY rate_code;`

After running query 2.1.3 (a) above , you’ll get the following output, which shows how many rides of each rate code took place.

<img class="main-content__illustration" style="width: 25%" src="https://s3.amazonaws.com/docs.timescale.com/hello-timescale/NYC_Figure2_1_3_1.png" alt="NYC Query"/>
 
    Fig 2.1.3.1: Results for rides breakdown by rate code in query 2.1.3 (a)

While that’s technically correct, you’d like to present something more human readable to the NYC TLC. To do that, we can use the power of SQL joins, like in query 2.1.3 (b) below:

> -- 2.1.3 (b)
> -- How many rides of each rate type took place?
> -- Join rides with rates to get more information on rate_code
> `SELECT` rates.description, `COUNT`(vendor_id) as num_trips `FROM` rides
>   `JOIN` rates on rides.rate_code = rates.rate_code
>   `WHERE` pickup_datetime < '2016-02-01'
>   `GROUP BY` rates.description `ORDER BY` rates.description;

 <img class="main-content__illustration" style="width: 25%" src="https://s3.amazonaws.com/docs.timescale.com/hello-timescale/NYC_Figure2_1_3_2.png" alt="NYC Query"/>
 
           Fig 2.1.3.2: Results for rides breakdown by rate code in human readable form in query 2.1.3 (b)

#### This is a simple illustration of a powerful point: By allowing JOINs over hypertables and regular PostgreSQL tables, TimescaleDB allows you to combine your time-series data with your relational or business data to unearth powerful insights.

## 2.2 Airport Ride Analysis

### 2.2.1 Analysis of rides to JFK and EWR

From your work calculating rides by rate type, the NYC TLC noticed that rides to John F Kennedy International Airport (JFK) and Newark International Airport (EWR) were the 2nd and 4th most popular ride types, respectively. Given this popularity in airport rides and consequent carbon footprint, the city of New York thinks that airport public transportation could be an area of improvement - reducing traffic in the city and overall carbon footprint associated with airport trips.

Prior to instituting any programs, they would like you to more closely examine trips to JFK (code 2) and Newark (code 3). For each airport, they would like to know the following for the month of January: <br>
    ●	Number of trips to that airport <br>
    ●	Average trip duration (i.e drop off time - pickup time) <br>
    ●	Average trip cost <br>
    ●	Average tip <br>
    ●	Minimum, Maximum and Average trip distance <br>
    ●	Average number of passengers <br>

To do this, we can run query 2.2.1: <br>

> -- 2.2.1 <br>
> -- For each airport: num trips, avg trip duration, avg cost, avg tip, avg distance, min distance, max distance, avg number of passengers <br>
> `SELECT rates.description, `COUNT`(vendor_id) as num_trips,` <br>
>    `AVG(dropoff_datetime - pickup_datetime) as avg_trip_duration, AVG(total_amount) as avg_total,` <br>
>    `AVG(tip_amount) as avg_tip, MIN(trip_distance) as min_distance, `AVG`(trip_distance) as avg_distance, MAX(trip_distance) as max_distance,` <br>
>    `AVG(passenger_count) as avg_passengers` <br>
>  `FROM rides` <br>
>  `JOIN rates on rides.rate_code = rates.rate_code` <br>
>  `WHERE rides.rate_code in (2,3) `AND` pickup_datetime < '2016-02-01'` <br>
>  `GROUP BY rates.description `ORDER BY` rates.description;` <br>

Which produces the following output: <br>

 <img class="main-content__illustration" style="width: 25%" src="https://s3.amazonaws.com/docs.timescale.com/hello-timescale/NYC_Figure2_2.png" alt="NYC Query"/>

    Fig 2.2: Results for airport rides analysis in query 2.2.1

The New York Data Team was very happy about your ride comparison work. Based on your analysis, they identified: <br>

    ●	There are 13x more rides to JFK than Newark. This often leads to heavy traffic on the roads to and from JFK, especially during peak times. They’ve decided to explore road improvements to those areas, as well as increasing public transport to and from the airport (e.g busses, subway, trains etc) <br>
    ●	Each airport ride has on average the same number of passengers per trip (~1.7 passengers per trip). <br>
    ●	The trip distances are roughly the same 16-17 miles. <br>
    ●	JFK is about 30% cheaper, most likely because of NJ tunnel and highway tolls. <br>
    ●	Newark trips are 22% (10 min) shorter. <br>

This data is useful not just for city planners, but also for airport travellers and tourism organizations like the NYC Tourism Bureau. For example, a tourism organization could recommend cost-conscious travelers who’d rather not fork out $84 for a ride to Newark to use public transport instead, like the NJ Transit train from Penn Station ($15.25 for an adult ticket). Similarly, they could recommend those travelling to JFK airport, and who are weary of heavy traffic, to take the subway and airtrain instead, for just $7.50.

Moreover, you could also make recommendations for those flying out of New York City about which airport to choose. For example, from the data above, we can recommend those travellers who think they’d be in a rush and who don’t mind paying a little extra to consider flying out of Newark over JFK.

#### If you’ve made it this far, you’ve successfully completed Mission 2 and now have a basic understanding of how to analyze time-series data using TimescaleDB!

## Mission 3: Monitoring

The NYC Data Team would also like to use the time-series data from taxi rides for monitoring the ride’s current status.

(Note: A more realistic setup would involve creating a data pipeline that streams sensor data directly from the cars into TimescaleDB. However, we will use the January 2016 data to illustrate the underlying principles that are applicable regardless of setup.)
3.1 Basic time-based monitoring
It’s January 1st 2016. NYC riders have celebrated New Year’s Eve, and using taxi cabs to get home safely or to travel to their first gathering of the new year.

### 3.1.1 How many rides took place every 5 minutes for the first day of 2016? <br>
The first thing the New York Data Team would like to know is how many rides have recently taken place. We can approximate that by counting the number of rides that were completed on the first day of 2016, in 5 minute intervals.

While it's easy to count how many rides took place, there is no easy way to segment data by 5 minute time intervals in PostgreSQL. As a result, we will need to use a query similar to query 3.1.1 (a) below: <br>

> -- 3.1.1 (a)
> -- Vanilla Postgres query for num rides every 5 minutes <br>
> `SELECT` <br>
>   `EXTRACT(hour from pickup_datetime) as hours,` <br>
>   `trunc(EXTRACT(minute from pickup_datetime) / 5)*5 AS five_mins`, <br>
>   `COUNT(*)` <br>
> `FROM <br>
>   rides` <br>
> `WHERE <br>
>   pickup_datetime < '2016-01-02 00:00'` <br>
> `GROUP BY <br>
>   hours, <br>
>   five_mins` <br>

It’s not immediately clear why query 3.1.1 (a) returns rides by segmented by 5 minute buckets, so let’s examine it more closely, using the sample time of 08:49:00. Note, to see how Timescale simplifies common time-series analysis tasks, like segmenting data by arbitrary time intervals, you can skip to query 3.1.1 (b).

In query 3.1.1, we first extract hours, the hour that a ride took place in: <br>

  >  `EXTRACT(hour from pickup_datetime) as hours,` <br>
  
So for 08:49 our result for hours would be 8. Then we need to calculate, five_mins, the closest multiple of 5 minutes for a given timestamp. To do this, we calculate the quotient of the minute that a ride took place divided by 5. Then we truncate the result to take the ‘floor’ of that quotient. Afterward, we multiply that truncated quotient by 5 to in essence find the 5 minute bucket that the minute is closest to: <br>

  >  `trunc(EXTRACT(minute from pickup_datetime) / 5)*5 AS five_mins,` <br>
  
So our result for time of 08:49 would be trunc(49/5)*5 = trunc(9.8)*5 = 9*5 = 45, so this time would be in the 45min bucket. After exacting both the hours and which 5 minute interval the time fell into, we’d then group our results, first by the hours and then the five_mins interval. Whew, that was a lot for a conceptually simple question!

Questions that call for segmentation by arbitrary time intervals are common in time-series analysis, but can sometimes be unwieldy in vanilla PostgreSQL. Thankfully, to help make time-series analysis quick and simple, Timescale has many SQL functions specifically made for time-series analysis. One of those special Timescale SQL functions is time_bucket. time_bucket is a more powerful version of the PostgreSQL date_trunc function, as it allows for arbitrary time intervals, rather than the standard day, minute, hour provided by date_trunc.

So when using TimescaleDB, the complex query 3.1.1 (a) above turns into a simple 4 line SQL query, as seen in 3.1.1 (b) below: <br>

> -- 3.1.1 (b)
> -- How many rides took place every 5 minutes for the first day of 2016?
> -- using the TimescaleDB "time_bucket" function <br>
> `SELECT time_bucket('5 minute', pickup_datetime) AS five_min, count(*) <br>
>   FROM rides <br>
>   WHERE pickup_datetime < '2016-01-02 00:00 <br>
>   GROUP BY five_min `ORDER BY` five_min;` <br>

## 3.2 Dude, where’s my car? (Timescale + PostGIS)

New York City is famous for the annual [Ball Drop New Year’s Eve](https://en.wikipedia.org/wiki/Times_Square_Ball) celebration in Times Square. Thousands of people gather in Time Square to bring in the new year together and then head home, to their favorite bar or first gathering of the new year.

This matters to you - as a member of the New York Data Team - because you’d like to understand taxi demand in the Times Square area on the first day of 2016.

### 3.2.1 How many rides on New Year’s Morning originated from within 400m of Times Square, by 30 minute buckets?

To answer this question, your first guess might be to use our friend ‘time_bucket’ from 3.1.1 above to count rides initiated in 30 minute intervals. But there’s one piece of information we don’t have -- how do we figure out which rides started near Time Square?

This requires that we make use of the pick up latitude and longitude columns in our ‘rides’ hypertable (see section 1.3 above), which provides each ride’s pickup location. To take advantage of the pickup location, we’ll need to get our hypertable ready for geospatial queries.

The good news is that Timescale is compatible with all other Postgres extensions and, for geospatial data, we’ll use PostGIS. This allows us to slice data by time and location with the speed and scale of TimescaleDB!

> -- Geospatial queries - Timescale + POSTGIS -- slice by time and location <br>
> -- Install the extension in the database <br>
> `CREATE EXTENSION postgis;`

Then, run the following command to verify that PostGIS was installed properly. You should see the PostGIS extension in your extension list, as note in bold below:

> defaultdb=> \dx
                                        List of installed extensions 
     Name     | Version |   Schema   |                             Description      <br>                       
 -------------+---------+------------+--------------------------------------------------------------------- <br>
  plpgsql     | 1.0     | pg_catalog | PL/pgSQL procedural language <br>
  postgis     | 2.5.1   | public     | PostGIS geometry, geography, and raster spatial types and functions <br>
  timescaledb | 1.4.2   | public     | Enables scalable inserts and complex queries for time-series data <br>
 (3 rows) <br>

Now, we need to alter our table to work with PostGIS. To start, we’ll add geometry columns for ride pick up and drop off locations:
> -- Create geometry columns for each of our (lat,long) points <br>
> `ALTER TABLE rides ADD COLUMN pickup_geom geometry(POINT,2163);` <br>
> `ALTER TABLE rides ADD COLUMN dropoff_geom geometry(POINT,2163);` <br>

Next we’ll need to convert the latitude and longitude points into geometry coordinates so that it plays well with PostGIS: <br>
> -- Generate the geometry points and write to table
> -- (Note: These calculations might take a few mins)
> `UPDATE rides SET pickup_geom = ST_Transform(ST_SetSRID(ST_MakePoint(pickup_longitude,pickup_latitude),4326),2163);
> UPDATE rides SET dropoff_geom = ST_Transform(ST_SetSRID(ST_MakePoint(dropoff_longitude,dropoff_latitude),4326),2163);` 

Lastly, we need one more piece of info: Times Square is located at (lat, long) (40.7589,-73.9851)

Now, we have all the information to answer our original question: 
#### How many rides on New Year’s Morning originated within 400m of Times Square, by 30 minute buckets?

> -- 3.2.1
> --Times Sq and midnight rides <br>
> -- how many taxis pick up rides within 400m of Times Square on New Years Day, grouped by 30 minute buckets. <br>
> -- Number of rides on New Years Day originating within 400m of Times Square, by 30 min buckets <br>
> --   Note: Times Square is at (lat, long) (40.7589,-73.9851) <br>

> `SELECT time_bucket('30 minutes', pickup_datetime) AS thirty_min, COUNT(*) AS near_times_sq` <br>
>   `FROM rides` <br>
>   `WHERE ST_Distance(pickup_geom, ST_Transform(ST_SetSRID(ST_MakePoint(-73.9851,40.7589),4326),2163)) < 400` <br>
>     `AND pickup_datetime < '2016-01-01 14:00` <br>
>   `GROUP BY thirty_min ORDER BY thirty_min;` <br>

You should get the following results:

 <img class="main-content__illustration" style="width: 25%" src="39

NYC_Figure3_2_1.png
https://s3.amazonaws.com/docs.timescale.com/hello-timescale/NYC_Figure3_2_1.png" alt="NYC Query"/>

           Fig 3.2.1: Results for rides near Times Square by 30 min intervals from query 3.2.1

From Fig 3.2.1 above, the New York Data Team saw that few people wanted to leave by taxi around midnight, while many left by taxi between 03:00-05:00, after the bars, clubs and other New Years Eve parties closed. They are taking steps to incentivize drivers to be available after 3:00am on New Year’s day to meet the increased ride demand during that time.

Rides then picked up in the mid-morning hours, as people headed to breakfast and other New Years activities. New York is truly the city that never sleeps and Times Square is a good reflection of that!

This is one example of how you can combine other PostgreSQL extensions with TimescaleDB to build powerful queries, answer big questions, and make recommendations.

#### Congratulations, you’ve successfully used Timescale and PostGIS to slice your data by time and location - completing the third and final mission of this tutorial!

## Conclusions and Next Steps
In this tutorial you learned: <br>

    1.	How to get started with TimescaleDB and Timescale Cloud

In Mission 1, you learned how to connect to a database in Timescale Cloud and load data from a CSV file using psql. <br>

    2.	How to use TimescaleDB to gain insights from IoT data for both monitoring and analysis

In Missions 2 and 3 you learned how to use TimescaleDB to conduct analysis and monitoring on an IoT dataset. You learned about hypertables, saw how Timescale supports full SQL and how JOINs enable you to combine your time-series data with your relational or business data.

You also learned about special Timescale SQL functions like time_bucket and how they make time-series analysis possible in fewer lines of code, as well as how Timescale is compatible with other extensions like PostGIS, for fast querying by time and location.

Ready for more learning? Here’s a few suggestions:
[Time Series Forecasting using TimescaleDB, R, Apache MADlib and Python](https://docs.timescale.com/latest/tutorials/tutorial-forecasting) <br>
[Continuous Aggregates](https://docs.timescale.com/latest/tutorials/continuous-aggs-tutorial) <br>
[Documentation for working with TimescaleDB, the open-source time-series database](https://docs.timescale.com) <br>
