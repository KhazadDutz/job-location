DROP VIEW if exists ${schema:raw}."vw_sf_CountryPopulation__newed" CASCADE;

CREATE OR REPLACE VIEW ${schema:raw}."vw_sf_CountryPopulation__newed" AS
	select 
		t.* 
	from 
		${schema:raw}."vw_sf_CountryPopulation" t
	where
		-- nao foi enviado pata sales ainda tabela "sf_data"
		not exists ( 
			select from ${schema:raw}.sf_data 
			where sf_object_name = t.sf_object_name 
				and sf_external_id_value = t.id 
				and is_active = true 
				and is_deleted = false
		)
		
		-- nao foi esta parado na fila de processamento tabela "job"
		and not exists (
			select from ${schema:raw}.job 
			where "name" = 'qu_save_sf' 
				and "state" in ('created', 'expired') 
				and ("data" -> 'value' ->> 'ExternalId__c') = t.id
		)	
;