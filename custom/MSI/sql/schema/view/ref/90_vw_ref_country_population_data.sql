DROP VIEW IF EXISTS ${schema:raw}.vw_ref_country_population_data CASCADE;

CREATE OR REPLACE VIEW ${schema:raw}.vw_ref_country_population_data AS
  SELECT
    MD5(x.*::text) AS pop_hash_row
    , x.*
  FROM (
    SELECT
      pop_data ->> 'Year' AS pop_year,
      pop_data ->> 'Population' AS pop_population_stats,
      pop_data ->> 'Nation' AS pop_nation_name,
      pop_data ->> 'Slug Nation' AS pop_slug_nation
    FROM (
      SELECT jsonb_array_elements(a.doc_record -> 'data') AS pop_data
      FROM msi_population_dev.api_data AS a
      WHERE a.doc_id = 'acs_yg_total_population_5'
    );
  ) AS x
;
