-- Precio de oferta (opcional). Cuando está definido, precio queda tachado
-- y precio_oferta es el valor real de venta.
ALTER TABLE productos ADD COLUMN precio_oferta INTEGER;
