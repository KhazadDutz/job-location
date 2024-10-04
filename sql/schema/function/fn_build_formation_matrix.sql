-- DROP FUNCTION if exists ${schema:raw}.fn_build_formation_matrix CASCADE; 

CREATE OR REPLACE FUNCTION ${schema:raw}.fn_build_formation_matrix(p_formation text, p_position_array int[])  
RETURNS text AS $$
  WITH pieces AS (
    SELECT
      formation_piece AS fp
      ,ROW_NUMBER () OVER(PARTITION BY NULL) AS rn
    FROM (
      SELECT
        unnest(string_to_array(concat('1', p_formation), NULL))::int AS formation_piece
    ) z
  )
  SELECT 
    concat('(',TRANSLATE(string_agg(array_places, ','), '{}', '()'),')') AS formation_matrix
  FROM (
    SELECT
      p.fp
      ,(CASE 
        WHEN p.rn = 1 THEN ((p_position_array)[:p.fp])
        ELSE (
          (p_position_array)[(SELECT sum(fp) FROM pieces WHERE rn <= p.rn -1) + 1:(SELECT sum(fp) FROM pieces WHERE rn <= p.rn -1) + p.fp]
        )
      END)::text AS array_places
    FROM pieces AS p
  ) e;
$$ LANGUAGE sql IMMUTABLE 
;