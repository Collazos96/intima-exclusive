/**
 * Datos de la guía de tallas. Mantener centralizado para que la página
 * y el modal contextual usen la misma fuente.
 */

export const TALLAS_BRA = [
  { talla: 'S', equivalente: '32', busto: '80–85 cm', base: '65–75 cm' },
  { talla: 'M', equivalente: '34', busto: '85–95 cm', base: '76–81 cm' },
  { talla: 'L', equivalente: '36', busto: '95–100 cm', base: '82–88 cm' },
  { talla: 'XL', equivalente: '38', busto: '100–105 cm', base: '89–96 cm' },
]

export const TALLAS_PANTY = [
  { talla: 'S', jean: '4–6', cadera: '85–95 cm' },
  { talla: 'M', jean: '8–10', cadera: '95–105 cm' },
  { talla: 'L', jean: '10–12', cadera: '105–115 cm' },
]

export const COMO_MEDIR = [
  {
    titulo: 'Contorno de busto',
    texto:
      'Pasa la cinta métrica alrededor de la parte más prominente del busto, manteniéndola horizontal por la espalda. No aprietes ni dejes la cinta floja.',
  },
  {
    titulo: 'Contorno bajo busto (base)',
    texto:
      'Mide alrededor del torso, justo debajo del seno, donde queda la banda del brassier. Esta es la medida más importante para acertar tu talla.',
  },
  {
    titulo: 'Contorno de cadera',
    texto:
      'Mide alrededor de la parte más amplia de la cadera, normalmente 20 cm por debajo de la cintura. Para pantys, esta es la medida que define tu talla.',
  },
]
