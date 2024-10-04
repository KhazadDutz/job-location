DROP INDEX IF EXISTS ${schema:raw}.idx_api_data_01;
--CREATE INDEX IF NOT EXISTS idx_api_data_01 ON ${schema:raw}.api_data(doc_name, is_active, is_deleted);


DROP INDEX IF EXISTS ${schema:raw}.idx_api_data_03;
--CREATE INDEX IF NOT EXISTS idx_api_data_03 ON ${schema:raw}.api_data(doc_name, doc_id, is_active, is_deleted);


DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_sf_league__01;
-- DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_ref_team__01;
CREATE INDEX IF NOT EXISTS idx_api_data__vw_ref_team__01 ON ${schema:raw}.api_data(
	doc_id
)
WHERE
	doc_name = 'TeamTM1'
	and is_active = true
	and is_deleted = false
	--and (doc_record ->> 'teamType')
;


-- DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_ref_game__01;
CREATE INDEX IF NOT EXISTS idx_api_data__vw_ref_game__01 ON ${schema:raw}.api_data(
	doc_id, 
	(doc_record ->> 'id')
)
WHERE
	doc_name = 'MatchStatsMA2'
	and is_active = true
	and is_deleted = false	
;


DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_sf_league__01;
-- DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_ref_league__01;
CREATE INDEX IF NOT EXISTS idx_api_data__vw_ref_league__01 ON ${schema:raw}.api_data(
	doc_id,
	(doc_record -> 'tournamentCalendar' ->> 'active'),
	(doc_record ->> 'type')
)
WHERE
	doc_name = 'TournamentCalendarsOT2'
	and is_active = true
	and is_deleted = false	
	--and (doc_record -> 'tournamentCalendar' ->> 'active') = 'yes'
;


DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_ref_player_league__01;
CREATE INDEX IF NOT EXISTS idx_api_data__vw_ref_player_league__01 ON ${schema:raw}.api_data(
	doc_id
)
WHERE
	doc_name = 'PlayerCareerPE2'
	and is_active = true
	and is_deleted = false	
	--and (doc_record ->> 'type') = 'player'
;


DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_sf_standing__01;
-- DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_ref_standing__01;
CREATE INDEX IF NOT EXISTS idx_api_data__vw_ref_standing__01 ON ${schema:raw}.api_data(
	doc_id
)
WHERE
	doc_name = 'TeamStandingsTM2'
	and is_active = true
	and is_deleted = false	
	and (doc_record -> 'stage' -> 'division' -> 'ranking' ->> 'type') = 'total'
;


DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_sf_game_lineup__01;
-- DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_ref_game_lineup__01;
CREATE INDEX IF NOT EXISTS idx_api_data__vw_ref_game_lineup__01 ON ${schema:raw}.api_data(
	doc_id,
	(doc_record -> 'tournamentCalendar' ->> 'name'),
	(doc_record -> 'matchInfo' -> 'match' ->> 'id')
)
WHERE
	doc_name = 'MatchStatsMA2'
	and is_active = true
	and is_deleted = false	
;


DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_sf_game_lineup__02;
-- DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_ref_game_lineup__02;
CREATE INDEX IF NOT EXISTS idx_api_data__vw_ref_game_lineup__02 ON ${schema:raw}.api_data(
	doc_id, 
	(doc_record -> 'matchInfo' -> 'tournamentCalendar' ->> 'name'),
	(doc_record ->> 'id')
)
WHERE
	doc_name = 'MatchStatsMA2'
	and is_active = true
	and is_deleted = false	
;


DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_ref_game_lineup_formation__01;
-- CREATE INDEX IF NOT EXISTS idx_api_data__vw_ref_game_lineup_formation__01 ON ${schema:raw}.api_data(
-- 	doc_id, 
-- 	(doc_record ->> 'code')
-- )
-- WHERE
-- 	doc_name = 'TeamTM1'
-- 	and is_active = true
-- 	and is_deleted = false	
-- ;


DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_sf_game_commentary__01;
CREATE INDEX IF NOT EXISTS idx_api_data__vw_sf_game_commentary__01 ON ${schema:raw}.api_data(
	doc_name, doc_id, is_active, is_deleted, 
	(doc_record -> 'matchInfo' -> 'tournamentCalendar' ->> 'name'),
	(doc_record ->> 'id')
);


DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_sf_event__01;
CREATE INDEX IF NOT EXISTS idx_api_data__vw_sf_event__01 ON ${schema:raw}.api_data(
	doc_id,
	(doc_record -> 'match' ->> 'homeContestantId'),
	(doc_record -> 'match' ->> 'homeContestantCode')
)
WHERE
	doc_name = 'TournamentScheduleMA0'
	and is_active = true
	and is_deleted = false	
;


DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_sf_event__02;
CREATE INDEX IF NOT EXISTS idx_api_data__vw_sf_event__02 ON ${schema:raw}.api_data(
	doc_id, 
	(doc_record -> 'match' ->> 'awayContestantId'),
	(doc_record -> 'match' ->> 'awayContestantCode')
)
WHERE
	doc_name = 'TournamentScheduleMA0'
	and is_active = true
	and is_deleted = false	
;


DROP INDEX IF EXISTS ${schema:raw}.idx_api_data__vw_sf_event__03;
CREATE INDEX IF NOT EXISTS idx_api_data__vw_sf_event__03 ON ${schema:raw}.api_data(
	doc_id, 
	(doc_record -> 'tournamentCalendar' ->> 'name'),
	(doc_record -> 'match' ->> 'id')
)
WHERE
	doc_name = 'TournamentScheduleMA0'
	and is_active = true
	and is_deleted = false	
;