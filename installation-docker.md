## Docker Hub <a id="docker"></a>

#### Quick start

Starting a TimescaleDB instance, pulling our Docker image from [Docker Hub][] if needed.

```bash
docker run -d --name timescaledb -p 5432:5432 timescale/timescaledb
```

If you have PostgreSQL client tools (e.g., `psql`) installed locally,
you can use those to access the Timescale docker instance.  Otherwise,
and probably simpler given default PostgreSQL access-control settings,
you can connect using the instance's version of `psql` within the
container (NOTE: for Windows this is _necessary_):

```bash
docker exec -it timescaledb psql -U postgres
```

#### More detailed instructions

Our Docker image is derived from the [official Postgres image][] and
includes [alpine Linux][] as its OS.

While the above `run` command will pull the Docker image on demand,
you can also explicitly pull our image from [Docker Hub][],

```bash
docker pull timescale/timescaledb:latest
```

When running a Docker image, if one prefers to store the data in a
host directory or wants to run the docker image on top of an existing
data directory, then you can also specify a directory where a data
volume should be stored/mounted via the `-v` flag.  In particular, the
above `docker run` command should now include some additional argument
such as `-v /your/data/dir:/var/lib/postgresql/data`.

This command is also included as [docker-run.sh][] in the `scripts/`
of our github repo, which saves the data to `$PWD/data` and also
includes additional `-c` flags we recommend for memory settings, etc.

Note that creating a new container (`docker run`) will also create a new
volume unless an existing data volume is reused by reference via the
-v parameter (e.g., `-v VOLUME_ID:/var/lib/postgresql/data`). Existing
containers can be stopped (`docker stop`) and started again (`docker
start`) while retaining their volumes and data. Even if a docker
container is deleted (`docker rm`) its data volume persists on disk
until explicitly removed. Use `docker volume ls` to list the existing
docker volumes.
([More information on data volumes][docker-data-voilumes])

## Prebuilt with PostGIS

We have also published a Docker image that comes prebuilt with
PostGIS.  This image is published under the
name `timescale/timescaledb-postgis` rather than `timescale/timescaledb`.
To download and run this image, follow the same instructions as above,
but use this image name instead.

Then just add the extension from the `psql` command line:
```bash
CREATE EXTENSION postgis;
```
For more instructions on using PostGIS, [see our tutorial][tutorial-postgis].

[official Postgres image]: https://github.com/docker-library/postgres/
[alpine Linux]: https://alpinelinux.org/
[Docker Hub]: https://hub.docker.com/r/timescale/timescaledb/
[docker-data-volumes]: https://docs.docker.com/engine/tutorials/dockervolumes/#data-volumes
[docker-run.sh]: https://github.com/timescale/timescaledb/blob/master/scripts/docker-run.sh
[tutorial-postgis]: http://docs.timescale.com/tutorials/tutorial-hello-nyc#tutorial-postgis
