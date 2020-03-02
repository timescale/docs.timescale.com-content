# Getting Started with Grafana and TimescaleDB

[Grafana][grafana-website] is an open source analytics and monitoring solution 
often used to visualize time-series data. In this tutorial, you’ll learn how to:

- Setup Grafana and [Timescale Cloud][timescale-cloud] 
- Use Grafana to visualize metrics stored in TimescaleDB
- Visualize geospatial data using Grafana

### Setup Grafana and Timescale Cloud
First, you’ll want to [setup Timescale Cloud][timescale-cloud-install]. If you’d 
prefer to run your own instance of TimescaleDB, follow [the installation instructions][timescaledb-install] 
and the remainder of the tutorial should be fairly straightforward to follow.

If you’ve followed the setup instructions, you should have a working version 
of TimescaleDB (preferably Timescale Cloud) with data preloaded. In our case, 
we will use the New York City taxicab data found in the 
[Hello, Timescale!][hello-timescale] tutorial. Be sure to follow the full 
tutorial if you’re interested in background on how to use TimescaleDB.

If you’re using Timescale Cloud, you can setup a Grafana Metrics Dashboard 
from the **Create Service** flow.

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/tutorial-grafana/create_service.png" alt="Create a new Grafana service"/>

>:TIP: Alternatively, you can setup [Grafana Cloud][grafana-cloud] and follow the rest of the instructions below. Note that Grafana Cloud is more feature-rich than the open source version of Grafana included with Timescale Cloud, but does require a paid subscription from Grafana.

Finally, you need to configure Grafana to connect to your Timescale Cloud 
instance.

Start by selecting 'Add Data Source' and choosing the 'PostgreSQL' option 
in the SQL group:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/tutorial-grafana/add_data_source.png" alt="Adding Postgres to Grafana"/>

In the configuration screen, supply the `Host`, `Database`, `User`, and `Password` for 
your Timescale Cloud instance (or TimescaleDB server). 

If you’re a Timescale Cloud user, you can see this in the Service Dashboard for your 
Timescale Cloud instance.

>:TIP: Don’t forget to add the port number after your host URI. For example, `hostname.timescaledb.io:19660`. And don’t forget to change the Database name, if necessary.

Since we will be connecting to a TimescaleDB instance (in Timescale Cloud) for this 
tutorial, we will also want to check the option for 'TimescaleDB' in the 
'PostgreSQL details' section of the PostgreSQL configuration screen.

We will also change the 'Name' of the database to `NYC Taxi Cab Data`. This is 
optional, but will inform others who use our Grafana dashboard what this data source 
contains.

Once done, click 'Save & Test'. You should receive confirmation that your database 
connection is working.

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/tutorial-grafana/save_and_test.png" alt="Test your Grafana database connection"/>

### Creating a Grafana Dashboard and Panel

Grafana is organized into ‘Dashboards’ and ‘Panels’. A dashboard represents a view 
onto the performance of a system, and each dashboard consists of one or more panels, 
which represents information about a specific metric related to that system.

We will start by creating a new dashboard. In the far left of the Grafana user 
interface, you’ll see a `+` icon. If you hover over it, you’ll see a 'Create' menu, 
within which is a 'Dashboard' option. Select that 'Dashboard' option.

After creating a new dashboard, you’ll see a 'New Panel' screen, with options 
for 'Add Query' and 'Choose Visualization'. In the future, if you already have a 
dashboard with panels, you can click on the `+` icon at the **top** of the Grafana user 
interface, which will enable you to add a panel to an existing dashboard.

To proceed with our tutorial, let’s add a new visualization by clicking on the 'Choose 
Visualization' option.

At this point, you’ll have several options for different Grafana visualizations. We will 
choose the first option, the 'Graph' visualization.

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/tutorial-grafana/grafana_visualizations.png" alt="Grafana visualizations to choose from"/>

There are multiple ways to configure our panel, but we will accept all the defaults 
and create a simple 'Lines' graph.

In the far left section of the Grafana user interface, select the 'Queries' tab.

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/tutorial-grafana/create_grafana_query.png" alt="How to create a new Grafana query"/>

Instead of using the Grafana query builder, we will edit our query directly. In the 
view, click on the 'Edit SQL' button at the bottom.

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/tutorial-grafana/edit_sql_in_grafana.png" alt="Edit custom SQL queries in Grafana"/>

Before we can begin authoring our query, we also want to set the Query database to the New 
York City taxi cab datasource we connected to earlier:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/tutorial-grafana/set_datasource.png" alt="Switching data sources in Grafana"/>

### Visualize metrics stored in TimescaleDB

Let’s start by creating a visualization that answers the question **How many rides took place on each day?** 
from the [Hello, Timescale!][hello-timescale] tutorial.

From the tutorial, you can see the standard SQL syntax for our query:

```sql
SELECT date_trunc('day', pickup_datetime) as day, 
COUNT(*) 
FROM rides 
GROUP BY day 
ORDER BY day;
```

We will need to alter this query to support Grafana’s unique query syntax.

#### Modifying the SELECT statement

First, we will modify the `date_trunc` function to use the TimescaleDB `time_bucket` 
function. You can consult the TimescaleDB [API Reference on time_bucket][time-bucket-reference] 
for more information on how to use it properly.

Let’s examine the `SELECT` portion of this query. First, we will bucket our results into 
one day groupings using the `time_bucket` function. If you set the 'Format' of a Grafana 
panel to be 'Time series', for use in Graph panel for example, then the query must return 
a column named `time` that returns either a SQL `datetime` or any numeric datatype 
representing a Unix epoch.

So, part 1 of this new query is modified so that the output of the `time_bucket` grouping 
is labeled `time` as Grafana requires, while part 2 is unchanged:

```sql
SELECT 
  --1--
  time_bucket('1 day', pickup_datetime) AS "time",
  --2--
  COUNT(*)
FROM rides 
```

#### The Grafana __timeFilter command

Grafana time-series panels include a tool that enables the end-user to filter on a given 
time range. A “time filter,” if you will. Not surprisingly, Grafana has a way to link the 
user interface construct in a Grafana panel with the query itself. In this case, 
the `$__timefilter()` function.

In the modified query below, we will enable the Grafana filtering user interface element 
to set the range for the `pickup_datetime` column in our original New York City taxicab 
database.

```sql
SELECT 
  --1--
  time_bucket('1 day', pickup_datetime) AS "time",
  --2--
  count(*)
FROM rides
where $__timeFilter(pickup_datetime)
```

#### Referencing elements in our query

Finally, we will reference elements of the `SELECT` statement in our query. 
In our case, we want to group our visualization by the time buckets we’ve selected, 
and we want to order the results by the time buckets as well. So, our `GROUP BY` 
and `ORDER BY` statements will refer to the first element of the `SELECT` statement, 
in this case the `time_bucket` query.

With these changes, this is our final Grafana query:

```sql
SELECT 
  --1--
  time_bucket('1 day', pickup_datetime) AS "time",
  --2--
  count(*)
FROM rides
where $__timeFilter(pickup_datetime)
GROUP BY 1
ORDER BY 1
```

When we visualize this query in Grafana, we see the following:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/tutorial-grafana/grafana_query_results.png" alt="Visualizing time-series data in Grafana"/>

### Visualize geospatial data stored in TimescaleDB

The NYC Taxi Cab data also contains the location of each ride pickup. In the 
[Hello, Timescale! Tutorial][hello-timescale], we examined rides that originated 
near Times Square. Let’s build on that query and 
**visualize rides whose distance traveled was greater than five miles in Manhattan**.

We can do this in Grafana using the 'Worldmap Panel'. We will start by creating a 
new panel, selecting 'New Visualization', and selecting the 'Worldmap Panel'.

Once again, we will edit our query directly. In the resulting Query screen, be sure 
to select your NYC Taxicab Data as the data source. In the 'Format as' dropdown, 
select 'Table'. Click on 'Edit SQL' and enter the following query in the text window:

```sql
SELECT time_bucket('1 day', rides.pickup_datetime) AS time,
       count(rides.trip_distance > 5) AS value, 
       rides.pickup_latitude AS latitude, 
       rides.pickup_longitude AS longitude
FROM rides
where $__timeFilter(rides.pickup_datetime) AND
ST_Distance(pickup_geom, ST_Transform(ST_SetSRID(ST_MakePoint(-73.9851,40.7589),4326),2163)) < 2000
GROUP BY time,
         rides.trip_distance,
         rides.pickup_latitude,
         rides.pickup_longitude 
ORDER BY time
LIMIT 50;
```

Let’s dissect this query. First, we’re looking to count the number of rides that were 
greater than five miles in distance. The Grafana Worldmap panel cannot plot discrete 
points. It can only plot aggregations. So, we will `count` the number of rides whose 
`trip_distance` matches our parameters. We will store this result in the `value` 
field.

In the second and third lines of the `SELECT` statement, we are using the `pickup_longitude` 
and `pickup_latitude` fields in the database and mapping them to variables `longitude` 
and `latitude`, respectively.

In the `WHERE` clause, we are applying a geospatial boundary to look for trips within 
2000m of Times Square.

Finally, in the `GROUP BY` clause, we supply the `trip_distance` and location variables 
so that Grafana can plot data properly.

>:WARNING: This query may take a while, depending on the speed of your Internet connection. This is why we’re using the `LIMIT` statement for demonstration purposes.

Now let’s configure our Worldmap visualization. Select the 'Visualization' tab in the far 
left of the Grafana user interface. You’ll see options for 'Map Visual Options', 'Map Data Options', 
and more. We are concerned with the 'Field Mappings' section. We will set the 
'Table Query Format' to be ‘Table’. Then we can map the 'Latitude Field' to our `latitude` 
variable, the 'Longitude Field' to our `longitude` variable, and the 'Metric' field to our 
`value` variable. Your configuration should look like this:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/tutorial-grafana/grafana_fieldmapping.png" alt="Mapping Worldmap fields to query results in Grafana"/>

At this point, data should be flowing into our Worldmap visualization, like so:

<img class="main-content__illustration" src="https://assets.iobeam.com/images/docs/tutorial-grafana/grafana_worldmap_query_results.png" alt="Visualizing time series data in PostgreSQL using the Grafana Worldmap"/>

You should be able to edit the time filter at the top of your visualization to see trip pickup data 
for different timeframes.

### Graphing nirvana with Grafana

Grafana is a fantastic way to visualize your time-series data. It’s powerful and 
flexible and makes it possible for you to get better insight into the information 
you’re storing in TimescaleDB.

[grafana-website]: https://grafana.com
[timescale-cloud]: https://www.timescale.com/products
[timescale-cloud-install]: /getting-started/setup-timescale-cloud
[timescaledb-install]: /getting-started/installation
[hello-timescale]: /tutorials/tutorial-hello-timescale
[grafana-cloud]: https://grafana.com/get
[time-bucket-reference]: /api#time_bucket
