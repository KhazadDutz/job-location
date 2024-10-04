-- DROP FUNCTION if exists ${schema:raw}.get_commentary_period CASCADE;

/*
• 1 (First half)
• 2 (Second half)
• 3 (Extra time - first half)
• 4 (Extra time - second half)
• 5 (Penalty shootout)
• 10 (Half time)
• 11 (End of second half - before extra time)
• 12 (Extra time - half time)
• 13 (End of extra time - before penalties)
• 14 (Full time)
• 16 (Pre-match)
*/

CREATE OR REPLACE FUNCTION ${schema:raw}.get_commentary_period(p_id int)  
RETURNS text AS $$
	SELECT CASE p_id
		WHEN 2 THEN 'SecondHalf'
		WHEN 4 THEN 'SecondHalf'
		WHEN 5 THEN 'SecondHalf'
		-- WHEN 5 THEN 'Penalty'
		WHEN 11 THEN 'SecondHalf'
		WHEN 12 THEN 'SecondHalf'
		WHEN 13 THEN 'SecondHalf'
		WHEN 14 THEN 'SecondHalf'
		ELSE 'FirstHalf'
	END
	;
$$ LANGUAGE sql IMMUTABLE 
;