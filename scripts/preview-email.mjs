// Genera una preview de los emails de pedido con data mock.
// Ejecutar: node scripts/preview-email.mjs
// Output:
//   public/preview-email.html            -> preview de confirmacion de compra
//   public/preview-email-enviado.html    -> preview de "tu pedido va en camino"
// Accesible en:
//   http://localhost:5173/preview-email.html
//   http://localhost:5173/preview-email-enviado.html

import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '../public')

function formatCopCents(c) {
  return '$' + Math.round((c || 0) / 100).toLocaleString('es-CO') + ' COP'
}

// --- Confirmacion de compra (espejo de worker/orderConfirmationHtml) ---
function orderConfirmationHtml({ pedido, items }) {
  const firstName = pedido.nombre?.split(' ')[0] || ''
  const itemsHtml = items.map((i) => `
    <tr>
      ${i.imagen ? `
      <td width="80" valign="top" style="padding:10px 12px 10px 0;border-bottom:1px solid #D9C4A8;">
        <img src="${i.imagen}" alt="${i.nombre}" width="80" height="100" style="display:block;width:80px;height:100px;object-fit:cover;border:1px solid #D9C4A8;background:#F5EDE0;" />
      </td>` : ''}
      <td valign="top" style="padding:10px 0;border-bottom:1px solid #D9C4A8;">
        <p style="font-family:Georgia,serif;color:#3A1A20;font-size:14px;margin:0 0 2px;">${i.nombre}</p>
        <p style="font-family:Arial,sans-serif;color:#7A5A60;font-size:12px;margin:0;">${i.color} · Talla ${i.talla} · x${i.cantidad}</p>
      </td>
      <td align="right" valign="top" style="padding:10px 0 10px 12px;border-bottom:1px solid #D9C4A8;font-family:Arial,sans-serif;color:#7B1A2E;font-weight:bold;font-size:14px;white-space:nowrap;">
        ${formatCopCents(i.precio_unitario * i.cantidad)}
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recibimos tu pedido — Íntima Exclusive</title>
</head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background:#F5EDE0;color:#3A1A20;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F5EDE0;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#FAF5EE;padding:40px 24px;">
    <tr><td align="center" style="padding-bottom:32px;border-bottom:1px solid #D9C4A8;">
      <a href="https://intimaexclusive.com" style="text-decoration:none;">
        <p style="font-family:Georgia,serif;font-size:24px;color:#7B1A2E;margin:0 0 4px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;">Íntima</p>
        <p style="font-family:Georgia,serif;font-size:16px;color:#C4A882;margin:0;font-style:italic;letter-spacing:1px;">Exclusive</p>
      </a>
    </td></tr>
    <tr><td style="height:24px;">&nbsp;</td></tr>
    <tr><td align="center">
      <h1 style="font-family:Georgia,serif;font-size:26px;color:#7B1A2E;font-weight:normal;margin:0 0 8px;">Recibimos tu pedido${firstName ? ', ' + firstName : ''}</h1>
      <p style="font-family:Georgia,serif;font-size:14px;color:#7A5A60;margin:0 0 4px;">Gracias por tu compra. Empezamos a prepararla con cuidado.</p>
      <p style="font-family:'Courier New',monospace;font-size:12px;color:#C4A882;margin:16px 0 0;">Ref: ${pedido.reference}</p>
    </td></tr>
    <tr><td style="height:24px;">&nbsp;</td></tr>
    <tr><td>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFFDF9;border:1px solid #D9C4A8;padding:20px;">
        <tr><td>
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7A5A60;margin:0 0 12px;">Tu pedido</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${itemsHtml}
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:16px;">
            <tr><td style="font-family:Arial,sans-serif;color:#7A5A60;font-size:13px;padding:4px 0;">Subtotal</td><td align="right" style="font-family:Arial,sans-serif;color:#3A1A20;font-size:13px;padding:4px 0;">${formatCopCents(pedido.subtotal)}</td></tr>
            ${pedido.cupon_descuento > 0 ? `
            <tr><td style="font-family:Arial,sans-serif;color:#7A5A60;font-size:13px;padding:4px 0;">Descuento (${pedido.cupon_codigo})</td><td align="right" style="font-family:Arial,sans-serif;color:#059669;font-weight:bold;font-size:13px;padding:4px 0;">-${formatCopCents(pedido.cupon_descuento)}</td></tr>` : ''}
            <tr><td style="font-family:Arial,sans-serif;color:#7A5A60;font-size:13px;padding:4px 0;">Envío</td><td align="right" style="font-family:Arial,sans-serif;color:${pedido.envio === 0 ? '#059669' : '#3A1A20'};font-weight:${pedido.envio === 0 ? 'bold' : 'normal'};font-size:13px;padding:4px 0;">${pedido.envio === 0 ? 'GRATIS' : formatCopCents(pedido.envio)}</td></tr>
            <tr><td style="font-family:Georgia,serif;color:#3A1A20;font-size:16px;padding:12px 0 4px;border-top:1px solid #D9C4A8;">Total</td><td align="right" style="font-family:Georgia,serif;color:#7B1A2E;font-size:18px;font-weight:bold;padding:12px 0 4px;border-top:1px solid #D9C4A8;">${formatCopCents(pedido.total)}</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="height:20px;">&nbsp;</td></tr>
    <tr><td>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:0 4px;">
        <tr><td>
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7A5A60;margin:0 0 8px;">Dirección de envío</p>
          <p style="font-family:Georgia,serif;font-size:14px;color:#3A1A20;margin:0 0 4px;line-height:1.5;">
            ${pedido.nombre}<br>
            ${pedido.direccion}<br>
            ${pedido.ciudad}${pedido.departamento ? ', ' + pedido.departamento : ''}<br>
            ${pedido.telefono}
          </p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="height:24px;">&nbsp;</td></tr>
    <tr><td align="center" style="padding:24px 20px;background:#F5EDE0;border-left:3px solid #7B1A2E;">
      <p style="font-family:Georgia,serif;font-style:italic;color:#7B1A2E;font-size:15px;margin:0 0 10px;line-height:1.6;">
        La verdadera elegancia comienza con la comodidad.
      </p>
      <p style="font-family:Georgia,serif;color:#3A1A20;font-size:13px;margin:0 0 14px;line-height:1.6;">
        Gracias por elegirnos — porque cuando te sientes bien contigo, el mundo lo nota.
      </p>
      <p style="font-family:Arial,sans-serif;color:#7A5A60;font-size:12px;margin:0;">
        Preparación: 1-2 días hábiles · Entrega: 2-5 días hábiles<br>
        Empaque completamente discreto, como siempre.
      </p>
    </td></tr>
    <tr><td>
      <hr style="border:none;border-top:1px solid #D9C4A8;margin:32px 0 24px;">
    </td></tr>
    <tr><td align="center">
      <p style="font-family:Georgia,serif;font-size:13px;color:#7A5A60;line-height:1.5;margin:0;">
        ¿Alguna pregunta sobre tu pedido?<br>
        <a href="https://wa.me/573028556022?text=${encodeURIComponent(`Hola! Tengo una pregunta sobre mi pedido ${pedido.reference}`)}" style="color:#7B1A2E;text-decoration:none;font-weight:bold;">Escríbenos por WhatsApp</a>
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}

// --- Envio en camino (espejo de worker/shippingNotificationHtml) ---
function shippingNotificationHtml({ pedido, items }) {
  const firstName = pedido.nombre?.split(' ')[0] || ''
  const itemsHtml = items.map((i) => `
    <tr>
      <td valign="top" style="padding:8px 0;border-bottom:1px solid #D9C4A8;">
        <p style="font-family:Georgia,serif;color:#3A1A20;font-size:14px;margin:0 0 2px;">${i.nombre}</p>
        <p style="font-family:Arial,sans-serif;color:#7A5A60;font-size:12px;margin:0;">${i.color} · Talla ${i.talla} · x${i.cantidad}</p>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tu pedido va en camino — Íntima Exclusive</title>
</head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background:#F5EDE0;color:#3A1A20;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F5EDE0;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#FAF5EE;padding:40px 24px;">
    <tr><td align="center" style="padding-bottom:32px;border-bottom:1px solid #D9C4A8;">
      <a href="https://intimaexclusive.com" style="text-decoration:none;">
        <p style="font-family:Georgia,serif;font-size:24px;color:#7B1A2E;margin:0 0 4px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;">Íntima</p>
        <p style="font-family:Georgia,serif;font-size:16px;color:#C4A882;margin:0;font-style:italic;letter-spacing:1px;">Exclusive</p>
      </a>
    </td></tr>
    <tr><td style="height:24px;">&nbsp;</td></tr>
    <tr><td align="center">
      <h1 style="font-family:Georgia,serif;font-size:26px;color:#7B1A2E;font-weight:normal;margin:0 0 8px;">Tu pedido va en camino${firstName ? ', ' + firstName : ''}</h1>
      <p style="font-family:Georgia,serif;font-size:14px;color:#7A5A60;margin:0 0 4px;">Ya está con el transportador. Pronto llegará a tu puerta.</p>
      <p style="font-family:'Courier New',monospace;font-size:12px;color:#C4A882;margin:16px 0 0;">Ref: ${pedido.reference}</p>
    </td></tr>
    <tr><td style="height:24px;">&nbsp;</td></tr>
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFFDF9;border:2px solid #7B1A2E;padding:20px;">
        <tr><td align="center">
          <p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#7A5A60;margin:0 0 8px;">Guía de envío</p>
          <p style="font-family:'Courier New',monospace;font-size:20px;color:#7B1A2E;font-weight:bold;margin:0;letter-spacing:1px;word-break:break-all;">${pedido.guia_envio}</p>
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#7A5A60;margin:10px 0 0;">Úsala en el sitio del transportador para rastrear tu paquete.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="height:24px;">&nbsp;</td></tr>
    <tr><td>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFFDF9;border:1px solid #D9C4A8;padding:20px;">
        <tr><td>
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7A5A60;margin:0 0 12px;">Tu pedido</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${itemsHtml}
          </table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="height:20px;">&nbsp;</td></tr>
    <tr><td>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:0 4px;">
        <tr><td>
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7A5A60;margin:0 0 8px;">Dirección de entrega</p>
          <p style="font-family:Georgia,serif;font-size:14px;color:#3A1A20;margin:0 0 4px;line-height:1.5;">
            ${pedido.nombre}<br>
            ${pedido.direccion}<br>
            ${pedido.ciudad}${pedido.departamento ? ', ' + pedido.departamento : ''}<br>
            ${pedido.telefono}
          </p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="height:24px;">&nbsp;</td></tr>
    <tr><td align="center" style="padding:24px 20px;background:#F5EDE0;border-left:3px solid #7B1A2E;">
      <p style="font-family:Georgia,serif;font-style:italic;color:#7B1A2E;font-size:15px;margin:0 0 10px;line-height:1.6;">
        Pronto llegará a tu puerta.
      </p>
      <p style="font-family:Georgia,serif;color:#3A1A20;font-size:13px;margin:0 0 14px;line-height:1.6;">
        Empacada con el mismo cuidado con el que fue hecha.
      </p>
      <p style="font-family:Arial,sans-serif;color:#7A5A60;font-size:12px;margin:0;">
        Tiempo estimado de entrega: 2-5 días hábiles<br>
        Empaque completamente discreto, como siempre.
      </p>
    </td></tr>
    <tr><td>
      <hr style="border:none;border-top:1px solid #D9C4A8;margin:32px 0 24px;">
    </td></tr>
    <tr><td align="center">
      <p style="font-family:Georgia,serif;font-size:13px;color:#7A5A60;line-height:1.5;margin:0;">
        ¿Alguna pregunta sobre tu envío?<br>
        <a href="https://wa.me/573028556022?text=${encodeURIComponent(`Hola! Tengo una pregunta sobre mi pedido ${pedido.reference} (guia ${pedido.guia_envio})`)}" style="color:#7B1A2E;text-decoration:none;font-weight:bold;">Escríbenos por WhatsApp</a>
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}

// --- Mock data ---
const pedido = {
  reference: 'IE-2026-04-22-001',
  nombre: 'María López',
  email: 'maria@ejemplo.co',
  telefono: '+57 300 123 4567',
  direccion: 'Carrera 43A #1-50, Apto 801',
  ciudad: 'Medellín',
  departamento: 'Antioquia',
  subtotal: 28900000,
  envio: 0,
  total: 28900000,
  cupon_codigo: null,
  cupon_descuento: 0,
  guia_envio: 'SERV-123456789-CO',
}

const items = [
  {
    producto_id: 'set-carmina',
    nombre: 'Set Carmina',
    color: 'Negro',
    talla: 'M',
    cantidad: 1,
    precio_unitario: 18900000,
    imagen: 'https://images.intimaexclusive.com/SET-CARMINA-1.jpg',
  },
  {
    producto_id: 'set-aurora',
    nombre: 'Set Aurora',
    color: 'Blanco',
    talla: 'L',
    cantidad: 1,
    precio_unitario: 10000000,
    imagen: 'https://images.intimaexclusive.com/SET-AURORA-1.jpg',
  },
]

if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true })

writeFileSync(
  resolve(PUBLIC_DIR, 'preview-email.html'),
  orderConfirmationHtml({ pedido, items }),
  'utf8',
)
writeFileSync(
  resolve(PUBLIC_DIR, 'preview-email-enviado.html'),
  shippingNotificationHtml({ pedido, items }),
  'utf8',
)

console.log('Previews generadas:')
console.log('  - http://localhost:5173/preview-email.html           (confirmacion)')
console.log('  - http://localhost:5173/preview-email-enviado.html   (en camino)')
