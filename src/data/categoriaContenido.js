/**
 * Contenido editorial por categoría para SEO y experiencia.
 * Se renderiza en /categoria/:id antes del grid de productos.
 *
 * Estructura por categoría:
 *  - intro: párrafo de apertura (~70 palabras, primer impacto y keywords)
 *  - bloques: secciones con título y texto (~80-100 palabras c/u)
 *  - faqs: 3 preguntas frecuentes específicas de la categoría
 */
export const CONTENIDO_CATEGORIA = {
  sets: {
    intro:
      'Los <strong>sets de lencería</strong> son la forma más completa de elegirte cada día. En Íntima Exclusive diseñamos conjuntos de brasier y panty pensados para que se sientan tan bien como se ven: encajes de alta calidad, copas que sostienen sin apretar y herrajes en tono oro que aportan ese detalle de elegancia. Tallas XS a 4XL, hechos con amor en Colombia.',
    bloques: [
      {
        titulo: '¿Por qué un set y no piezas sueltas?',
        texto:
          'Cuando combinas brasier y panty del mismo diseño se logra una armonía visual que cambia cómo te sientes. Un set bien elegido te acompaña en el trabajo, en una cita o simplemente cuando quieres usar algo bonito para ti. Nuestros conjuntos están pensados para uso diario y para esos momentos en los que quieres sorprender o ser sorprendida.',
      },
      {
        titulo: 'Materiales y acabados',
        texto:
          'Trabajamos con encajes franceses suaves al tacto, elásticos forrados que no marcan, copas con espuma ligera que mantienen forma y apliques de herrajería en tono oro. Cada pieza pasa por un control de calidad antes de salir. Si una costura no es perfecta, la prenda no se envía.',
      },
      {
        titulo: 'Cómo elegir tu talla',
        texto:
          'Manejamos tallas desde XS hasta 4XL en sets. Si estás entre dos tallas, te recomendamos pedir la más grande para mayor comodidad — sobre todo en el contorno del busto. En la página de cada producto encuentras la guía de tallas detallada, y si tienes dudas escríbenos por WhatsApp con tus medidas y te decimos exactamente cuál pedir.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Los sets vienen con copa removible?',
        respuesta:
          'Depende del diseño. La mayoría tiene espuma ligera fija para dar forma sin volumen. Algunos modelos sin alambre tienen copa más suave. En la descripción de cada producto te decimos exactamente.',
      },
      {
        pregunta: '¿Puedo cambiar solo el panty si me queda grande?',
        respuesta:
          'Sí. Ofrecemos cambio por talla dentro de los 30 días. Por higiene, los pantys solo se cambian si llegan en empaque original sin uso.',
      },
      {
        pregunta: '¿Qué set recomiendan para regalo?',
        respuesta:
          'Los sets de encaje rojo, negro o blanco son los favoritos para regalar. Si tienes dudas con la talla, podemos enviar una tarjeta de cambio dentro del paquete para que la persona pueda ajustar después.',
      },
    ],
  },

  corsets: {
    intro:
      'La <strong>corsetería</strong> es para mujeres que quieren sentirse esculturales. Nuestros corsets combinan estructura real con confort: varillas estratégicamente colocadas que afinan la silueta, telas firmes que sostienen y encajes que añaden sensualidad. Disponibles en tallas XS a 4XL, son una pieza poderosa que puedes usar sola, bajo un vestido o como parte de un look más atrevido.',
    bloques: [
      {
        titulo: '¿Para qué ocasión es un corset?',
        texto:
          'Un corset funciona para mucho más que noches especiales. Bajo un vestido define la cintura sin que se note. Sobre una camisa básica transforma un look casual en uno editorial. Y como prenda íntima por sí sola, es una declaración de seguridad. Las novias también nos buscan para sus fotos pre-boda y luna de miel.',
      },
      {
        titulo: 'Estructura y comodidad',
        texto:
          'Cada corset tiene varillas flexibles que dan forma sin clavarse, cierres con corchetes ajustables en varias posiciones para encontrar tu fit ideal, y una banda interior suave que protege la piel. No verás esos corsets duros e incómodos del cine: los nuestros están hechos para llevar todo el día.',
      },
      {
        titulo: 'Tallas y cómo medir',
        texto:
          'En corsetería el ajuste es crítico. Mide el contorno del busto bajo el seno y la cintura natural (la parte más estrecha del torso). Si tu medida está entre dos tallas, elige la mayor — siempre puedes ajustar más cerrado con los corchetes. La guía de tallas tiene la tabla completa con equivalencias.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Los corsets son cómodos para usar muchas horas?',
        respuesta:
          'Sí, si eliges la talla correcta. Nuestros corsets están diseñados para uso prolongado, no son fajas reductoras. La sensación es de "abrazo firme", no de presión.',
      },
      {
        pregunta: '¿Puedo lavarlos en lavadora?',
        respuesta:
          'No. Lava a mano con agua fría y jabón suave, presiona con toalla y seca al aire libre. La lavadora deforma las varillas y daña el encaje.',
      },
      {
        pregunta: '¿Sirven después del embarazo?',
        respuesta:
          'Muchas mujeres nos compran corsets postparto. Te recomendamos esperar al menos 6 semanas y consultarlo con tu médico. Mide tu cintura al momento de comprar — el cuerpo cambia.',
      },
    ],
  },

  lenceria: {
    intro:
      'La <strong>lencería</strong> de Íntima Exclusive es delicada, sensual y con personalidad. Encajes calados, transparencias estratégicas, detalles bordados y siluetas que abrazan tu cuerpo sin imponerle nada. Es la categoría más romántica de nuestra colección — pensada para esos momentos en los que la elegancia es el lenguaje. Tallas XS a 4XL.',
    bloques: [
      {
        titulo: 'Lencería para sentirte hermosa',
        texto:
          'No necesitas una ocasión especial para usar lencería bonita. Es para ti, primero. Cuando una mujer se pone una pieza delicada bajo la ropa, su día cambia desde adentro. Por eso curamos cada diseño para que te sientas cómoda, sensual y poderosa, en partes iguales.',
      },
      {
        titulo: 'Texturas y diseños',
        texto:
          'Encontrarás encajes franceses, mallas ligeras con bordados, transparencias con apliques estratégicos y siluetas que van desde lo clásico hasta lo más arriesgado. Cada pieza tiene un acabado pulido por dentro: las costuras quedan suaves contra la piel, sin etiquetas que rasquen.',
      },
      {
        titulo: 'Cuidado para que duren',
        texto:
          'Las prendas delicadas requieren cuidado consciente. Lava a mano con agua fría y jabón neutro, evita blanqueadores, no retuerzas — presiona suavemente con una toalla limpia y seca al aire libre, a la sombra. Sin secadora ni plancha directa sobre el encaje. Con esos cuidados, una pieza de buena calidad te dura años.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Hay diseños más cómodos para uso diario?',
        respuesta:
          'Sí. Tenemos lencería de uso diario (sin transparencias, telas suaves, sin alambre) y diseños más sensuales para momentos especiales. En cada producto se indica el tipo de uso recomendado.',
      },
      {
        pregunta: '¿Las transparencias se ven bajo la ropa?',
        respuesta:
          'Para uso bajo ropa recomendamos colores neutros: nude, beige o piel. El blanco y el negro pueden marcarse. Si tienes dudas, escríbenos con la prenda exterior en mente y te asesoramos.',
      },
      {
        pregunta: '¿Puedo usar lencería en talla grande sin sentirme apretada?',
        respuesta:
          'Sí. Nuestros diseños en 2XL, 3XL y 4XL están hechos con los mismos encajes, no son simplemente "el mismo modelo más grande". Las copas, elásticos y proporciones se ajustan a cada talla.',
      },
    ],
  },

  bodys: {
    intro:
      'Los <strong>bodys</strong> son la pieza más versátil de tu cajón íntimo. Una sola prenda que funciona como ropa interior, como top bajo un blazer, como base para un look completo. Los nuestros están hechos con encajes y mallas que te abrazan sin marcar, con cierres en la entrepierna que no se ven y cortes que estilizan la silueta. Tallas XS a 4XL.',
    bloques: [
      {
        titulo: 'Un body, mil formas de usarlo',
        texto:
          'Bajo un jean alto se ve como un top sofisticado. Bajo una falda lápiz suma elegancia sin volumen. Como prenda íntima sola, es una pieza poderosa para ocasiones especiales. Esta versatilidad es lo que hace que un body de buena calidad sea una de las inversiones más inteligentes de tu armario íntimo.',
      },
      {
        titulo: 'Diseños y materiales',
        texto:
          'Encontrarás bodys con copa estructurada, sin alambre, en encaje pleno, con transparencias estratégicas o con detalles abiertos en la espalda. Las telas son suaves al tacto y los elásticos están forrados para no marcar. Los broches en la entrepierna son metálicos forrados para que abras y cierres con facilidad.',
      },
      {
        titulo: 'Cómo elegir tu body',
        texto:
          'Si lo vas a usar como prenda exterior bajo ropa, fíjate en la copa: las con espuma ligera dan forma sin marcar el pezón. Si lo quieres como prenda íntima sensual, los bodys de encaje pleno o con transparencias son ideales. Para tallas más amplias, los modelos sin alambre suelen ser más cómodos durante el día.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Los bodys se ven gruesos bajo la ropa?',
        respuesta:
          'No. Están diseñados con telas finas que no agregan volumen. Los modelos con copa de espuma son los que dan más estructura, pero igual son discretos.',
      },
      {
        pregunta: '¿Es práctico usar body para ir al baño?',
        respuesta:
          'Todos nuestros bodys tienen broches metálicos en la entrepierna que se abren y cierran fácilmente, no necesitas quitártelo entero.',
      },
      {
        pregunta: '¿Aguantan ser lavados muchas veces?',
        respuesta:
          'Sí, si los lavas a mano y los secas a la sombra. Hemos visto clientas que mantienen sus bodys impecables después de años de uso.',
      },
    ],
  },

  accesorios: {
    intro:
      'Los <strong>accesorios íntimos</strong> son los que completan el look. Ligueros, medias de encaje, antifaces, ligas y todos esos detalles que convierten una prenda en una experiencia. En Íntima Exclusive curamos accesorios que combinan con nuestros sets y corsets, para que puedas armar conjuntos completos sin preocuparte por que las texturas o los tonos no coincidan.',
    bloques: [
      {
        titulo: 'Detalles que cambian todo',
        texto:
          'Un liguero sobre una media de encaje no es un complemento, es una decisión estética. Un antifaz no es un disfraz, es un gesto de juego. Estos accesorios funcionan tanto para fotografía profesional como para tus momentos privados. La clave está en elegir piezas con el mismo nivel de calidad que el resto de tu lencería.',
      },
      {
        titulo: 'Cómo combinar accesorios',
        texto:
          'La regla básica: misma familia de color y textura. Si tu set es de encaje negro, el liguero también debe ser negro y de un encaje similar. Si vas a usar medias, fíjate que el ancho de la banda superior coincida con el ajuste del liguero. Cuando dudes, escríbenos por WhatsApp con la prenda principal y te ayudamos a armar el conjunto.',
      },
      {
        titulo: 'Tallas y ajuste',
        texto:
          'La mayoría de nuestros accesorios son de talla única ajustable. Las medias se gradúan con el alto de la pierna y los ligueros tienen ganchos en varias posiciones. Para antifaces y diademas, todos vienen con cinta elástica regulable. Si necesitas medidas específicas, contáctanos antes de comprar.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Las medias se rasgan fácil?',
        respuesta:
          'Si las usas con cuidado y las lavas a mano, duran muchos usos. Te recomendamos cortarte las uñas largas o usar guantes finos al ponerlas para evitar engancharlas.',
      },
      {
        pregunta: '¿Los antifaces son muy oscuros para ver?',
        respuesta:
          'Tenemos antifaces decorativos (que dejan ver) y antifaces de venda completa (sin visión). En la descripción de cada producto se indica claramente.',
      },
      {
        pregunta: '¿Hacen accesorios personalizados?',
        respuesta:
          'En algunos casos sí, especialmente para regalos o sesiones de fotos. Escríbenos por WhatsApp con tu idea y te decimos si es viable.',
      },
    ],
  },
}
