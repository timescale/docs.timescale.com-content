### Docker Hub <a id="docker"></a>

You can pull our Docker images from [Docker Hub][].

```bash
docker pull timescale/timescaledb:latest
```

To run, you'll need to specify a directory where data should be
stored/mounted from on the host machine. For example, if you want
to store the data in `/your/data/dir` on the host machine:
```bash
docker run -d \
  --name timescaledb \
  -v /your/data/dir:/var/lib/postgresql/data \
  -p 5432:5432 \
  -e PGDATA=/var/lib/postgresql/data/timescaledb \
  timescale/timescaledb postgres \
  -cshared_preload_libraries=timescaledb
```
In particular, the `-v` flag sets where the data is stored. If not set,
the data will be dropped when the container is stopped.

You can write the above command to a shell script for easy use, or use
our [docker-run.sh][] in the `scripts/` of our github repo, which saves
the data to `$PWD/data`. There you can also see additional `-c` flags
we recommend for memory settings, etc.

If you have PostgreSQL installed locally, you can access the Timescale docker instance using `psql`.  Otherwise you can connect using the instance's version of `psql` within the container:
```bash
docker exec -it timescaledb psql -U postgres
```
or you can make a temporary alias like `dock_psql` with:
```bash
alias dock_psql='docker exec -it timescaledb psql -U postgres'
```

[Docker Hub]: https://hub.docker.com/r/timescale/timescaledb/
[docker-run.sh]: https://github.com/timescale/timescaledb/blob/master/scripts/docker-run.sh
