CREATE TABLE IF NOT EXISTS ${schema:raw}.api_data (
	--id bigserial NOT NULL,
	id char(255) NOT NULL,
	record_type_id int4 NOT NULL DEFAULT 1,
	"is_active" bool NOT NULL DEFAULT true,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "is_deleted" bool NOT NULL DEFAULT false,
    "deleted_at" timestamptz NULL,

	--execution_id int8 NOT NULL, --REFERENCES itgr.execution(id) ON DELETE CASCADE,
	--status_id int4 NOT NULL, --REFERENCES itgr.status(id) ON DELETE CASCADE,
	
	api_name text NULL,
	doc_id text NULL,
	doc_name text NULL,
	doc_record jsonb NOT NULL DEFAULT '[]'::json,
	doc_meta_data jsonb NULL,
	PRIMARY KEY (id)
)
WITH (
	OIDS=FALSE
);