--DROP TABLE IF EXISTS public.parameter CASCADE;

CREATE TABLE IF NOT EXISTS ${schema:raw}.parameter (
	id text NOT NULL,
	record_type_id int4 NOT NULL DEFAULT 1,
	"is_active" bool NOT NULL DEFAULT true,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "is_deleted" bool NOT NULL DEFAULT false,
    "deleted_at" timestamptz,
 	"type" text NOT NULL CHECK ("type" IN ('a', 'b', 'd', 'n', 'o', 's')) DEFAULT 's',
	"value" text NOT NULL DEFAULT '',
	"description" text NULL,
	PRIMARY KEY(id)
)
WITH (
	OIDS=FALSE
);

