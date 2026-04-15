CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comentario TEXT NOT NULL,
  fecha TEXT NOT NULL,
  aprobada INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_producto_aprobada
  ON reviews(producto_id, aprobada);

CREATE INDEX IF NOT EXISTS idx_reviews_aprobada_fecha
  ON reviews(aprobada, fecha DESC);
