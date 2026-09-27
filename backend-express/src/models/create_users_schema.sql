CREATE TABLE IF NOT EXISTS "DMS".users
(
    user_id integer NOT NULL DEFAULT nextval('"DMS".users_user_id_seq'::regclass),
    username character varying(100) COLLATE pg_catalog."default" NOT NULL,
    email character varying(255) COLLATE pg_catalog."default",
    password_hash text COLLATE pg_catalog."default" NOT NULL,
    password_text text COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_role text COLLATE pg_catalog."default" DEFAULT 'admin'::text,
    password_changed_at timestamp with time zone,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_username_key UNIQUE (username)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS "DMS".users
    OWNER to postgres;