-- Pedidos (Wompi)
CREATE TABLE IF NOT EXISTS pedidos (
  reference TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'PENDING',
  wompi_transaction_id TEXT,
  wompi_payment_method TEXT,

  -- Cliente
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  documento_tipo TEXT,
  documento_numero TEXT,

  -- Dirección
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  departamento TEXT,
  codigo_postal TEXT,
  notas TEXT,

  -- Totales (en centavos)
  subtotal INTEGER NOT NULL,
  envio INTEGER NOT NULL,
  total INTEGER NOT NULL,

  -- Envío tracking
  estado_envio TEXT DEFAULT 'preparando',
  guia_envio TEXT,

  -- Fechas
  creado_at TEXT NOT NULL,
  actualizado_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_creado ON pedidos(creado_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_email ON pedidos(email);

CREATE TABLE IF NOT EXISTS pedidos_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_ref TEXT NOT NULL,
  producto_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  color TEXT NOT NULL,
  talla TEXT NOT NULL,
  precio_unitario INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  FOREIGN KEY (pedido_ref) REFERENCES pedidos(reference) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pedidos_items_ref ON pedidos_items(pedido_ref);
