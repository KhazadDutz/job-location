drop procedure if exists "${schema:raw}".sp_purge_data_log;
drop procedure if exists "${schema:raw}".sp_purge_data_log();
drop procedure if exists "${schema:raw}".sp_purge_data_log(int);
drop procedure if exists "${schema:raw}".sp_purge_data_log(text);

create or replace procedure "${schema:raw}".sp_purge_data_log(
	p_interval_days text DEFAULT null
) as $$
declare
	_r record;
	_schema_name name := '${schema:raw}';
	_rows int := 0;

	_param_interval_days text := ${schema:raw}.fn_get_parameter('PURGE_LOG_INTERVAL_DAYS', '30');
	_interval_days text := COALESCE(p_interval_days, _param_interval_days);
begin
	raise notice 'param ...' using hint = 'cgny';
	raise notice 'PURGE_LOG_INTERVAL_DAYS => %', _param_interval_days using hint = 'cgny';	
	raise notice '_interval_days => % days', _interval_days using hint = 'cgny';

	for _r in 
		SELECT
			t.tablename as table_name
		FROM 
			pg_catalog.pg_tables t
		WHERE 
			t.schemaname != 'pg_catalog'
			AND t.schemaname != 'information_schema'
			and t.schemaname = _schema_name
			and t.tablename like '%_log'
		order by
			1
	loop
		raise notice 'purging % => % days', _r.table_name, _interval_days using hint = 'cgny';

		execute format(
			'DELETE FROM %s.%s WHERE action_tstamp_tx < current_timestamp + interval ''-%s day'';', 
			quote_ident(_schema_name), 
			quote_ident(_r.table_name),
			_interval_days
		);

		get diagnostics _rows = row_count;
		raise notice 'purging % done! => % rows', _r.table_name, _rows using hint = 'cgny';
	end loop;
	return;
end
$$ language plpgsql;

--call "${schema:raw}".sp_purge_data_log();