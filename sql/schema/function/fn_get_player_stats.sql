-- DROP FUNCTION IF EXISTS ${schema:raw}.fn_get_player_stats CASCADE;

CREATE OR REPLACE FUNCTION ${schema:raw}.fn_get_player_stats(p_stats jsonb)
RETURNS jsonb
AS $$
	select jsonb_object_agg(ps."type", ps."value")
	from (
		SELECT * from jsonb_to_recordset(p_stats) as p ("type" text, "value" int)
	) as ps;
$$
LANGUAGE 'sql' IMMUTABLE;
