-- Soft-delete: columna deleted_at en productos. Los filtros públicos excluyen filas con valor.
ALTER TABLE productos ADD COLUMN deleted_at TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_productos_deleted_at ON productos(deleted_at);
