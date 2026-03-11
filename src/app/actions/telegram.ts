'use server';

/**
 * @fileOverview Acción de servidor para enviar alertas REALES a Telegram.
 * Conecta con la API de Telegram para notificar a la comunidad de agricultores.
 * Configurado con las credenciales finales de AgroTech Hidalgo.
 */

// Credenciales Reales proporcionadas por el usuario
const TELEGRAM_BOT_TOKEN = '8601841253:AAGWrXIvXb8zEPOuhiOcCF8y2RAVMd3RQZk'; 
const TELEGRAM_CHAT_ID = '6816381218';

export async function sendTelegramAlert(data: {
  problem: string;
  region: string;
  severity: string;
  distance: string;
  description: string;
}) {
  console.log(`[TELEGRAM REAL] Iniciando envío de alerta: ${data.problem}`);

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
      console.error('Error API Telegram:', result);
      throw new Error(result.description || 'Error en la API de Telegram');
    }

    return { 
      success: true, 
      message: 'Alerta enviada correctamente al canal real de Telegram.' 
    };
  } catch (error: any) {
    console.error('Error enviando a Telegram:', error);
    return { 
      success: false, 
      message: `Error de conexión: ${error.message}. Verifica el Token.` 
    };
  }
}
