-- Suscriptores del newsletter
CREATE TABLE IF NOT EXISTS suscriptores (
  email TEXT PRIMARY KEY,               -- lowercase, normalizado
  suscrito_at TEXT NOT NULL,
  cupon_codigo TEXT,                    -- código generado para bienvenida
  fuente TEXT,                          -- 'home-newsletter', etc.
  activo INTEGER NOT NULL DEFAULT 1,    -- 0 = unsubscribed
  unsubscribe_token TEXT UNIQUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_suscriptores_activo ON suscriptores(activo);
CREATE INDEX IF NOT EXISTS idx_suscriptores_fecha ON suscriptores(suscrito_at DESC);
