DROP VIEW if exists ${schema:raw}."vw_sf_CountryPopulation" CASCADE;

CREATE OR REPLACE VIEW ${schema:raw}."vw_sf_CountryPopulation" AS
  SELECT
    md5(x.*::text) AS hash_row
    ,x.*
  FROM (
    SELECT
      'Population__c' AS "sf_object_name"
      ,'ExternalId__c' AS "sf_external_id_field"
      ,id AS "sf_external_id_value"
      , f.*
      FROM (
        SELECT
          p.pop_year AS id,
          p.pop_year AS "ExternalId__c|Text",
          p.pop_population_stats AS "Population_Stats__c|Text",
          p.pop_nation_name AS "Nation__c|Text",
          p.pop_slug_nation AS "Slug_Nation__c|Text",
          p.pop_year AS "Year__c|Text"
        FROM ${schema:raw}.vw_ref_country_population_data AS p
      ) AS f
  ) AS x
;
-- fazer com que o pop_hash_id, pegue todas as colunas. Caso algum dado mude, ele muda o hash