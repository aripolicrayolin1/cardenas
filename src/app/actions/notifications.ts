'use server';

/**
 * @fileOverview Envío de notificaciones por SMS y correo.
 *
 * ⚠️ NO IMPLEMENTADO. No hay ningún proveedor conectado.
 *
 * Antes esta acción hacía un `console.log`, esperaba dos segundos y devolvía
 * `success: true` con el mensaje "Correo de prueba enviado a …". La interfaz
 * anunciaba entonces un envío que nunca ocurrió, así que un agricultor podía
 * confiar en recibir un aviso de helada que jamás iba a llegar.
 *
 * Ahora devuelve `success: false` de forma explícita. Los canales que sí
 * funcionan son las notificaciones del navegador y el canal de Telegram
 * (`actions/telegram.ts`).
 *
 * Para implementarlo de verdad:
 *   - Correo: Resend o SMTP, con la clave en `config/env.ts`.
 *   - SMS: Twilio o similar. Ojo con el coste por mensaje en zonas rurales.
 */

export type ResultadoNotificacion = {
  success: boolean;
  message: string;
  /** `true` cuando el canal existe pero todavía no está conectado */
  noImplementado?: boolean;
};

export async function sendTestNotification(
  type: 'sms' | 'email',
  target: string,
  _userName: string
): Promise<ResultadoNotificacion> {
  console.warn(
    `[notificaciones] Se pidió enviar ${type} a "${target}", pero no hay proveedor configurado.`
  );

  return {
    success: false,
    noImplementado: true,
    message:
      type === 'email'
        ? 'El envío por correo todavía no está conectado a ningún proveedor.'
        : 'El envío por SMS todavía no está conectado a ningún proveedor.',
  };
}
