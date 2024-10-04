-- DROP FUNCTION if exists ${schema:raw}.fn_remove_accentuation CASCADE; 

CREATE OR REPLACE FUNCTION ${schema:raw}.fn_remove_accentuation(p_text text)  
RETURNS text AS
$$  
SELECT translate(
  p_text
  ,'áàâãäåaaaÁÂÃÄÅAAAÀéèêëeeeeeEEEÉEEÈìíîïìiiiÌÍÎÏÌIIIóôõöoooòÒÓÔÕÖOOOùúûüuuuuÙÚÛÜUUUUçÇñÑýÝ'
  ,'aaaaaaaaaAAAAAAAAAeeeeeeeeeEEEEEEEiiiiiiiiIIIIIIIIooooooooOOOOOOOOuuuuuuuuUUUUUUUUcCnNyY'   
);  
$$ LANGUAGE sql IMMUTABLE  
;  