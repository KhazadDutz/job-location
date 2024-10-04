-- DROP FUNCTION IF EXISTS ${schema:raw}.fn_iif CASCADE;

CREATE OR REPLACE FUNCTION ${schema:raw}.fn_iif(
    condition boolean,       -- IF condition
    true_result anyelement,  -- THEN
    false_result anyelement  -- ELSE
) RETURNS anyelement AS $f$
  SELECT CASE WHEN condition THEN true_result ELSE false_result END
$f$  LANGUAGE SQL IMMUTABLE;


/* testes
SELECT ${schema:raw}fn_iif(0=1,1,2);
SELECT ${schema:raw}fn_iif(0=0,'Hello'::text,'Bye');
*/
