import {
  ANCHOR,
  PAGE,
  NON_MENU_PAGE,
  REACT_PAGE,
  LINK,
  REDIRECT,
  HIDDEN_REDIRECT,
  TITLE_PAGE,
  DIRECTORY,
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
        href: "time-series-data",
      },
      {
        Title: "Data model",
        type: PAGE,
        href: "data-model",
      },
      {
        Title: "Architecture",
        type: PAGE,
        href: "architecture",
      },
      {
        Title: "Comparison: PostgreSQL",
        type: PAGE,
        href: "timescaledb-vs-postgres",
      },
      {
        Title: "Comparison: NoSQL",
        type: PAGE,
        href: "timescaledb-vs-nosql",
      },
    ],
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
        options: { pg_version: ["12", "11"] },
        component: "InstallationPage",
        showNewsletterForm: true,
        children: [
          {
            Title: "Timescale Cloud",
            type: DIRECTORY,
            href: "timescale-cloud",
            src: "//assets.iobeam.com/images/docs/timescale_cloud_logo.svg",
            children: [
              {
                Title: "Timescale Cloud",
                type: NON_MENU_PAGE,
                options: { pg_version: [] },
                href: "installation-timescale-cloud",
              },
            ],
          },
          {
            Title: "Timescale Forge",
            type: DIRECTORY,
            href: "timescale-forge",
            src: "//assets.iobeam.com/images/docs/timescale_forge_logo.svg",
            children: [
              {
                Title: "Timescale Forge",
                type: NON_MENU_PAGE,
                options: { pg_version: [] },
                href: "installation-timescale-forge",
              },
            ],
          },
          {
            Title: "Docker",
            type: DIRECTORY,
            href: "docker",
            src: "//assets.iobeam.com/images/docs/moby.png",
            children: [
              {
                Title: "Docker",
                type: NON_MENU_PAGE,
                href: "installation-docker",
              },
            ],
          },
          {
            Title: "Ubuntu",
            type: DIRECTORY,
            href: "ubuntu",
            src: "//assets.iobeam.com/images/docs/cof_orange_hex.svg",
            children: [
              {
                Title: "apt",
                type: NON_MENU_PAGE,
                href: "installation-apt-ubuntu",
              },
              {
                Title: "Source",
                type: NON_MENU_PAGE,
                href: "installation-source",
              },
            ],
          },
          {
            Title: "Debian",
            type: DIRECTORY,
            href: "debian",
            src: "//assets.iobeam.com/images/docs/Debian_logo.svg",
            children: [
              {
                Title: "apt",
                type: NON_MENU_PAGE,
                href: "installation-apt-debian",
              },
              {
                Title: "Source",
                type: NON_MENU_PAGE,
                href: "installation-source",
              },
            ],
          },
          {
            Title: "RHEL/CentOS",
            type: DIRECTORY,
            href: "rhel-centos",
            src: "//assets.iobeam.com/images/docs/Centos_Red_Hat_logo.svg",
            children: [
              {
                Title: "yum/dnf",
                type: NON_MENU_PAGE,
                href: "installation-yum",
              },
              {
                Title: "Source",
                type: NON_MENU_PAGE,
                href: "installation-source",
              },
            ],
          },
          {
            Title: "Windows",
            type: DIRECTORY,
            href: "windows",
            src: "//assets.iobeam.com/images/docs/Windows_logo_-_2012.svg",
            children: [
              {
                Title: "Installer (.zip)",
                type: NON_MENU_PAGE,
                href: "installation-windows",
              },
              {
                Title: "Source",
                type: NON_MENU_PAGE,
                href: "installation-source-windows",
              },
            ],
          },
        ],
      },
      {
        Title: "Setting up TimescaleDB",
        type: PAGE,
        href: "setup",
        children: [
          {
            type: HIDDEN_REDIRECT,
            href: "starting-from-scratch",
            to: "/getting-started/creating-hypertables",
          },
          {
            type: HIDDEN_REDIRECT,
            href: "migrate-from-postgresql",
            to: "/getting-started/migrating-data",
          },
        ],
      },
      {
        Title: "Setting up Multi-Node TimescaleDB",
        type: PAGE,
        href: "setup-multi-node-basic",
        children: [
          {
            Title: "Advanced Setup",
            type: PAGE,
            href: "setup-multi-node-auth",
            children: [
              {
                Title: "Trust authentication",
                type: ANCHOR,
                href: "#multi-node-auth-trust",
              },
              {
                Title: "Password authentication",
                type: ANCHOR,
                href: "#multi-node-auth-password",
              },
              {
                Title: "Certificate authentication",
                type: ANCHOR,
                href: "#multi-node-auth-certificate",
              },
            ],
          },
        ],
      },
      {
        Title: "Setting up Timescale Cloud",
        type: PAGE,
        href: "exploring-cloud",
      },
      {
        Title: "Setting up Timescale Forge",
        type: PAGE,
        href: "exploring-forge",
        children: [
          {
            Title: "Resize compute and storage",
            type: PAGE,
            href: "forge-resize",
          },
          {
            Title: "Customize database configuration",
            type: PAGE,
            href: "forge-configuration",
          },
          {
            Title: "Multi-node setup",
            type: PAGE,
            href: "forge-multi-node",
          },
        ],
      },
      {
        Title: "Configuration",
        type: PAGE,
        href: "configuring",
        children: [
          {
            Title: "Postgres Settings",
            type: ANCHOR,
            href: "#postgres-config",
          },
          {
            Title: "TimescaleDB Settings",
            type: ANCHOR,
            href: "#timescaledb-config",
          },
          {
            Title: "Docker Settings",
            type: ANCHOR,
            href: "#docker-config",
          },
        ],
      },
      {
        Title: "Setting up Grafana",
        type: PAGE,
        href: "installation-grafana",
      },
      {
        Title: "Installing psql",
        type: PAGE,
        href: "install-psql-tutorial",
      },
      {
        Title: "Creating Hypertables",
        type: PAGE,
        href: "creating-hypertables",
      },
      {
        Title: "Migrating Data",
        type: PAGE,
        href: "migrating-data",
      },
      {
        type: HIDDEN_REDIRECT,
        href: "basic-operations",
        to: "/using-timescaledb/hypertables",
      },
    ],
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
            href: "#create",
          },
          {
            Title: "ALTER",
            type: ANCHOR,
            href: "#alter",
          },
          {
            Title: "DROP",
            type: ANCHOR,
            href: "#drop",
          },
          {
            Title: "Best practices",
            type: ANCHOR,
            href: "#best-practices",
          },
        ],
      },
      {
        Title: "Distributed Hypertables",
        type: PAGE,
        href: "distributed-hypertables",
        children: [
          {
            Title: "CREATE",
            type: ANCHOR,
            href: "#create",
          },
          {
            Title: "INSERT",
            type: ANCHOR,
            href: "#insert",
          },
          {
            Title: "SELECT",
            type: ANCHOR,
            href: "#select",
          },
          {
            Title: "Data node management",
            type: ANCHOR,
            href: "#data-node-management",
          },
          {
            Title: "Native replication",
            type: ANCHOR,
            href: "#native-replication",
          },
          {
            Title: "Transactions and Consistency Model",
            type: ANCHOR,
            href: "#consistency-model",
          },
        ],
      },
      {
        Title: "Schema management",
        type: PAGE,
        href: "schema-management",
        children: [
          {
            Title: "Indexing",
            type: ANCHOR,
            href: "#indexing",
          },
          {
            Title: "Triggers",
            type: ANCHOR,
            href: "#triggers",
          },
          {
            Title: "Constraints",
            type: ANCHOR,
            href: "#constraints",
          },
          {
            Title: "JSON",
            type: ANCHOR,
            href: "#json",
          },
          {
            Title: "Tablespaces",
            type: ANCHOR,
            href: "#tablespaces",
            // },
            // {
            //     Title: "Maintenance",
            //     type: ANCHOR,
            //     href: "#maintenance"
          },
        ],
      },
      {
        Title: "Writing data",
        type: PAGE,
        href: "writing-data",
        children: [
          {
            Title: "INSERT",
            type: ANCHOR,
            href: "#insert",
          },
          {
            Title: "UPDATE",
            type: ANCHOR,
            href: "#update",
          },
          {
            Title: "UPSERT",
            type: ANCHOR,
            href: "#upsert",
          },
          {
            Title: "DELETE",
            type: ANCHOR,
            href: "#delete",
          },
        ],
      },
      {
        Title: "Reading data",
        type: PAGE,
        href: "reading-data",
        children: [
          {
            Title: "SELECT",
            type: ANCHOR,
            href: "#select",
          },
          {
            Title: "Advanced analytics",
            type: ANCHOR,
            href: "#advanced-analytics",
          },
        ],
      },
      {
        Title: "Compression",
        type: PAGE,
        href: "compression",
        children: [
          {
            Title: "Quick Start",
            type: ANCHOR,
            href: "#quick-start",
          },
          {
            Title: "How It Works",
            type: ANCHOR,
            href: "#how-it-works",
          },
          {
            Title: "Advanced Usage",
            type: ANCHOR,
            href: "#advanced-usage",
          },
          {
            Title: "Future Work",
            type: ANCHOR,
            href: "#future-work",
          },
        ],
      },
      {
        Title: "Continuous Aggregates",
        type: PAGE,
        href: "continuous-aggregates",
        children: [
          {
            Title: "Real-Time Aggregates",
            type: ANCHOR,
            href: "#real-time-aggregates",
          },
          {
            Title: "Creating a Continuous Aggregate View",
            type: ANCHOR,
            href: "#create",
          },
          {
            Title: "Using Continuous Aggregates",
            type: ANCHOR,
            href: "#using",
          },
          {
            Title: "Altering / Dropping Continuous Aggregates",
            type: ANCHOR,
            href: "#alter-drop",
          },
          {
            Title: "Dropping Data",
            type: ANCHOR,
            href: "#dropping-data",
          },
          {
            Title: "Advanced Topics",
            type: ANCHOR,
            href: "#advanced-usage",
          },
          {
            Title: "Best Practices",
            type: ANCHOR,
            href: "#best-practices",
          },
          {
            Title: "Future Work",
            type: ANCHOR,
            href: "#future-work",
          },
        ],
      },
      {
        Title: "Actions",
        type: PAGE,
        href: "actions",
        children: [
          {
            Title: "Creating actions",
            type: ANCHOR,
            href: "#create",
          },
          {
            Title: "Registering actions",
            type: ANCHOR,
            href: "#register",
          },
          {
            Title: "Testing actions",
            type: ANCHOR,
            href: "#testing",
          },
          {
            Title: "Altering and deleting actions",
            type: ANCHOR,
            href: "#alter-delete",
          },
          {
            Title: "Example: Generic retention",
            type: ANCHOR,
            href: "#generic-retention",
          },
          {
            Title: "Example: Tiered storage",
            type: ANCHOR,
            href: "#tiered-storage",
          },
          {
            Title: "Example: Downsample and compress",
            type: ANCHOR,
            href: "#downsample-compress",
          },
        ],
      },
      {
        Title: "Data retention",
        type: PAGE,
        href: "data-retention",
      },
      {
        Title: "Data tiering",
        type: PAGE,
        href: "data-tiering",
      },
      {
        Title: "Visualizing data",
        type: PAGE,
        href: "visualizing-data",
      },
      {
        Title: "Ingesting data",
        type: PAGE,
        href: "ingesting-data",
      },
      {
        Title: "Troubleshooting",
        type: PAGE,
        href: "troubleshooting",
      },
      {
        Title: "Backup & restore",
        type: PAGE,
        href: "backup",
        children: [
          {
            Title: "pg_dump/pg_restore",
            type: ANCHOR,
            href: "#pg_dump-pg_restore",
          },
          {
            Title: "Docker & WAL-E",
            type: ANCHOR,
            href: "#docker-wale",
          },
        ],
      },
      {
        Title: "Alerting",
        type: PAGE,
        href: "alerting",
      },
      {
        Title: "Tooling",
        type: PAGE,
        href: "tooling",
      },
      {
        Title: "Telemetry",
        type: PAGE,
        href: "telemetry",
      },
      {
        Title: "Limitations",
        type: PAGE,
        href: "limitations",
      },
    ],
  },
  {
    Title: "Tutorials",
    type: PAGE,
    href: "tutorials",
    children: [
      {
        Title: "Get started: Hello, Timescale!",
        type: PAGE,
        href: "tutorial-hello-timescale",
        children: [],
      },
      {
        Title: "Time-series forecasting",
        type: PAGE,
        href: "tutorial-forecasting",
        children: [],
      },
      {
        Title: "Analyzing cryptocurrency data",
        type: PAGE,
        href: "analyze-cryptocurrency-data",
        children: [],
      },
      {
        Title: "Scaling out TimescaleDB",
        type: PAGE,
        href: "clustering",
        children: [],
      },
      {
        Title: "Replication",
        type: PAGE,
        href: "replication",
        children: [],
      },
      {
        Title: "Continuous aggregates",
        type: PAGE,
        href: "continuous-aggs-tutorial",
        children: [],
      },
      {
        Title: "Setup TimescaleDB and Prometheus",
        type: NON_MENU_PAGE,
        href: "tutorial-setup-timescale-prometheus",
        children: [],
      },
      {
        Title: "Visualize Prometheus data in Grafana",
        type: NON_MENU_PAGE,
        href: "tutorial-use-timescale-prometheus-grafana",
        children: [],
      },
      {
        Title: "Monitor Timescale Cloud with Prometheus",
        type: PAGE,
        href: "tutorial-setting-up-timescale-cloud-endpoint-for-prometheus",
        children: [],
      },
      {
        Title: "Integration with Prometheus",
        type: NON_MENU_PAGE,
        href: "prometheus-adapter",
        children: [],
      },
      {
        Title: "Monitor a Django application with Prometheus",
        type: PAGE,
        href: "tutorial-howto-monitor-django-prometheus",
        children: [],
      },
      {
        Title: "Collecting metrics with Telegraf",
        type: PAGE,
        href: "telegraf-output-plugin",
        children: [],
      },
      {
        Title: "Visualizing data in Grafana",
        type: PAGE,
        href: "tutorial-grafana",
        children: [],
      },
      {
        Title: "Creating Grafana dashboards",
        type: PAGE,
        href: "tutorial-grafana-dashboards",
        children: [],
      },
      {
        Title: "Build geospatial dashboards in Grafana",
        type: PAGE,
        href: "tutorial-grafana-geospatial",
        children: [],
      },
      {
        Title: "Using Grafana variables",
        type: PAGE,
        href: "tutorial-grafana-variables",
        children: [],
      },
      {
        Title: "Visualizing missing data in Grafana",
        type: PAGE,
        href: "tutorial-howto-visualize-missing-data-grafana",
        children: [],
      },
      {
        Title: "Set up Grafana alerts",
        type: PAGE,
        href: "tutorial-grafana-alerts",
        children: [],
      },
      {
        Title: "Visualizing data in Tableau",
        type: PAGE,
        href: "visualizing-time-series-data-in-tableau",
        children: [],
      },
      {
        Title: "Migration with Outflux",
        type: PAGE,
        href: "outflux",
        children: [],
      },
      {
        Title: "Node Quick Start",
        type: PAGE,
        href: "quickstart-node",
        children: [],
      },
      {
        Title: "Python Quick Start",
        type: PAGE,
        href: "quickstart-python",
        children: [],
      },
      {
        Title: "Ruby on Rails Quick Start ",
        type: PAGE,
        href: "quickstart-ruby",
        children: [],
      },
      {
        Title: "Golang Quick Start",
        type: PAGE,
        href: "quickstart-go",
        children: [],
      },
      {
        Title: "Simulate IoT Sensor Data",
        type: PAGE,
        href: "tutorial-howto-simulate-iot-sensor-data",
        children: [],
      },
      {
        Title: "Other sample datasets",
        type: PAGE,
        href: "other-sample-datasets",
        children: [
          {
            Title: "DevOps",
            type: ANCHOR,
            href: "#in-depth-devices",
          },
          {
            Title: "Weather",
            type: ANCHOR,
            href: "#in-depth-weather",
          },
        ],
      },
      {
        type: HIDDEN_REDIRECT,
        href: "tutorial-hello-nyc",
        to: "/tutorials/tutorial-hello-timescale",
      },
    ],
  },
  {
    Title: "API reference",
    type: PAGE,
    href: "api",
    children: [
      {
        Title: "Hypertable management",
        type: ANCHOR,
        href: "#hypertable-management",
      },
      {
        Title: "Compression",
        type: ANCHOR,
        href: "#compression",
      },
      {
        Title: "Continuous Aggregates",
        type: ANCHOR,
        href: "#continuous-aggregates",
      },
      {
        Title: "Automation",
        type: ANCHOR,
        href: "#automation-policies",
      },
      {
        Title: "Analytics",
        type: ANCHOR,
        href: "#analytics",
      },
      {
        Title: "Utilities/statistics",
        type: ANCHOR,
        href: "#utilities",
      },
      {
        type: HIDDEN_REDIRECT,
        href: "backup",
        to: "/using-timescaledb/backup",
      },
      {
        type: HIDDEN_REDIRECT,
        href: "update-db",
        to: "/update-timescaledb",
      },
      {
        type: HIDDEN_REDIRECT,
        href: "data-retention",
        to: "/using-timescaledb/data-retention",
      },
      {
        type: HIDDEN_REDIRECT,
        href: "api-timescaledb",
        to: "/api",
      },
    ],
  },
  {
    Title: "Development",
    type: PAGE,
    href: "development",
    children: [
      {
        Title: "Contribute to docs",
        type: PAGE,
        href: "contribute-to-docs",
      },
      {
        Title: "Code style",
        type: LINK,
        href:
          "https://github.com/timescale/timescaledb/blob/master/docs/StyleGuide.md",
      },
      {
        Title: "Contribute to code",
        type: LINK,
        href:
          "https://github.com/timescale/timescaledb/blob/master/CONTRIBUTING.md",
      },
    ],
  },
  {
    Title: "FAQ",
    type: PAGE,
    href: "faq",
  },
  {
    Title: "Release Notes",
    type: PAGE,
    href: "release-notes",
    showNewsletterForm: true,
    children: [
      {
        Title: "Changes in TimescaleDB 2.0",
        type: PAGE,
        href: "changes-in-timescaledb-2",
      },
    ],
  },
  {
    Title: "Update TimescaleDB",
    type: PAGE,
    href: "update-timescaledb",
    children: [
      {
        Title: "Updating TimescaleDB from 1.x to 2.0",
        type: PAGE,
        href: "update-tsdb-2",
      },
      {
        Title: "Updating Docker",
        type: PAGE,
        href: "update-docker",
      },
      {
        Title: "Upgrading PostgreSQL",
        type: PAGE,
        href: "upgrade-pg",
      },
    ],
  },
  {
    Title: "GitHub",
    type: LINK,
    href: "https://github.com/timescale/timescaledb",
  },
  {
    Title: "Main",
    type: TITLE_PAGE,
    href: "main",
  },
  {
    Title: "Clustering",
    type: DIRECTORY,
    href: "clustering",
    src: "//assets.iobeam.com/images/docs/Centos_Red_Hat_logo.svg",
    children: [
      {
        type: HIDDEN_REDIRECT,
        href: "getting-started/scaling-out",
        to: "/update-timescaledb",
      },
    ],
  },
];

export default pageIndex;
