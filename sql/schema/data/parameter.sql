-- samples
INSERT INTO ${schema:raw}."parameter" (id, "type", value, description) VALUES 
('PARAM_BOOL', 'b', 'true', 'sample boolean')
, ('PARAM_ARRAY', 'a', '[1,2,3,"a","b","c"]', 'sample array')
, ('PARAM_DATE', 'd', '2000-01-01T00:00:00.000Z', 'sample date string (JSON)')
, ('PARAM_OBJECT', 'o', '{"array":[1,2,3],"boolean":true,"null":null,"number":123,"object":{"a":"b","c":"d","e":"f"},"string":"Hello World"}', 'sample object or JSON')
, ('PARAM_STRING', 's', 'value', 'sample string')
, ('PARAM_NUMBER', 'n', '1', 'sample number')
ON CONFLICT ON CONSTRAINT parameter_pkey
DO NOTHING;
