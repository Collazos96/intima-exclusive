export const categorias = [
  { id: 'sets', nombre: 'Sets', sub: 'Conjuntos perfectos' },
  { id: 'corsets', nombre: 'Corsets', sub: 'Estructura y feminidad' },
  { id: 'lenceria', nombre: 'Lencería', sub: 'Delicada y sofisticada' },
  { id: 'bodys', nombre: 'Bodys', sub: 'Elegancia sin límites' },
  { id: 'accesorios', nombre: 'Accesorios', sub: 'El toque final' },
]

export const productos = [
  {
    id: 'carmina',
    nombre: 'Set Carmina',
    precio: 189000,
    categoria: 'sets',
    nuevo: true,
    descripcion: `Una prenda hecha con amor en Colombia, pensada para resaltar tu belleza con comodidad y estilo. Confeccionada con encajes de la más alta calidad, suaves al tacto y delicados con tu piel. Cada diseño incluye detalles en herraje color oro, que aportan un toque de elegancia y exclusividad. Ideal para mujeres que valoran los detalles y se sienten seguras de sí mismas desde adentro.`,
    imagenes: [
      'https://images.intimaexclusive.com/sets/SET-CARMINA.jpg',
      'https://images.intimaexclusive.com/sets/SET-CARMINA-1.jpg',
      'https://images.intimaexclusive.com/sets/SET-CARMINA-2.jpg',
      'https://images.intimaexclusive.com/sets/SET-CARMINA-3.jpg',
      'https://images.intimaexclusive.com/sets/SET-CARMINA-4.jpg',
    ],
    colores: [
      { nombre: 'Rojo', tallas: ['S', 'M', 'L', 'XL'] },
      { nombre: 'Negro', tallas: ['S', 'M', 'L', 'XL'] },
      { nombre: 'Blanco', tallas: ['S', 'M', 'L', 'XL'] },
    ],
  },
  {
    id: 'julietta',
    nombre: 'Set Julietta',
    precio: 179000,
    categoria: 'sets',
    nuevo: true,
    descripcion: `Una prenda hecha con amor en Colombia, pensada para resaltar tu belleza con comodidad y estilo. Confeccionada con encajes de la más alta calidad, suaves al tacto y delicados con tu piel. Cada diseño incluye detalles en herraje color oro, que aportan un toque de elegancia y exclusividad. Ideal para mujeres que valoran los detalles y se sienten seguras de sí mismas desde adentro.`,
    imagenes: [
      'https://images.intimaexclusive.com/sets/SET-JULIETTA.jpg',
      'https://images.intimaexclusive.com/sets/SET-JULIETTA-1.jpg',
      'https://images.intimaexclusive.com/sets/SET-JULIETTA-2.jpg',
      'https://images.intimaexclusive.com/sets/SET-JULIETTA-3.jpg',
      'https://images.intimaexclusive.com/sets/SET-JULIETTA-4.jpg',
    ],
    colores: [
      { nombre: 'Azul', tallas: ['S', 'M'] },
      { nombre: 'Blanco', tallas: ['S', 'M'] },
      { nombre: 'Rojo', tallas: ['S', 'M'] },
      { nombre: 'Rojo oscuro', tallas: ['M'] },
      { nombre: 'Café', tallas: ['S'] },
    ],
  },
]

export const formatPrecio = (p) =>
  '$' + p.toLocaleString('es-CO')