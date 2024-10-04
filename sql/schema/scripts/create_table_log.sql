DO $$
BEGIN
    -- cria a tabela
    CREATE TABLE IF NOT EXISTS ${schema:value}.${table:value} AS (
        SELECT 
            *,
            null::timestamptz as created_at,
		    null::timestamptz as updated_at,
		    null::timestamptz as deleted_at 
        FROM ${schema:value}.${view:value}
    ) WITH NO DATA;

    -- adiciona pk
    IF NOT EXISTS (
        SELECT FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = '${schema:value}' 
        AND TABLE_NAME = '${table:value}' 
        AND CONSTRAINT_TYPE = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE ${schema:value}.${table:value} ADD PRIMARY KEY (id);
    END IF;

    -- cria a tabela de log
    PERFORM ${schema:value}.fn_create_log_table('${schema:value}.${table:value}');

    -- cria os indices basicos
    CREATE INDEX IF NOT EXISTS ${table:value}is_deleted_idx ON ${schema:value}.${table:value}(id) where is_deleted = false;
END;
$$;