-- 0016 — Renombra la categoría "Pijamas" a "Levantadoras".
--
-- Se cambia SOLO el nombre visible (nombre) y el subtítulo (sub). El id de la
-- categoría se conserva como 'pijamas' para no romper la relación con los
-- productos (productos.categoria_id = 'pijamas'), las URLs (/categoria/pijamas)
-- ni las rutas ya generadas por el SSG.
UPDATE categorias
SET nombre = 'Levantadoras',
    sub = 'Realza tu figura'
WHERE id = 'pijamas';
