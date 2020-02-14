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
                Title: "What Is Time-series Data?",
                type: PAGE,
                href: "time-series-data"
            },
            {
                Title: "Data Model",
                type: PAGE,
                href: "data-model"
            },
            {
                Title: "Architecture",
                type: PAGE,
                href: "architecture"
            },
            {
                Title: "Comparison: Postgres",
                type: PAGE,
                href: "timescaledb-vs-postgres"
            },
            {
                Title: "Comparison: NoSQL",
                type: PAGE,
                href: "timescaledb-vs-nosql"
            }
        ]
    },
    {
        Title: "Getting Started",
        type: PAGE,
        href: "getting-started",
        children: [
            {
                Title: "Installing",
                type: REACT_PAGE,
                href: "installation",
                component: "InstallationPage",
                children: [
                    {
                        Title: "Mac",
                        type: DIRECTORY,
                        href: "mac",
                        src: "//assets.iobeam.com/images/docs/Apple_logo_black.svg",
                        children: [
                            {
                                Title: "Homebrew",
                                type: NON_MENU_PAGE,
                                href: "installation-homebrew"
                            }, {
                                Title: "Docker",
                                type: NON_MENU_PAGE,
                                href: "installation-docker"
                            }, {
                                Title: "Source",
                                type: NON_MENU_PAGE,
                                href: "installation-source"
                            }
                        ]
                    },
                    {
                        Title: "Linux",
                        type: DIRECTORY,
                        href: "linux",
                        src: "//assets.iobeam.com/images/docs/Tux.svg",
                        children: [
                            {
                                Title: "yum/dnf",
                                type: NON_MENU_PAGE,
                                href: "installation-yum"
                            }, {
                                Title: "apt",
                                type: NON_MENU_PAGE,
                                href: "installation-apt"
                            }, {
                                Title: "Docker",
                                type: NON_MENU_PAGE,
                                href: "installation-docker"
                            }, {
                                Title: "Source",
                                type: NON_MENU_PAGE,
                                href: "installation-source"
                            }
                        ]
                    },
                    {
                        Title: "Windows",
                        type: DIRECTORY,
                        href: "windows",
                        src: "//assets.iobeam.com/images/docs/Windows_logo_-_2012.svg",
                        children: [
                            {
                                Title: "Docker",
                                type: NON_MENU_PAGE,
                                href: "installation-docker"
                            }, {
                                Title: "Source",
                                type: NON_MENU_PAGE,
                                href: "installation-source-windows"
                            }
                        ]
                    }
                ]
            },
            {
                Title: "Setting up TimescaleDB",
                type: PAGE,
                href: "setup",
                children: [
                    {
                        type: HIDDEN_REDIRECT,
                        href: "starting-from-scratch",
                        to: "/getting-started/creating-hypertables"
                    },
                    {
                        type: HIDDEN_REDIRECT,
                        href: "migrate-from-postgresql",
                        to: "/getting-started/migrating-data"
                    }

                ]
            },
            {
                Title: "Configuration",
                type: PAGE,
                href: "configuring"
            },
            {
                Title: "Creating Hypertables",
                type: PAGE,
                href: "creating-hypertables"
            },
            {
                Title: "Migrating Data",
                type: PAGE,
                href: "migrating-data",
            },
            {
                type: HIDDEN_REDIRECT,
                href: "basic-operations",
                to: "/using-timescaledb/hypertables"
            }
        ]
    },
    {
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
                    },
                    {
                        Title: "ALTER",
                        type: ANCHOR,
                        href: "#alter"
                    },
                    {
                        Title: "DROP",
                        type: ANCHOR,
                        href: "#drop"
                    },
                    {
                        Title: "Best Practices",
                        type: ANCHOR,
                        href: "#best-practices"
                    }
                ]
            },
            {
                Title: "Schema management",
                type: PAGE,
                href: "schema-management",
                children: [
                    {
                        Title: "Indexing",
                        type: ANCHOR,
                        href: "#indexing"
                    },
                    {
                        Title: "Triggers",
                        type: ANCHOR,
                        href: "#triggers"
                    },
                    {
                        Title: "Constraints",
                        type: ANCHOR,
                        href: "#constraints"
                    },
                    {
                        Title: "JSON",
                        type: ANCHOR,
                        href: "#json"
                    },
                    {
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
            },
            {
                Title: "Writing Data",
                type: PAGE,
                href: "writing-data",
                children: [
                    {
                        Title: "INSERT",
                        type: ANCHOR,
                        href: "#insert"
                    },
                    {
                        Title: "UPDATE",
                        type: ANCHOR,
                        href: "#update"
                    },
                    {
                        Title: "UPSERT",
                        type: ANCHOR,
                        href: "#upsert"
                    },
                    {
                        Title: "DELETE",
                        type: ANCHOR,
                        href: "#delete"
                    }
                ]
            },
            {
                Title: "Reading Data",
                type: PAGE,
                href: "reading-data",
                children: [
                    {
                        Title: "SELECT",
                        type: ANCHOR,
                        href: "#select"
                    },
                    {
                        Title: "Advanced analytics",
                        type: ANCHOR,
                        href: "#advanced-analytics"
                    }
                ]
            },
            {
                Title: "Visualizing Data",
                type: PAGE,
                href: "visualizing-data"
            },
            {
                Title: "Ingesting Data",
                type: PAGE,
                href: "ingesting-data"
            },
            {
                Title: "Data Retention",
                type: PAGE,
                href: "data-retention"
            },
            {
                Title: "Troubleshooting",
                type: PAGE,
                href: "troubleshooting"
            },
            {
                Title: "Backup & Restore",
                type: PAGE,
                href: "backup",
                children: [
                    {
                        Title: "pg_dump/pg_restore",
                        type: ANCHOR,
                        href: "#pg_dump-pg_restore"
                    },
                    {
                        Title: "Docker & WAL-E",
                        type: ANCHOR,
                        href: "#docker-wale"
                    }
                ]
            },
            {
                Title: "Update Software",
                type: PAGE,
                href: "update-db"
            }
        ]
    },
    {
        Title: "Tutorials",
        type: PAGE,
        href: "tutorials",
        children: [
            {
                Title: "Working with a Dataset: Hello NYC",
                type: PAGE,
                href: "tutorial-hello-nyc",
                children: [
                    {
                        Title: "Advanced: PostGIS",
                        type: ANCHOR,
                        href: "#tutorial-postgis"
                    }
                ]
            },
            {
                Title: "Time-series Forecasting",
                type: PAGE,
                href: "tutorial-forecasting",
                children: []
            }, {
                Title: "Migration with Outflux",
                type: PAGE,
                href: "outflux",
                children: []
            },
            {
                Title: "Integration with Prometheus",
                type: PAGE,
                href: "prometheus-adapter",
                children: []
            },
            {
                Title: "Other Sample Datasets",
                type: PAGE,
                href: "other-sample-datasets",
                children: [
                    {
                        Title: "Device Ops",
                        type: ANCHOR,
                        href: "#in-depth-devices"
                    },
                    {
                        Title: "Weather",
                        type: ANCHOR,
                        href: "#in-depth-weather"
                    }
                ]
            }
        ]
    },
    {
        Title: "API Reference",
        type: PAGE,
        href: "api",
        children: [
            {
                Title: "Hypertable management",
                type: ANCHOR,
                href: "#hypertable-management"
            },
            {
                Title: "Analytics",
                type: ANCHOR,
                href: "#analytics"
            },
            {
                Title: "Utilities/Statistics",
                type: ANCHOR,
                href: "#utilities"
            },
            {
                type: HIDDEN_REDIRECT,
                href: "backup",
                to: "/using-timescaledb/backup"
            },
            {
                type: HIDDEN_REDIRECT,
                href: "update-db",
                to: "/using-timescaledb/update-db"
            },
            {
                type: HIDDEN_REDIRECT,
                href: "data-retention",
                to: "/using-timescaledb/data-retention"
            },
            {
                type: HIDDEN_REDIRECT,
                href: "api-timescaledb",
                to: "/api"
            }
        ]
    },
    {
        Title: "Development",
        type: PAGE,
        href: "development",
        children: [
            {
                Title: "Changelog",
                type: LINK,
                href: "https://github.com/timescale/timescaledb/blob/master/CHANGELOG.md"
            },
            {
                Title: "Code Style",
                type: LINK,
                href: "https://github.com/timescale/timescaledb/blob/master/docs/StyleGuide.md"
            },
            {
                Title: "How to Contribute",
                type: LINK,
                href: "https://github.com/timescale/timescaledb/blob/master/CONTRIBUTING.md"
            }
        ]
    },
    {
        Title: "FAQ",
        type: PAGE,
        href: "faq"
    },
    {
        Title: "GitHub",
        type: LINK,
        href: "https://github.com/timescale/timescaledb"
    },
    {
        Title: "Main",
        type: TITLE_PAGE,
        href: "main"
    }

];

export default pageIndex;
