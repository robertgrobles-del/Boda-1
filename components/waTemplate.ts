// Plantilla por defecto del mensaje de invitación por WhatsApp.
// Se puede editar desde el panel (Configuración → Plantilla de WhatsApp); ese texto
// se guarda en la base de datos (settings.waTemplate) y tiene prioridad sobre esta.
export const DEFAULT_WA_TEMPLATE = `👋 {SALUDO}

💍 *¡Estás cordialmente invitado/a a nuestra boda!* ✨
Stephanie & Dalvin 🕊️

🗓 *Fecha:* Sábado, 7 de Noviembre de 2026 - 5:00 PM
⛪ *Ceremonia:* Catedral Castrense de Santa Bárbara
🎉 *Recepción:* Club Deportivo Naco · Salón Montás

Para confirmar tu asistencia, por favor accede a nuestra web oficial utilizando *este mismo número de teléfono* y tu *PIN exclusivo*:

📲 *Teléfono registrado:* {TELEFONO}
🔑 *PIN de acceso:* {PIN}
🎟️ *Pases reservados:* {PASES} persona(s)

🌐 *Confirma tu asistencia en el siguiente enlace:*
{ENLACE}

{NOTA_ACCESO}

¡Esperamos contar con tu grata presencia en este día tan especial! ❤️`;
