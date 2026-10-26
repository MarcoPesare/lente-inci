CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS products (
  id          text PRIMARY KEY,
  gtin        text UNIQUE,
  name        text NOT NULL,
  brand       text NOT NULL DEFAULT '',
  category    text NOT NULL DEFAULT 'Altro',
  mode        text NOT NULL DEFAULT 'rinse' CHECK (mode IN ('rinse','leave')),
  inci        text,
  source      text NOT NULL DEFAULT '',
  origin      text NOT NULL DEFAULT 'user' CHECK (origin IN ('user','obf')),
  image_url   text,
  score       real,
  flags       text[] NOT NULL DEFAULT '{}',
  coverage    smallint,
  is_italy    boolean NOT NULL DEFAULT false,
  search      text GENERATED ALWAYS AS (lower(name || ' ' || brand)) STORED,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_search_trgm ON products USING gin (search gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_category_score ON products (category, score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS products_score ON products (score DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS photos (
  product_id  text PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  data        bytea NOT NULL,
  mime        text NOT NULL,
  width       integer NOT NULL,
  height      integer NOT NULL,
  bytes       integer NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id          text PRIMARY KEY,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
