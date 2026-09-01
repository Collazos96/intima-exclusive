-- 0015 — Índices del catálogo para reducir "rows read" en D1.
--
-- Sin estos índices, los JOIN/subqueries por producto_id y color_id hacen
-- full table scans, lo que dispara las lecturas (rows read) del D1 y agota
-- el límite del plan gratuito (5M/día). Estos índices convierten esos
-- escaneos en búsquedas indexadas, recortando drásticamente las lecturas.

-- imagenes: se une por producto_id en /api/productos, /api/categoria, detalle…
CREATE INDEX IF NOT EXISTS idx_imagenes_producto ON imagenes(producto_id);

-- colores: se consulta por producto_id en detalle y categoría.
CREATE INDEX IF NOT EXISTS idx_colores_producto ON colores(producto_id);

-- tallas: se consulta por color_id (IN (...)) para el stock.
CREATE INDEX IF NOT EXISTS idx_tallas_color ON tallas(color_id);

-- visitas: crece con cada vista de producto; se agrupa por producto_id
-- ("más vistos") y se filtra por fecha en analytics.
CREATE INDEX IF NOT EXISTS idx_visitas_producto ON visitas(producto_id);
CREATE INDEX IF NOT EXISTS idx_visitas_fecha ON visitas(fecha);

-- productos: filtro por categoría (con soft-delete) en /api/categoria.
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
