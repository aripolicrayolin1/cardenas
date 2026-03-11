'use server';

/**
 * @fileOverview Acción de servidor para enviar alertas REALES a Telegram.
 * Conecta con la API de Telegram para notificar a la comunidad de agricultores.
 */

// NOTA: Debes configurar estas variables en tu archivo .env para producción.
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7854632145:AAH_DEMO_TOKEN_NOT_REAL'; 
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1001234567890';

export async function sendTelegramAlert(data: {
  problem: string;
  region: string;
  severity: string;
  distance: string;
  description: string;
}) {
  console.log(`[TELEGRAM REAL] Enviando alerta: ${data.problem} en ${data.region}`);

  const message = `
🚨 <b>ALERTA DE RIESGO AGRÍCOLA (HIDALGO)</b> 🚨
-------------------------------------
<b>⚠️ Problema:</b> ${data.problem.toUpperCase()}
<b>📍 Región:</b> ${data.region}
<b>🔥 Severidad:</b> ${data.severity.toUpperCase()}
<b>📏 Ubicación:</b> ${data.distance}

<b>📝 Descripción Técnica:</b> 
<i>"${data.description}"</i>

-------------------------------------
🛰️ <i>Mensaje generado por AgroTech Hidalgo AI Radar</i>
  `.trim();

  try {
    // Si el token es el de demo, avisamos pero no fallamos
    if (TELEGRAM_BOT_TOKEN.includes('DEMO_TOKEN')) {
      console.warn("⚠️ Usando TOKEN DE DEMO en Telegram. Configura el .env para envío real.");
      await new Promise(r => setTimeout(r, 1000));
      return { 
        success: true, 
        message: 'Simulación exitosa. Configura TELEGRAM_BOT_TOKEN para envío real.' 
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

    return { 
      success: true, 
      message: 'Alerta enviada correctamente al canal de Telegram de la comunidad.' 
    };
  } catch (error: any) {
    console.error('Error enviando a Telegram:', error);
    return { 
      success: false, 
      message: `Error de conexión: ${error.message}. Verifica el Token.` 
    };
  }
}
