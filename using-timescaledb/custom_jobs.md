# Custom Jobs

In addition to executing builtin policies our automation framework also
allows the execution of custom functions and procedures. This allows
automatic periodic tasks that are not covered by existing policies and
even enhancing existing policies with additional functionality.

## Creating a custom job procedure


The function signature for custom jobs is (job_id INT, config JSONB).
The content of the config JSONB is completely up to the job and may
also be NULL if no variables are required.

```sql
CREATE OR REPLACE PROCEDURE custom_job(job_id int, config jsonb) LANGUAGE PLPGSQL AS
$$
BEGIN
	RAISE NOTICE 'Executing job % with config %', job_id, config;
END
$$;
```

Template for a custom job procedure.

## Registering your custom job


When registering the custom job job_id and config are stored in the
TimescaleDB catalog. The `config` JSONB can be modified with `alter_job`.
job_id and config will be passed as arguments when the procedure is
executed as background process or when run with `run_job`.

```sql
SELECT add_job('custom_job','1h');
```

Register the created job with the automation framework. `add_job` returns the job_id
which can be used to execute the job manually with `run_job`.

```sql
CALL run_job(1000);
```

Execute job with id 1000 in current session.

## Testing/Debugging jobs

Any background worker job can be run in foreground when executed with `run_job`. This can
be useful to debug problems when combined with increased log level.

## Altering / Dropping custom jobs

You can alter the config or scheduling parameters with `alter_job`.

```sql
SELECT alter_job(1000, config => '{"hypertable":"metrics"}');
```

Replaces the config for job with id 1000 with the specified JSON.

```sql
SELECT alter_job(1000, scheduled => false);
```

Disables automatic scheduling of the job with id 1000. The job can still be run manually
with `run_job`.

```sql
SELECT alter_job(1000, scheduled => true);
```

Reenables automatic scheduling of the job with id 1000.

```sql
SELECT delete_job(1000);
```

Deletes the job with id 1000 from the automation framework.

## Generic Retention Policy

```sql
CREATE OR REPLACE PROCEDURE generic_retention(job_id int, config jsonb) LANGUAGE PLPGSQL AS
$$
DECLARE
  ht REGCLASS;
  lag INTERVAL;
  chunk REGCLASS;
BEGIN
  SELECT jsonb_object_field_text(config, 'lag')::interval INTO STRICT lag;

  IF lag IS NULL THEN
	  RAISE EXCEPTION 'Config must have lag';
  END IF;

	PERFORM drop_chunks(format('%I.%I',table_schema,table_name), older_than => lag) FROM timescaledb_information.hypertables;

END
$$;
```
Retention policy for multiple hypertables. Additional filters can be applied by adding a WHERE clause to the query.

```sql
SELECT add_job('generic_retention','1d', config => '{"lag":"12 month"}');
```

Register job to run daily dropping chunks on all hypertables that are older than 12 months.

## Tiered storage

```sql
CREATE OR REPLACE PROCEDURE move_chunks(job_id int, config jsonb) LANGUAGE PLPGSQL AS
$$
DECLARE
  ht REGCLASS;
  lag INTERVAL;
  destination NAME;
  chunk REGCLASS;
  tmp_name NAME;
BEGIN
  SELECT jsonb_object_field_text(config, 'hypertable')::regclass INTO STRICT ht;
  SELECT jsonb_object_field_text(config, 'lag')::interval INTO STRICT lag;
  SELECT jsonb_object_field_text(config, 'tablespace') INTO STRICT destination;

  IF ht IS NULL OR lag IS NULL OR destination IS NULL THEN
	  RAISE EXCEPTION 'Config must have hypertable, lag and destination';
  END IF;

	FOR chunk IN
    SELECT show.oid
    FROM show_chunks(ht, older_than => lag) SHOW (oid)
      INNER JOIN pg_class pgc ON pgc.oid = show.oid
      INNER JOIN pg_tablespace pgts ON pgts.oid = pgc.reltablespace
    WHERE pgts.spcname != destination;
	LOOP

		RAISE NOTICE 'Moving chunk: %', chunk::text;

    EXECUTE format('ALTER TABLE %s SET TABLESPACE %I;', chunk, destination);

	END LOOP;
END
$$;
```

Custom job that moves chunks older than a certain time to a different tablespace.

```sql
SELECT add_job('move_chunks','1d', config => '{"hypertable":"metrics","lag":"12 month","tablespace":"old_chunks"}');
```

Register job to run daily moving chunks older than 12 months on hypertable metrics to tablespace old_chunks.

## Downsample and compress

```sql
CREATE OR REPLACE PROCEDURE downsample_compress(job_id int, config jsonb) LANGUAGE PLPGSQL AS
$$
DECLARE
  lag INTERVAL;
  chunk REGCLASS;
  tmp_name NAME;
BEGIN

  SELECT jsonb_object_field_text(config, 'lag')::interval INTO STRICT lag;

  IF lag IS NULL THEN
	  RAISE EXCEPTION 'Config must have lag';
  END IF;

	FOR chunk IN
    SELECT show.oid
    FROM show_chunks('metrics', older_than => lag) show(oid)
      INNER JOIN pg_class pgc ON pgc.oid = show.oid
      INNER JOIN pg_namespace pgns ON pgc.relnamespace = pgns.oid
      INNER JOIN timescaledb_information.chunks chunk ON chunk.chunk_name = pgc.relname
        AND chunk.chunk_schema = pgns.nspname
    WHERE chunk.is_compressed::bool = FALSE
	LOOP
		RAISE NOTICE 'Processing chunk: %', chunk::text;

    -- build name for temp table
    SELECT '_tmp' || relname FROM pg_class WHERE oid = chunk INTO STRICT tmp_name;

    -- copy downsampled chunk data into temp table
    EXECUTE format($sql$
      CREATE UNLOGGED TABLE %I AS SELECT time_bucket('1h',time), device_id, avg(value) FROM %s GROUP BY 1,2;
    $sql$, tmp_name, chunk);

    -- clear original chunk
    EXECUTE format('TRUNCATE %s;', chunk);
    -- copy downsampled data back into chunk
    EXECUTE format('INSERT INTO %s(time, device_id, value) SELECT * FROM %I;', chunk, tmp_name);
    -- drop temp table
    EXECUTE format('DROP TABLE %I;', tmp_name);

    PERFORM compress_chunk(chunk);
    COMMIT;

	END LOOP;

END
$$;
```

Custom job that downsamples and compresses chunks on hypertable metrics older than a certain age.

```sql
SELECT add_job('downsample_compress','1d', config => '{"lag":"12 month"}');
```

Register job to run daily downsampling and compressing chunks older than 12 months.

