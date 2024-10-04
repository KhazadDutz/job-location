-- https://github.com/m-martinez/pg-audit-json

DROP FUNCTION IF EXISTS jsonb_minus(JSONB, TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS jsonb_minus(JSONB, JSONB) CASCADE;
--DROP SCHEMA IF EXISTS ${schema:raw} CASCADE;


--
-- An ${schema:raw} history is important on most tables. Provide an ${schema:raw} trigger that
-- logs to a dedicated ${schema:raw} table for the major relations.
--

-- Complain if script is sourced in psql, rather than via CREATE EXTENSION
--\echo Use "CREATE EXTENSION pg-${schema:raw}-json" to load this file. \quit

--
-- Implements missing "-" JSONB operators that are available in HSTORE
--

--
-- Implements "JSONB- TEXT[]" operation to remove a list of keys
--
-- Note: This method will be a supported operation of PostgreSQL 10
--
-- Credit:
-- http://schinckel.net/2014/09/29/adding-json%28b%29-operators-to-postgresql/
--
CREATE OR REPLACE FUNCTION "jsonb_minus" ( "left" JSONB, "keys" TEXT[] )
  RETURNS JSONB
  LANGUAGE SQL
  IMMUTABLE
  STRICT
AS $$
  SELECT
    CASE
      WHEN "left" ?| "keys"
        THEN COALESCE(
          (SELECT ('{' ||
                    string_agg(to_json("key")::TEXT || ':' || "value", ',') ||
                    '}')
             FROM jsonb_each("left")
            WHERE "key" <> ALL ("keys")),
          '{}'
        )::JSONB
      ELSE "left"
    END
$$;

CREATE OPERATOR - (
  LEFTARG = JSONB,
  RIGHTARG = TEXT[],
  PROCEDURE = jsonb_minus
);

COMMENT ON FUNCTION jsonb_minus(JSONB, TEXT[]) IS 'Delete specificed keys';

--COMMENT ON OPERATOR - (JSONB, TEXT[]) IS 'Delete specified keys';

--
-- Implements "JSONB- JSONB" operation to recursively delete matching pairs.
--
-- Credit:
-- http://coussej.github.io/2016/05/24/A-Minus-Operator-For-PostgreSQLs-JSONB/
--

CREATE OR REPLACE FUNCTION "jsonb_minus" ( "left" JSONB, "right" JSONB )
  RETURNS JSONB
  LANGUAGE SQL
  IMMUTABLE
  STRICT
AS $$
  SELECT
    COALESCE(json_object_agg(
      "key",
      CASE
        -- if the value is an object and the value of the second argument is
        -- not null, we do a recursion
        WHEN jsonb_typeof("value") = 'object' AND "right" -> "key" IS NOT NULL
        THEN jsonb_minus("value", "right" -> "key")
        -- for all the other types, we just return the value
        ELSE "value"
      END
    ), '{}')::JSONB
  FROM
    jsonb_each("left")
  WHERE
    "left" -> "key" <> "right" -> "key"
    OR "right" -> "key" IS NULL
$$;

CREATE OPERATOR - (
  LEFTARG   = JSONB,
  RIGHTARG  = JSONB,
  PROCEDURE = jsonb_minus
);

COMMENT ON FUNCTION jsonb_minus(JSONB, JSONB)
  IS 'Delete matching pairs in the right argument from the left argument';

--COMMENT ON OPERATOR - (JSONB, JSONB)
  --IS 'Delete matching pairs in the right argument from the left argument';


-- CREATE SCHEMA IF NOT EXISTS ${schema:raw} ;
-- REVOKE ALL ON SCHEMA ${schema:raw} FROM public;
-- COMMENT ON SCHEMA ${schema:raw}
--   IS 'Out-of-table ${schema:raw}/history logging tables and trigger functions';

--
-- ${schema:raw}ed data. Lots of information is available, it's just a matter of how
-- much you really want to record. See:
--
--   http://www.postgresql.org/docs/9.1/static/functions-info.html
--
-- Remember, every column you add takes up more ${schema:raw} table space and slows
-- ${schema:raw} inserts.
--
-- Every index you add has a big impact too, so avoid adding indexes to the
-- ${schema:raw} table unless you REALLY need them. The hstore GIST indexes are
-- particularly expensive.
--
-- It is sometimes worth copying the ${schema:raw} table, or a coarse subset of it that
-- you're interested in, into a temporary table where you CREATE any useful
-- indexes and do your analysis.
--
CREATE TABLE IF NOT EXISTS ${schema:raw}.log (
    id BIGSERIAL PRIMARY KEY,
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    pk text NOT NULL,
    relid OID NOT NULL,
    session_user_name TEXT NOT NULL,
    current_user_name TEXT NOT NULL,
    action_tstamp_tx TIMESTAMP WITH TIME ZONE NOT NULL,
    action_tstamp_stm TIMESTAMP WITH TIME ZONE NOT NULL,
    action_tstamp_clk TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_id BIGINT NOT NULL,
    application_name TEXT,
    application_user_name TEXT,
    client_addr INET,
    client_port INTEGER,
    client_query TEXT,
    action TEXT NOT NULL CHECK (action IN ('I','D','U', 'T')),
    row_data JSONB,
    changed_fields JSONB,
    statement_only BOOLEAN NOT NULL
);

REVOKE ALL ON ${schema:raw}.log FROM public;

COMMENT ON TABLE ${schema:raw}.log
  IS 'History of ${schema:raw}able actions on ${schema:raw}ed tables';
COMMENT ON COLUMN ${schema:raw}.log.id
  IS 'Unique identifier for each ${schema:raw}able event';
COMMENT ON COLUMN ${schema:raw}.log.schema_name
  IS 'Database schema ${schema:raw}ed table for this event is in';
COMMENT ON COLUMN ${schema:raw}.log.table_name
  IS 'Non-schema-qualified table name of table event occured in';
COMMENT ON COLUMN ${schema:raw}.log.relid
  IS 'Table OID. Changes with drop/create. Get with ''tablename''::REGCLASS';
COMMENT ON COLUMN ${schema:raw}.log.session_user_name
  IS 'Login / session user whose statement caused the ${schema:raw}ed event';
COMMENT ON COLUMN ${schema:raw}.log.current_user_name
  IS 'Effective user that cased ${schema:raw}ed event (if authorization level changed)';
COMMENT ON COLUMN ${schema:raw}.log.action_tstamp_tx
  IS 'Transaction start timestamp for tx in which ${schema:raw}ed event occurred';
COMMENT ON COLUMN ${schema:raw}.log.action_tstamp_stm
  IS 'Statement start timestamp for tx in which ${schema:raw}ed event occurred';
COMMENT ON COLUMN ${schema:raw}.log.action_tstamp_clk
  IS 'Wall clock time at which ${schema:raw}ed event''s trigger call occurred';
COMMENT ON COLUMN ${schema:raw}.log.transaction_id
  IS 'Identifier of transaction that made the change. Unique when paired with action_tstamp_tx.';
COMMENT ON COLUMN ${schema:raw}.log.client_addr
  IS 'IP address of client that issued query. Null for unix domain socket.';
COMMENT ON COLUMN ${schema:raw}.log.client_port
  IS 'Port address of client that issued query. Undefined for unix socket.';
COMMENT ON COLUMN ${schema:raw}.log.client_query
  IS 'Top-level query that caused this ${schema:raw}able event. May be more than one.';
COMMENT ON COLUMN ${schema:raw}.log.application_name
  IS 'Client-set session application name when this ${schema:raw} event occurred.';
COMMENT ON COLUMN ${schema:raw}.log.application_user_name
  IS 'Client-set session application user when this ${schema:raw} event occurred.';
COMMENT ON COLUMN ${schema:raw}.log.action
  IS 'Action type; I = insert, D = delete, U = update, T = truncate';
COMMENT ON COLUMN ${schema:raw}.log.row_data
  IS 'Record value. Null for statement-level trigger. For INSERT this is null. For DELETE and UPDATE it is the old tuple.';
COMMENT ON COLUMN ${schema:raw}.log.changed_fields
  IS 'New values of fields for INSERT or changed by UPDATE. Null for DELETE';
COMMENT ON COLUMN ${schema:raw}.log.statement_only
  IS '''t'' if ${schema:raw} event is from an FOR EACH STATEMENT trigger, ''f'' for FOR EACH ROW';

CREATE INDEX IF NOT EXISTS log_relid_idx ON ${schema:raw}.log(relid);
CREATE INDEX IF NOT EXISTS log_action_tstamp_tx_stm_idx ON ${schema:raw}.log(action_tstamp_stm);
CREATE INDEX IF NOT EXISTS log_action_idx ON ${schema:raw}.log(action);
CREATE INDEX IF NOT EXISTS log_pk_idx ON ${schema:raw}.log(pk);

--
-- Allow the user of the extension to create a backup of the ${schema:raw} log data
--
--SELECT pg_catalog.pg_extension_config_dump('${schema:raw}.log', '');
--SELECT pg_catalog.pg_extension_config_dump('${schema:raw}.log_id_seq', '');

CREATE OR REPLACE FUNCTION ${schema:raw}.if_modified_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    ${schema:raw}_row ${schema:raw}.log;
    include_values BOOLEAN;
    log_diffs BOOLEAN;
    h_old JSONB;
    h_new JSONB;
    excluded_cols TEXT[] = ARRAY[]::TEXT[];
BEGIN
  IF TG_WHEN <> 'AFTER' THEN
    RAISE EXCEPTION '${schema:raw}.if_modified_func() may only run as an AFTER trigger';
  END IF;

  ${schema:raw}_row = ROW(
    nextval('${schema:raw}.'|| TG_TABLE_NAME || '_log_id_seq'), -- id
    TG_TABLE_SCHEMA::TEXT,                          -- schema_name
    TG_TABLE_NAME::TEXT,                            -- table_name
    '', --PK
    TG_RELID,                                       -- relation OID for faster searches
    session_user::TEXT,                             -- session_user_name
    current_user::TEXT,                             -- current_user_name
    current_timestamp,                              -- action_tstamp_tx
    statement_timestamp(),                          -- action_tstamp_stm
    clock_timestamp(),                              -- action_tstamp_clk
    txid_current(),                                 -- transaction ID
    current_setting('${schema:raw}.application_name', true),      -- client application
    current_setting('${schema:raw}.application_user_name', true), -- client user name
    inet_client_addr(),                             -- client_addr
    inet_client_port(),                             -- client_port
    current_query(),                                -- top-level query or queries
    substring(TG_OP, 1, 1),                         -- action
    NULL,                                           -- row_data
    NULL,                                           -- changed_fields
    'f'                                             -- statement_only
    );

  IF NOT TG_ARGV[0]::BOOLEAN IS DISTINCT FROM 'f'::BOOLEAN THEN
    ${schema:raw}_row.client_query = NULL;
  END IF;

  IF TG_ARGV[1] IS NOT NULL THEN
    excluded_cols = TG_ARGV[1]::TEXT[];
  END IF;

  IF (TG_OP = 'INSERT' AND TG_LEVEL = 'ROW') THEN
    ${schema:raw}_row.changed_fields = to_jsonb(NEW.*) - excluded_cols;
    ${schema:raw}_row.pk = (${schema:raw}_row.changed_fields ->> 'id');
  ELSIF (TG_OP = 'UPDATE' AND TG_LEVEL = 'ROW') THEN
    ${schema:raw}_row.row_data = to_jsonb(OLD.*) - excluded_cols;
    ${schema:raw}_row.changed_fields =
      (to_jsonb(NEW.*) - ${schema:raw}_row.row_data) - excluded_cols;
    IF ${schema:raw}_row.changed_fields = '{}'::JSONB THEN
      -- All changed fields are ignored. Skip this update.
      RETURN NULL;
    END IF;
     ${schema:raw}_row.pk = (${schema:raw}_row.row_data ->> 'id');
  ELSIF (TG_OP = 'DELETE' AND TG_LEVEL = 'ROW') THEN
    ${schema:raw}_row.row_data = to_jsonb(OLD.*) - excluded_cols;
    ${schema:raw}_row.pk = (${schema:raw}_row.row_data ->> 'id');
  ELSIF (TG_LEVEL = 'STATEMENT' AND TG_OP IN ('INSERT','UPDATE','DELETE','TRUNCATE')) THEN
    ${schema:raw}_row.statement_only = 't';
  ELSE
    RAISE EXCEPTION '[${schema:raw}.if_modified_func] - Trigger func added as trigger for unhandled case: %, %', TG_OP, TG_LEVEL;
    RETURN NULL;
  END IF;
  
  --INSERT INTO ${schema:raw}.log VALUES (${schema:raw}_row.*);
  EXECUTE format('INSERT INTO %s.%s_log VALUES ($1.*);', ${schema:raw}_row.schema_name, ${schema:raw}_row.table_name, ${schema:raw}_row) USING ${schema:raw}_row;

  RETURN NULL;
END;
$$;


COMMENT ON FUNCTION ${schema:raw}.if_modified_func() IS $$
Track changes to a table at the statement and/or row level.

Optional parameters to trigger in CREATE TRIGGER call:

param 0: BOOLEAN, whether to log the query text. Default 't'.

param 1: TEXT[], columns to ignore in updates. Default [].

         Updates to ignored cols are omitted from changed_fields.

         Updates with only ignored cols changed are not inserted
         into the ${schema:raw} log.

         Almost all the processing work is still done for updates
         that ignored. If you need to save the load, you need to use
         WHEN clause on the trigger instead.

         No warning or error is issued if ignored_cols contains columns
         that do not exist in the target table. This lets you specify
         a standard set of ignored columns.

There is no parameter to disable logging of values. Add this trigger as
a 'FOR EACH STATEMENT' rather than 'FOR EACH ROW' trigger if you do not
want to log row values.

Note that the user name logged is the login role for the session. The ${schema:raw}
trigger cannot obtain the active role because it is reset by
the SECURITY DEFINER invocation of the ${schema:raw} trigger its self.
$$;

---
--- Enables tracking on a table by generating and attaching a trigger
---
CREATE OR REPLACE FUNCTION ${schema:raw}.fn_create_log_table(
  target_table REGCLASS,
  ${schema:raw}_rows BOOLEAN DEFAULT true,
  ${schema:raw}_query_text BOOLEAN DEFAULT true,
  ignored_cols TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS VOID
LANGUAGE 'plpgsql'
AS $$
DECLARE
  stm_targets TEXT = 'INSERT OR UPDATE OR DELETE OR TRUNCATE';
  _q_txt TEXT;
  _ignored_cols_snip TEXT = '';
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS ${schema:raw}_trigger_row ON ' || target_table::TEXT;
  EXECUTE 'DROP TRIGGER IF EXISTS ${schema:raw}_trigger_stm ON ' || target_table::TEXT;

  EXECUTE format('CREATE TABLE IF NOT EXISTS %s_log (LIKE ${schema:raw}.log INCLUDING ALL)', target_table::TEXT);
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s_log_id_seq AS BIGINT', target_table::TEXT);

  IF ${schema:raw}_rows THEN
    IF array_length(ignored_cols,1) > 0 THEN
        _ignored_cols_snip = ', ' || quote_literal(ignored_cols);
    END IF;
    _q_txt = 'CREATE TRIGGER ${schema:raw}_trigger_row ' ||
             'AFTER INSERT OR UPDATE OR DELETE ON ' ||
             target_table::TEXT ||
             ' FOR EACH ROW EXECUTE PROCEDURE ${schema:raw}.if_modified_func(' ||
             quote_literal(${schema:raw}_query_text) ||
             _ignored_cols_snip ||
             ');';
    RAISE NOTICE '%', _q_txt;
    EXECUTE _q_txt;
    stm_targets = 'TRUNCATE';
  END IF;

  _q_txt = 'CREATE TRIGGER ${schema:raw}_trigger_stm AFTER ' || stm_targets || ' ON ' ||
           target_table ||
           ' FOR EACH STATEMENT EXECUTE PROCEDURE ${schema:raw}.if_modified_func('||
           quote_literal(${schema:raw}_query_text) || ');';
  RAISE NOTICE '%', _q_txt;
  EXECUTE _q_txt;
END;
$$;

COMMENT ON FUNCTION ${schema:raw}.fn_create_log_table(REGCLASS, BOOLEAN, BOOLEAN, TEXT[]) IS $$
Add ${schema:raw}ing support to a table.

Arguments:
   target_table:     Table name, schema qualified if not on search_path
   ${schema:raw}_rows:       Record each row change, or only ${schema:raw} at a statement level
   ${schema:raw}_query_text: Record the text of the client query that triggered
                     the ${schema:raw} event?
   ignored_cols:     Columns to exclude from update diffs,
                     ignore updates that change only ignored cols.
$$;

-- --
-- -- Pg doesn't allow variadic calls with 0 params, so provide a wrapper
-- --
-- CREATE OR REPLACE FUNCTION ${schema:raw}.create_log_table(
--   target_table REGCLASS,
--   ${schema:raw}_rows BOOLEAN,
--   ${schema:raw}_query_text BOOLEAN
-- )
-- RETURNS VOID
-- LANGUAGE SQL
-- AS $$
--   SELECT ${schema:raw}.create_log_table($1, $2, $3, ARRAY[]::TEXT[]);
-- $$;

-- --
-- -- And provide a convenience call wrapper for the simplest case
-- -- of row-level logging with no excluded cols and query logging enabled.
-- --
-- CREATE OR REPLACE FUNCTION ${schema:raw}.create_log_table(target_table REGCLASS)
-- RETURNS VOID
-- LANGUAGE 'sql'
-- AS $$
--   SELECT ${schema:raw}.create_log_table($1, BOOLEAN 't', BOOLEAN 't');
-- $$;

-- COMMENT ON FUNCTION ${schema:raw}.create_log_table(REGCLASS) IS $$
-- Add ${schema:raw}ing support to the given table. Row-level changes will be logged with
-- full client query text. No cols are ignored.
-- $$;

-------------------------------------------------------
--ALTER TABLE ${schema:raw}.log ADD COLUMN IF NOT EXISTS doc_id text GENERATED ALWAYS AS (TRIM(COALESCE(row_data, changed_fields) ->> 'id')::text) STORED;
--ALTER TABLE ${schema:raw}.log ADD COLUMN IF NOT EXISTS doc_name text GENERATED ALWAYS AS ((COALESCE(row_data, changed_fields) ->> 'doc_name')::text) STORED;