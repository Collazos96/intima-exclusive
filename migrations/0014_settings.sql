-- Tabla genérica clave-valor para ajustes editables desde el admin
-- (mensaje de campaña de la barra superior, y futuros ajustes).
CREATE TABLE IF NOT EXISTS settings (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  actualizado_at TEXT
);

-- Banner de campaña inicial. valor es JSON: { activo, mensaje }
INSERT OR IGNORE INTO settings (clave, valor, actualizado_at)
VALUES (
  'banner',
  '{"activo":true,"mensaje":"Envío GRATIS a todo Colombia por tiempo limitado"}',
  datetime('now')
);
