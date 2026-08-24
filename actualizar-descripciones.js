// ============================================================
// SCRIPT: Actualizar descripciones de productos
// Pegar en consola del navegador estando logueado en /admin
// ============================================================

const API = 'https://api.intimaexclusive.com'

const DESCRIPCIONES = {
  // SETS
  'carmina':               'Conjunto íntimo con corpiño estructurado y cola a juego, confeccionado en encaje suave de alta calidad con herraje dorado como detalle signature. Su diseño equilibra sensualidad y comodidad, ideal para sentirte poderosa desde adentro. Disponible en colores clásicos para adaptarse a cada personalidad.',
  'set-iris':              'Conjunto íntimo de líneas delicadas y diseño romántico, elaborado en encaje fino que se adapta suavemente a tu cuerpo. El balance entre cobertura y sensualidad lo hace perfecto para el día a día y los momentos más especiales.',
  'set-janeth':            'Corpiño con soporte y cola a juego en encaje de acabado premium, diseñado para moldear y resaltar tu silueta con elegancia. Una pieza versátil que combina estructura y delicadeza en cada detalle.',
  'set-jazmin':            'Conjunto íntimo inspirado en la feminidad natural, con encajes suaves y un corte que favorece todo tipo de silueta. Cada detalle está pensado para que te sientas cómoda, segura y completamente tú.',
  'set-karol':             'Set de dos piezas con corpiño de soporte medio y cola combinada, elaborado en telas de tacto suave y encajes selectos. Un equilibrio perfecto entre comodidad y estilo para usar a diario o en ocasiones especiales.',
  'set-kata':              'Conjunto íntimo de diseño limpio y femenino, confeccionado con materiales suaves que cuidan tu piel. Su corte favorecedor y sus acabados de calidad lo convierten en un básico indispensable en tu lencería.',
  'set-salome':            'Set sensual con detalles en encaje y tul que crean una combinación irresistible de transparencia y elegancia. Diseñado para la mujer que sabe que los detalles íntimos también son parte de su estilo.',
  'set-rouse':             'Conjunto íntimo de carácter romántico con aplicaciones en encaje y corte que realza la figura. Su confección cuidadosa y materiales de calidad lo hacen especial para los momentos que merecen serlo.',
  'set-thalia':            'Set íntimo de diseño elegante y atemporal, con encaje fino y acabados que hablan de calidad colombiana. Pensado para la mujer que cuida cada detalle de su imagen, incluso el que nadie más ve.',
  'set-lucia':             'Conjunto íntimo femenino con corpiño de copa suave y panty coordinado en encaje delicado. Su diseño sutil y confortable lo hace ideal para el uso diario sin sacrificar elegancia.',
  'set-basico-primavera':  'Set básico en colores frescos y suaves, confeccionado en tela de microfibra suave al tacto para un confort todo el día. Un básico imprescindible que combina funcionalidad y estilo con naturalidad.',
  'set-basico-reina':      'Conjunto básico de corpiño y cola, elaborado en telas de alta suavidad para acompañarte en tu rutina diaria con comodidad y estilo. Una pieza esencial en cualquier lencería.',
  'set-cristal':           'Set básico de líneas limpias y materiales suaves, diseñado para el día a día con el confort que mereces. Su corte favorecedor y colores versátiles lo convierten en tu aliado de todos los días.',
  'set-eva':               'Conjunto íntimo básico de diseño sencillo y elegante, confeccionado en tela suave con acabados de calidad. Perfecto para quien busca comodidad sin renunciar a sentirse bien.',
  'set-lilith':            'Set básico con toque femenino, en materiales de suavidad premium que cuidan tu piel. Su versatilidad lo hace ideal para usar bajo cualquier outfit del día.',
  'set-yaneth':            'Conjunto íntimo básico y versátil, de corte limpio y tela suave que se adapta a tu cuerpo con naturalidad. Ideal para quien valora la comodidad como parte de su bienestar diario.',

  // CORSETS
  'corset-aria':     'Corset de estructura elegante con varillas de soporte y cierre trasero, diseñado para moldear la cintura y realzar tu silueta con sofisticación. Elaborado en tela resistente y materiales de calidad, es la prenda perfecta para lucir irresistible.',
  'corset-atenea':   'Corset de diseño imponente inspirado en la fuerza y la feminidad, con estructura que define la cintura y resalta las curvas. Sus acabados de calidad y silueta clásica lo convierten en una pieza atemporal.',
  'corset-dafne':    'Corset de líneas suaves y románticas, con detalles en encaje que añaden delicadeza a su estructura moldeadora. Una pieza que equilibra el poder de la forma con la sensualidad del detalle.',
  'corset-millan':   'Corset de perfil moderno con soporte firme y diseño que marca la cintura con precisión. Sus materiales de alta calidad garantizan comodidad sin sacrificar la figura que proyecta.',
  'corset-olivia':   'Corset de estética refinada con acabados elegantes, diseñado para realzar tu figura y hacerte sentir poderosa. Ideal tanto para lucirlo con outfits coordinados como para uso íntimo especial.',
  'corset-samanta':  'Corset estructurado de diseño sensual con detalles que marcan la diferencia, confeccionado para moldear y sostener con estilo. Una prenda para los momentos en que quieres impresionar.',
  'corset-greta':    'Corset de diseño sofisticado con varillas de soporte y acabados premium, ideal para definir la cintura y crear una silueta envidiable. Una prenda de edición especial con descuento exclusivo.',
  'corset-negro':    'Corset clásico en negro profundo con estructura moldeadora y acabados elegantes. Un básico atemporal que realza cualquier figura con seguridad y sensualidad.',

  // CROPTOPS
  'croptop-juana':   'Croptop íntimo de corte moderno y suave al tacto, ideal para usar como prenda interior o en loungewear. Su diseño minimalista y cómodo se adapta a tu estilo sin esfuerzo.',
  'croptop-melina':  'Croptop femenino con detalles en encaje y silueta que favorece el torso, perfecto para combinarlo con sets o usarlo solo como top ligero. Comodidad y estilo en una sola prenda.',
  'croptop-persia':  'Croptop de diseño romántico con aplicaciones delicadas, confeccionado en tela suave que se adapta al cuerpo con naturalidad. Una prenda versátil que transita entre lo íntimo y lo casual.',
  'croptop-venecia': 'Croptop inspirado en la elegancia italiana, con detalles finos y un corte que realza el busto de forma favorecedora. Pensado para la mujer que cuida su estilo en cada momento.',
  'croptop-vilu':    'Croptop de estética fresca y juvenil, elaborado en materiales suaves y de alta durabilidad. Perfecto para el día a día o para combinar con tus prendas íntimas favoritas.',

  // LENCERÍA (Ligueros)
  'liguero-coral':     'Liguero de diseño sensual en tonos cálidos con detalles en encaje, diseñado para complementar tu lencería con un toque de atrevimiento elegante. Sus ligas ajustables se adaptan a diferentes tallas con comodidad.',
  'liguero-dani':      'Liguero clásico de líneas limpias y acabados finos, ideal para completar un look íntimo sofisticado. Su ajuste cómodo y diseño atemporal lo hacen un accesorio indispensable.',
  'liguero-froral':    'Liguero con estampado floral delicado y encaje fino, que añade un toque romántico y primaveral a tu lencería. Una pieza femenina que transforma cualquier conjunto íntimo en algo especial.',
  'liguero-lia':       'Liguero de diseño moderno y sensual con detalles que marcan la diferencia, elaborado en materiales de calidad que garantizan ajuste y comodidad. Perfecto para ocasiones que merecen un poco más.',
  'liguero-rubi':      'Liguero en tono joya con detalles en encaje que combinan pasión y elegancia. Su estructura cómoda y estética sofisticada lo convierten en el complemento perfecto para tu lencería de noche.',
  'liguero-valentino': 'Liguero de alta confección con detalles románticos en encaje y lazos delicados. Un accesorio íntimo que eleva cualquier conjunto y celebra la feminidad en su máxima expresión.',
  'liguero-kloe':      'Liguero de diseño elegante con ligas ajustables y acabados en encaje, disponible en oferta especial. Una pieza que añade sofisticación a tu lencería con un precio irresistible.',

  // BODYS
  'body-adriana': 'Body íntimo de diseño ceñido y sensual, confeccionado en tela elástica suave que se adapta perfectamente a cada curva. Una prenda versátil que puede usarse como lencería o como interior bajo outfits ajustados.',
  'body-luisa':   'Body de silueta femenina y acabados delicados, diseñado para resaltar tu figura con naturalidad y comodidad. Su tejido suave y corte favorecedor lo convierten en una pieza esencial.',
  'body-margot':  'Body de diseño elegante y contemporáneo en oferta exclusiva, elaborado en materiales de alta calidad que moldean el cuerpo con suavidad. Ideal para quienes buscan una prenda que combine funcionalidad con sensualidad.',
  'body-renata':  'Body estructurado de diseño sofisticado, confeccionado en tela de alta elasticidad que abraza el cuerpo y realza la figura. Una prenda de impacto para los momentos que merecen ser especiales.',

  // BABY DOLLS
  'babydoll-cristina':  'Babydoll de tul vaporoso y encaje delicado que cae con suavidad sobre el cuerpo, creando una silueta romántica y etérea. Confeccionado en materiales suaves al tacto, es la prenda perfecta para las noches especiales.',
  'babydoll-valentina': 'Babydoll de diseño romántico con detalles en encaje y lazo, que combina transparencia y delicadeza en una sola prenda. Una pieza íntima pensada para los momentos que merecen sentirse únicos.',

  // TANGAS
  'tangas-especiales':  'Tangas de diseño exclusivo con detalles únicos en encaje y acabados premium que las hacen especiales. Confeccionadas para quienes buscan algo más allá del básico sin sacrificar la comodidad.',
  'tangas-estampadas':  'Tangas con estampados alegres y coloridos, elaboradas en tela suave y elástica de alta calidad. Una opción divertida y cómoda para expresar tu personalidad incluso en lo más íntimo.',
  'tangas-graduales':   'Tangas de diseño con degradado de color que crea un efecto visual único y sofisticado. Confeccionadas en tela suave y de ajuste perfecto para un confort todo el día.',
  'tangas-sporty':      'Tangas de corte deportivo con banda en contraste y tejido suave de alta elasticidad, diseñadas para un ajuste perfecto en movimiento. Ideales para el día activo sin renunciar al estilo.',

  // ACCESORIOS
  'accesorio-guantes':       'Guantes íntimos de encaje que añaden un toque de misterio y sofisticación a cualquier conjunto. El complemento perfecto para completar un look de lencería elegante o disfraz sensual.',
  'accesorio-media-lisa':    'Media de nylon liso de alta suavidad, con acabado semiopaco que estiliza la pierna y complementa cualquier lencería. Clásica, versátil e indispensable.',
  'accesorio-media-malla':   'Medias de malla con patrón geométrico que añaden un toque atrevido y sensual a tu look. Elásticas y resistentes, se adaptan a diferentes tallas con comodidad.',
  'accesorio-mediapantalon': 'Media pantalón de suavidad premium que cubre desde la cintura hasta los pies con una segunda piel casi imperceptible. Perfecta para usar bajo cualquier outfit o como complemento lencero.',

  // PIJAMAS
  'pijama-4-piezas':       'Conjunto de pijama de 4 piezas con estampados divertidos de personajes icónicos, elaborado en tela suave tipo seda que regala confort toda la noche. Incluye top, short, pantalón y bóxer para vestirte como más te guste.',
  'pijama-corazon':        'Pijama con estampado de corazones en tela suave y fresca, perfecta para noches de descanso o días en casa llenos de comodidad. Un diseño tierno y femenino que te abraza mientras duermes.',
  'pijama-estrella':       'Pijama con motivos de estrellas en tela de suavidad premium, diseñada para envolverte en confort durante tus noches de descanso. Un diseño encantador que convierte cada noche en un momento especial.',
  'pijama-levantadora':    'Pijama con levantadora incluida para mayor abrigo y estilo en casa. Elaborada en tela suave y de alta durabilidad, es el conjunto perfecto para noches frescas y mañanas cómodas.',
  'pijama-oversize':       'Pijama de corte oversize en tela suave y holgada que envuelve tu cuerpo con una comodidad sin igual. El diseño relajado y los colores suaves la hacen perfecta para descansar y disfrutar del tiempo en casa.',
  'pijama-pantalon':       'Conjunto de pijama con pantalón largo en tela suave y fresca, ideal para noches templadas o frías. Su diseño clásico y cómodo garantiza un descanso placentero noche tras noche.',
  'pijama-short-pantalon': 'Pijama versátil con short y pantalón en tela suave de alta calidad, para que elijas la comodidad según la temperatura. Dos opciones en un solo conjunto para adaptarse a cada noche.',

  // PROMOCIONES
  'basico-candy': 'Conjunto básico íntimo en tonos dulces y vibrantes, confeccionado en tela suave y resistente para el uso diario. Una opción de promoción especial que no sacrifica calidad ni estilo.',
}

async function getProducto(id) {
  const res = await fetch(`${API}/api/productos/${id}`)
  if (!res.ok) throw new Error(`No se pudo obtener ${id}: ${res.status}`)
  return res.json()
}

async function actualizarDescripcion(id, descripcion) {
  const prod = await getProducto(id)

  // Normalizar colores al formato que espera el PUT
  const colores = prod.colores.map(c => ({
    nombre: c.nombre,
    tallas: c.tallas.map(t => ({ talla: typeof t === 'string' ? t : t.talla, stock: t.stock ?? 0 })),
  }))

  const payload = {
    nombre:          prod.nombre,
    precio:          prod.precio,
    categoria_id:    prod.categoria_id,
    nuevo:           prod.nuevo === 1,
    descripcion:     descripcion,
    imagenes:        prod.imagenes,
    colores:         colores,
    precios_paquete: prod.precios_paquete ?? [],
  }

  const res = await fetch(`${API}/api/admin/productos/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status}`)
  }
  return res.json()
}

// ---- Ejecutar ----
;(async () => {
  const ids = Object.keys(DESCRIPCIONES)
  let ok = 0, fail = 0

  console.log(`🚀 Actualizando ${ids.length} productos...`)
  for (const id of ids) {
    try {
      await actualizarDescripcion(id, DESCRIPCIONES[id])
      console.log(`✅ ${id}`)
      ok++
    } catch (e) {
      console.error(`❌ ${id} — ${e.message}`)
      fail++
    }
    // Pausa pequeña para no saturar el API
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\n✨ Listo: ${ok} actualizados, ${fail} fallidos.`)
})()
