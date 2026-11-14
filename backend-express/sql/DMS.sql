--
-- PostgreSQL database dump
--

\restrict Yb7rbJEjFY5xVvw6B1Hdxvegv6DKbr53wg5cmJBJnvxWXjCHt8seXd6M38pZWgR

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-11-14 16:47:47

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 87422)
-- Name: DMS; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA "DMS";


ALTER SCHEMA "DMS" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 87443)
-- Name: meals; Type: TABLE; Schema: DMS; Owner: postgres
--

CREATE TABLE "DMS".meals (
    meal_id bigint NOT NULL,
    user_id integer NOT NULL,
    meal_type_other character varying(50),
    total_calories numeric(8,2) DEFAULT 0 NOT NULL,
    total_protein_gm numeric(8,2) DEFAULT 0 NOT NULL,
    total_carbs_gm numeric(8,2) DEFAULT 0 NOT NULL,
    total_fat_gm numeric(8,2) DEFAULT 0 NOT NULL,
    total_fiber_gm numeric(8,2) DEFAULT 0 NOT NULL,
    eaten_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    raw_json_api jsonb,
    meal_name text,
    meal_type text NOT NULL,
    CONSTRAINT meals_total_calories_check CHECK ((total_calories >= (0)::numeric)),
    CONSTRAINT meals_total_carbs_gm_check CHECK ((total_carbs_gm >= (0)::numeric)),
    CONSTRAINT meals_total_fat_gm_check CHECK ((total_fat_gm >= (0)::numeric)),
    CONSTRAINT meals_total_fiber_gm_check CHECK ((total_fiber_gm >= (0)::numeric)),
    CONSTRAINT meals_total_protein_gm_check CHECK ((total_protein_gm >= (0)::numeric))
);


ALTER TABLE "DMS".meals OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 87523)
-- Name: daily_nutrition_summary; Type: VIEW; Schema: DMS; Owner: postgres
--

CREATE VIEW "DMS".daily_nutrition_summary AS
 SELECT user_id,
    date(eaten_at) AS log_date,
    sum(total_calories) AS total_calories,
    sum(total_protein_gm) AS total_protein_gm,
    sum(total_carbs_gm) AS total_carbs_gm,
    sum(total_fat_gm) AS total_fat_gm,
    sum(total_fiber_gm) AS total_fiber_gm
   FROM "DMS".meals
  GROUP BY user_id, (date(eaten_at));


ALTER VIEW "DMS".daily_nutrition_summary OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 87478)
-- Name: meal_items; Type: TABLE; Schema: DMS; Owner: postgres
--

CREATE TABLE "DMS".meal_items (
    item_id bigint NOT NULL,
    meal_id bigint NOT NULL,
    user_id integer NOT NULL,
    food_item character varying(255) NOT NULL,
    quantity text DEFAULT 'g'::character varying CONSTRAINT meal_items_quantity_unit_not_null NOT NULL,
    calories numeric(8,2) NOT NULL,
    protein_gm numeric(8,2) DEFAULT 0 NOT NULL,
    carbs_gm numeric(8,2) DEFAULT 0 NOT NULL,
    fat_gm numeric(8,2) DEFAULT 0 NOT NULL,
    fiber_gm numeric(8,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT meal_items_calories_check CHECK ((calories >= (0)::numeric)),
    CONSTRAINT meal_items_carbs_gm_check CHECK ((carbs_gm >= (0)::numeric)),
    CONSTRAINT meal_items_fat_gm_check CHECK ((fat_gm >= (0)::numeric)),
    CONSTRAINT meal_items_fiber_gm_check CHECK ((fiber_gm >= (0)::numeric)),
    CONSTRAINT meal_items_protein_gm_check CHECK ((protein_gm >= (0)::numeric))
);


ALTER TABLE "DMS".meal_items OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 87477)
-- Name: meal_items_item_id_seq; Type: SEQUENCE; Schema: DMS; Owner: postgres
--

CREATE SEQUENCE "DMS".meal_items_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "DMS".meal_items_item_id_seq OWNER TO postgres;

--
-- TOC entry 5077 (class 0 OID 0)
-- Dependencies: 224
-- Name: meal_items_item_id_seq; Type: SEQUENCE OWNED BY; Schema: DMS; Owner: postgres
--

ALTER SEQUENCE "DMS".meal_items_item_id_seq OWNED BY "DMS".meal_items.item_id;


--
-- TOC entry 222 (class 1259 OID 87442)
-- Name: meals_meal_id_seq; Type: SEQUENCE; Schema: DMS; Owner: postgres
--

CREATE SEQUENCE "DMS".meals_meal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "DMS".meals_meal_id_seq OWNER TO postgres;

--
-- TOC entry 5078 (class 0 OID 0)
-- Dependencies: 222
-- Name: meals_meal_id_seq; Type: SEQUENCE OWNED BY; Schema: DMS; Owner: postgres
--

ALTER SEQUENCE "DMS".meals_meal_id_seq OWNED BY "DMS".meals.meal_id;


--
-- TOC entry 227 (class 1259 OID 95423)
-- Name: user_weight_history; Type: TABLE; Schema: DMS; Owner: postgres
--

CREATE TABLE "DMS".user_weight_history (
    user_id bigint NOT NULL,
    log_date date NOT NULL,
    weight numeric(5,2) NOT NULL
);


ALTER TABLE "DMS".user_weight_history OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 87424)
-- Name: users; Type: TABLE; Schema: DMS; Owner: postgres
--

CREATE TABLE "DMS".users (
    user_id bigint NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255),
    password_hash text NOT NULL,
    password_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_role text DEFAULT 'admin'::text,
    password_changed_at timestamp with time zone
);


ALTER TABLE "DMS".users OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 87423)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: DMS; Owner: postgres
--

CREATE SEQUENCE "DMS".users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "DMS".users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 220
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: DMS; Owner: postgres
--

ALTER SEQUENCE "DMS".users_user_id_seq OWNED BY "DMS".users.user_id;


--
-- TOC entry 4888 (class 2604 OID 87481)
-- Name: meal_items item_id; Type: DEFAULT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".meal_items ALTER COLUMN item_id SET DEFAULT nextval('"DMS".meal_items_item_id_seq'::regclass);


--
-- TOC entry 4880 (class 2604 OID 87446)
-- Name: meals meal_id; Type: DEFAULT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".meals ALTER COLUMN meal_id SET DEFAULT nextval('"DMS".meals_meal_id_seq'::regclass);


--
-- TOC entry 4877 (class 2604 OID 95385)
-- Name: users user_id; Type: DEFAULT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".users ALTER COLUMN user_id SET DEFAULT nextval('"DMS".users_user_id_seq'::regclass);


--
-- TOC entry 4917 (class 2606 OID 87508)
-- Name: meal_items meal_items_pkey; Type: CONSTRAINT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".meal_items
    ADD CONSTRAINT meal_items_pkey PRIMARY KEY (item_id);


--
-- TOC entry 4913 (class 2606 OID 87471)
-- Name: meals meals_pkey; Type: CONSTRAINT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".meals
    ADD CONSTRAINT meals_pkey PRIMARY KEY (meal_id);


--
-- TOC entry 4919 (class 2606 OID 95430)
-- Name: user_weight_history pk_user_weight_history; Type: CONSTRAINT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".user_weight_history
    ADD CONSTRAINT pk_user_weight_history PRIMARY KEY (user_id, log_date);


--
-- TOC entry 4906 (class 2606 OID 87441)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4908 (class 2606 OID 95387)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4910 (class 2606 OID 87439)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4914 (class 1259 OID 87521)
-- Name: idx_meal_items_meal_id; Type: INDEX; Schema: DMS; Owner: postgres
--

CREATE INDEX idx_meal_items_meal_id ON "DMS".meal_items USING btree (meal_id);


--
-- TOC entry 4915 (class 1259 OID 87522)
-- Name: idx_meal_items_user_id; Type: INDEX; Schema: DMS; Owner: postgres
--

CREATE INDEX idx_meal_items_user_id ON "DMS".meal_items USING btree (user_id);


--
-- TOC entry 4911 (class 1259 OID 87519)
-- Name: idx_meals_user_date; Type: INDEX; Schema: DMS; Owner: postgres
--

CREATE INDEX idx_meals_user_date ON "DMS".meals USING btree (user_id, eaten_at);


--
-- TOC entry 4923 (class 2606 OID 95431)
-- Name: user_weight_history fk_user_weight_history_user; Type: FK CONSTRAINT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".user_weight_history
    ADD CONSTRAINT fk_user_weight_history_user FOREIGN KEY (user_id) REFERENCES "DMS".users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4921 (class 2606 OID 87509)
-- Name: meal_items meal_items_meal_id_fkey; Type: FK CONSTRAINT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".meal_items
    ADD CONSTRAINT meal_items_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES "DMS".meals(meal_id) ON DELETE CASCADE;


--
-- TOC entry 4922 (class 2606 OID 95394)
-- Name: meal_items meal_items_user_id_fkey; Type: FK CONSTRAINT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".meal_items
    ADD CONSTRAINT meal_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES "DMS".users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4920 (class 2606 OID 95389)
-- Name: meals meals_user_id_fkey; Type: FK CONSTRAINT; Schema: DMS; Owner: postgres
--

ALTER TABLE ONLY "DMS".meals
    ADD CONSTRAINT meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES "DMS".users(user_id) ON DELETE CASCADE;


-- Completed on 2026-11-14 16:47:48

--
-- PostgreSQL database dump complete
--

\unrestrict Yb7rbJEjFY5xVvw6B1Hdxvegv6DKbr53wg5cmJBJnvxWXjCHt8seXd6M38pZWgR

