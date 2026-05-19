-- Agrega campo de precios por paquete a productos
-- Formato JSON: [{"cantidad":3,"precio":90000},{"cantidad":5,"precio":130000}]
ALTER TABLE productos ADD COLUMN precios_paquete TEXT;
