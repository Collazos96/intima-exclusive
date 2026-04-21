-- Cupones de descuento
CREATE TABLE IF NOT EXISTS cupones (
  codigo TEXT PRIMARY KEY,                 -- siempre en mayúsculas (BLACKFRIDAY25)
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK(tipo IN ('porcentaje', 'fijo')),
  valor INTEGER NOT NULL,                  -- porcentaje 1-100 OR centavos si tipo='fijo'
  minimo_compra INTEGER NOT NULL DEFAULT 0,-- centavos
  max_usos INTEGER,                        -- NULL = ilimitado
  usos_actuales INTEGER NOT NULL DEFAULT 0,
  expira_at TEXT,                          -- ISO; NULL = sin expiración
  solo_primera_compra INTEGER NOT NULL DEFAULT 0,
  email_requerido TEXT,                    -- NULL = cualquier email; si set, solo ese
  activo INTEGER NOT NULL DEFAULT 1,
  creado_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cupones_activo ON cupones(activo);

-- Campos en pedidos para trazabilidad del cupón aplicado
ALTER TABLE pedidos ADD COLUMN cupon_codigo TEXT;
ALTER TABLE pedidos ADD COLUMN cupon_descuento INTEGER NOT NULL DEFAULT 0;
