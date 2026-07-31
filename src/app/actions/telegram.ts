'use server';

import { tryGetServerEnv } from '@/config/env';

/**
 * @fileOverview Acción de servidor para enviar alertas REALES a Telegram.
 * Conecta con la API de Telegram para notificar a la comunidad de agricultores.
 *
 * Credenciales: se leen de TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID (ver .env.example).
 * Nunca deben hardcodearse aquí: este archivo se versiona.
 */

export async function sendTelegramAlert(data: {
  problem: string;
  region: string;
  severity: string;
  distance: string;
  description: string;
}) {
  const env = tryGetServerEnv();

  if (!env) {
    console.error('[telegram] Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID.');
    return {
      success: false,
      message: 'El canal de alertas no está configurado. Avisa al administrador.',
    };
  }

  const { botToken, chatId } = env.telegram;

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
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
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
