-- DROP FUNCTION if exists ${schema:raw}.get_statistic CASCADE;

CREATE OR REPLACE FUNCTION ${schema:raw}.get_statistic(p_statistics jsonb)
RETURNS jsonb AS $$
	SELECT
		jsonb_object_agg(d."data" ->> 'type', d."data" ->> 'value') AS j
	FROM (
		SELECT jsonb_array_elements(p_statistics) AS "data", '1' AS gp
	) AS d
	GROUP BY gp
	;
$$ LANGUAGE sql IMMUTABLE 
;
