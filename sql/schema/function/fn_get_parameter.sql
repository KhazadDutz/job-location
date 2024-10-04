-- drop function if exists ${schema:raw}.fn_get_parameter CASCADE;

CREATE OR REPLACE FUNCTION ${schema:raw}.fn_get_parameter(p_name text, p_default_value text DEFAULT NULL)
 RETURNS text
 LANGUAGE plpgsql
 --IMMUTABLE STRICT
AS $function$
DECLARE 
	current_value TEXT := (
		SELECT "value" FROM ${schema:raw}.parameter
		WHERE id = p_name AND is_active = TRUE AND is_deleted = FALSE AND record_type_id = 1
		LIMIT 1
	);
BEGIN
	--raise notice 'p_name: %', p_name;
	--raise notice 'p_default_value: %', p_default_value;

	IF current_value IS NULL THEN 
		RETURN p_default_value;
	END IF;

	RETURN current_value;
END
$function$
;

/* testes
select public.fn_get_parameter('sss','dsdf');
select public.fn_get_parameter('PARAM_BOOL','false')::bool;

select public.fn_get_parameter('PARAM_OBJECT')::jsonb;
select public.fn_get_parameter('PARAM_OBJECT_')::jsonb;
select public.fn_get_parameter('PARAM_OBJECT', '{}')::jsonb;
select public.fn_get_parameter('PARAM_OBJECT_', '{}')::jsonb;

select public.fn_get_parameter('PARAM_DATE')::timestamptz;
select public.fn_get_parameter('PARAM_DATE_')::timestamptz;
*/
