import {
    ANCHOR,
    PAGE,
    NON_MENU_PAGE,
    REACT_PAGE,
    LINK,
    REDIRECT,
    HIDDEN_REDIRECT,
    TITLE_PAGE,
    DIRECTORY
} from "../pageTypes";

const pageIndex = [
    {
        Title: "Overview",
        type: PAGE,
        href: "introduction",
        children: [
            {
                Title: "What is time-series Data?",
                type: PAGE,
                href: "time-series-data"
            }, {
                Title: "Data model",
                type: PAGE,
                href: "data-model"
            }, {
                Title: "Architecture",
                type: PAGE,
                href: "architecture"
            }, {
                Title: "Comparison: PostgreSQL",
                type: PAGE,
                href: "timescaledb-vs-postgres"
            }, {
                Title: "Comparison: NoSQL",
                type: PAGE,
                href: "timescaledb-vs-nosql"
            }
        ]
    }, {
        Title: "Getting Started",
        type: PAGE,
        href: "getting-started",
        children: [
            {
                Title: "Installing",
                type: PAGE,
                href: "clustering-installation"
            }, {
                Title: "Setting up TimescaleDB",
                type: PAGE,
                href: "setup",
                children: [
                    {
                        type: HIDDEN_REDIRECT,
                        href: "starting-from-scratch",
                        to: "/getting-started/creating-hypertables"
                    }, {
                        type: HIDDEN_REDIRECT,
                        href: "migrate-from-postgresql",
                        to: "/getting-started/migrating-data"
                    }, {
                        href: "scaling-out",
                        to: "/getting-started/scaling-out"
                    },
                ]
            }, {
                Title: "Setting up Enterprise",
                type: PAGE,
                href: "exploring-enterprise"
            }, {
                Title: "Configuration",
                type: PAGE,
                href: "configuring"
            }, {
                Title: "Creating Hypertables",
                type: PAGE,
                href: "creating-hypertables"
            }, {
                Title: "Migrating Data",
                type: PAGE,
                href: "migrating-data"
            }, {
            		Title: "Scaling Out",
            		type: PAGE,
            		href: "scaling-out"
      	    }, {
                type: HIDDEN_REDIRECT,
                href: "basic-operations",
                to: "/using-timescaledb/hypertables"
            }
        ]
    }, {
        Title: "Using TimescaleDB",
        type: PAGE,
        href: "using-timescaledb",
        children: [
            {
                Title: "Hypertables",
                type: PAGE,
                href: "hypertables",
                children: [
                    {
                        Title: "CREATE",
                        type: ANCHOR,
                        href: "#create"
                    }, {
                        Title: "ALTER",
                        type: ANCHOR,
                        href: "#alter"
                    }, {
                        Title: "DROP",
                        type: ANCHOR,
                        href: "#drop"
                    }, {
                        Title: "Best practices",
                        type: ANCHOR,
                        href: "#best-practices"
                    }
                ]
            }, {
                Title: "Schema management",
                type: PAGE,
                href: "schema-management",
                children: [
                    {
                        Title: "Indexing",
                        type: ANCHOR,
                        href: "#indexing"
                    }, {
                        Title: "Triggers",
                        type: ANCHOR,
                        href: "#triggers"
                    }, {
                        Title: "Constraints",
                        type: ANCHOR,
                        href: "#constraints"
                    }, {
                        Title: "JSON",
                        type: ANCHOR,
                        href: "#json"
                    }, {
                        Title: "Tablespaces",
                        type: ANCHOR,
                        href: "#tablespaces"
                        // },
                        // {
                        //     Title: "Maintenance",
                        //     type: ANCHOR,
                        //     href: "#maintenance"
                    }
                ]
            }, {
                Title: "Writing data",
                type: PAGE,
                href: "writing-data",
                children: [
                    {
                        Title: "INSERT",
                        type: ANCHOR,
                        href: "#insert"
                    }, {
                        Title: "UPDATE",
                        type: ANCHOR,
                        href: "#update"
                    }, {
                        Title: "UPSERT",
                        type: ANCHOR,
                        href: "#upsert"
                    }, {
                        Title: "DELETE",
                        type: ANCHOR,
                        href: "#delete"
                    }
                ]
            }, {
                Title: "Reading data",
                type: PAGE,
                href: "reading-data",
                children: [
                    {
                        Title: "SELECT",
                        type: ANCHOR,
                        href: "#select"
                    }, {
                        Title: "Advanced analytics",
                        type: ANCHOR,
                        href: "#advanced-analytics"
                    }
                ]
            }, {
                Title: "Continuous Aggregates",
                type: PAGE,
                href: "continuous-aggregates",
                children: [
                    {
                        Title: "Creating a Continuous Aggregate View",
                        type: ANCHOR,
                        href: "#create"
                    }, {
                        Title: "Using Continuous Aggregates",
                        type: ANCHOR,
                        href: "#using"
                    }, {
                        Title: "Altering / Dropping Continuous Aggregates",
                        type: ANCHOR,
                        href: "#alter-drop"
                    }, {
                        Title: "Dropping Data",
                        type: ANCHOR,
                        href: "#dropping-data"
                    }, {
                        Title: "Best Practices",
                        type: ANCHOR,
                        href: "#best-practices"
                    }, {
                        Title: "Future Work",
                        type: ANCHOR,
                        href: "#future-work"
                    }
                ]
            },{
                Title: "Visualizing data",
                type: PAGE,
                href: "visualizing-data"
            }, {
                Title: "Ingesting data",
                type: PAGE,
                href: "ingesting-data"
            }, {
                Title: "Data retention",
                type: PAGE,
                href: "data-retention"
            }, {
                Title: "Troubleshooting",
                type: PAGE,
                href: "troubleshooting"
            }, {
                Title: "Backup & restore",
                type: PAGE,
                href: "backup",
                children: [
                    {
                        Title: "pg_dump/pg_restore",
                        type: ANCHOR,
                        href: "#pg_dump-pg_restore"
                    }, {
                        Title: "Docker & WAL-E",
                        type: ANCHOR,
                        href: "#docker-wale"
                    }
                ]
            }, {
                Title: "Alerting",
                type: PAGE,
                href: "alerting"
            }, {
                Title: "Tooling",
                type: PAGE,
                href: "tooling"
            }, {
                Title: "Update software",
                type: PAGE,
                href: "update-db"
            }, {
                Title: "Telemetry",
                type: PAGE,
                href: "telemetry",
                children: []
            }
        ]
    }, {
        Title: "Tutorials",
        type: PAGE,
        href: "tutorials",
        children: [
            {
                Title: "Working with a dataset: Hello NYC",
                type: PAGE,
                href: "tutorial-hello-nyc",
                children: [
                    {
                        Title: "Advanced: PostGIS",
                        type: ANCHOR,
                        href: "#tutorial-postgis"
                    }
                ]
            }, {
                Title: "Time-series forecasting",
                type: PAGE,
                href: "tutorial-forecasting",
                children: []
            }, {
                Title: "Scaling out TimescaleDB",
                type: PAGE,
                href: "clustering",
                children: []
            }, {
                Title: "Replication",
                type: PAGE,
                href: "replication",
                children: []
            }, {
                Title: "Continuous aggregates",
                type: PAGE,
                href: "continuous-aggs-tutorial",
                children: []
            }, {
                Title: "Migration with Outflux",
                type: PAGE,
                href: "outflux",
                children: []
            }, {
                Title: "Integration with Prometheus",
                type: PAGE,
                href: "prometheus-adapter",
                children: []
            }, {
                Title: "Collecting metrics with Telegraf",
                type: PAGE,
                href: "telegraf-output-plugin",
                children: []
            },{
                Title: "Other sample datasets",
                type: PAGE,
                href: "other-sample-datasets",
                children: [
                    {
                        Title: "DevOps",
                        type: ANCHOR,
                        href: "#in-depth-devices"
                    }, {
                        Title: "Weather",
                        type: ANCHOR,
                        href: "#in-depth-weather"
                    }
                ]
            }
        ]
    }, {
        Title: "API reference",
        type: PAGE,
        href: "api",
        children: [
            {
                Title: "Hypertable management",
                type: ANCHOR,
                href: "#hypertable-management"
            }, {
                Title: "Continuous Aggregates",
                type: ANCHOR,
                href: "#continuous-aggregates"
            }, {
                Title: "Automation",
                type: ANCHOR,
                href: "#automation-policies"
            }, {
                Title: "Analytics",
                type: ANCHOR,
                href: "#analytics"
            }, {
                Title: "Utilities/statistics",
                type: ANCHOR,
                href: "#utilities"
            }, {
                type: HIDDEN_REDIRECT,
                href: "backup",
                to: "/using-timescaledb/backup"
            }, {
                type: HIDDEN_REDIRECT,
                href: "update-db",
                to: "/using-timescaledb/update-db"
            }, {
                type: HIDDEN_REDIRECT,
                href: "data-retention",
                to: "/using-timescaledb/data-retention"
            }, {
                type: HIDDEN_REDIRECT,
                href: "api-timescaledb",
                to: "/api"
            }
        ]
    }, {
        Title: "Development",
        type: PAGE,
        href: "development",
        children: [
            {
                Title: "Changelog",
                type: LINK,
                href: "https://github.com/timescale/timescaledb/blob/master/CHANGELOG.md"
            }, {
                Title: "Code style",
                type: LINK,
                href: "https://github.com/timescale/timescaledb/blob/master/docs/StyleGuide.md"
            }, {
                Title: "How to contribute",
                type: LINK,
                href: "https://github.com/timescale/timescaledb/blob/master/CONTRIBUTING.md"
            }
        ]
    }, {
        Title: "FAQ",
        type: PAGE,
        href: "faq"
    }, {
        Title: "Github",
        type: LINK,
        href: "https://github.com/timescale/timescaledb"
    }, {
        Title: "Main",
        type: TITLE_PAGE,
        href: "main"
    }

];

export default pageIndex;
