
'use server';

/**
 * @fileOverview Acción de servidor para enviar alertas a Telegram.
 * Permite notificar a una comunidad de agricultores en tiempo real.
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7854632145:AAH_DEMO_TOKEN_NOT_REAL';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1001234567890';

export async function sendTelegramAlert(data: {
  problem: string;
  region: string;
  severity: string;
  distance: string;
  description: string;
}) {
  console.log(`[TELEGRAM] Preparando alerta para: ${data.problem} en ${data.region}`);

  // Mensaje formateado para Telegram (Soporta HTML básico)
  const message = `
🚨 <b>ALERTA DE RIESGO AGRÍCOLA</b> 🚨
-------------------------------------
<b>⚠️ Problema:</b> ${data.problem.toUpperCase()}
<b>📍 Región:</b> ${data.region}
<b>🔥 Severidad:</b> ${data.severity}
<b>📏 Distancia:</b> ${data.distance}

<b>📝 Descripción:</b> 
<i>"${data.description}"</i>

-------------------------------------
🛰️ <i>Enviado automáticamente por AgroTech Hidalgo Radar</i>
  `.trim();

  try {
    // Si no hay token real, simulamos éxito para la demo del hackathon
    if (TELEGRAM_BOT_TOKEN.includes('DEMO_TOKEN')) {
      await new Promise(r => setTimeout(r, 1500));
      return { 
        success: true, 
        message: 'Simulación de Telegram exitosa (Token no configurado en .env)' 
      };
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.description || 'Error en la API de Telegram');
    }

    return { success: true, message: 'Alerta enviada correctamente a la comunidad en Telegram.' };
  } catch (error: any) {
    console.error('Error enviando a Telegram:', error);
    return { success: false, message: error.message || 'Error de conexión con Telegram' };
  }
}
