-- Miniature normalizzate (quadrate, WebP), generate al primo accesso da /api/img/[id].
-- "src" identifica l'origine (foto dell'utente o URL del catalogo + versione della pipeline):
-- se cambia, la miniatura viene rigenerata.
CREATE TABLE IF NOT EXISTS thumbs (
  product_id  text PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  src         text NOT NULL,
  data        bytea NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
