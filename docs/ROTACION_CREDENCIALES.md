# Rotación de credenciales comprometidas

Tres credenciales estuvieron **hardcodeadas en código versionado**. Siguen en el
historial de git, así que borrarlas del archivo no basta: hay que **revocarlas**.

Mientras no se roten, cualquiera con acceso al repositorio (o a un clon antiguo)
puede usarlas.

---

## 1. API key de Gemini

| | |
|---|---|
| Dónde estaba | `src/ai/genkit.ts:9` |
| Commit | `28c8121` |
| Valor | `AIzaSyD4VA…u1loH0` |
| Riesgo | Consumo de cuota y facturación a tu cuenta de Google AI |

**Pasos**

1. Entra a <https://aistudio.google.com/app/apikey>.
2. Elimina la key comprometida.
3. Crea una nueva.
4. Ponla en `.env` como `GEMINI_API_KEY=…`.
5. En producción: guárdala en Secret Manager y referénciala desde `apphosting.yaml`.

> Nota: en `.env` había además `GEMINI_API_KEY_2` y `GEMINI_API_KEY_3` (esta última
> duplicada de la primera). Ninguna la leía el código. Revísalas y elimina las que
> no uses.

---

## 2. Token del bot de Telegram

| | |
|---|---|
| Dónde estaba | `src/app/actions/telegram.ts:10-11` |
| Valor | `8601841253:AAGWrX…3RQZk` |
| Riesgo | Control total del bot: leer y enviar mensajes suplantando a AgroTech |

**Pasos**

1. Abre [@BotFather](https://t.me/BotFather) en Telegram.
2. `/mybots` → selecciona el bot → **API Token** → **Revoke current token**.
3. Copia el token nuevo a `.env` como `TELEGRAM_BOT_TOKEN=…`.
4. `TELEGRAM_CHAT_ID` no es secreto, pero mantenlo también en `.env`.

---

## 3. Credencial del ESP32

| | |
|---|---|
| Dónde está | `esp-32-pio-wokwi-template/src/main.cpp:22` |
| Valor | `vFt985Fvvfmz7GZwnpM4btsMBnFnfvP32hrquZtw` |
| Riesgo | **El más grave.** No tiene formato de API key web (`AIza…`); parece un *Database Secret* legacy, que es acceso total de lectura y escritura al Realtime Database |

Además, el firmware usa:

```cpp
config.signer.test_mode = true;   // escribe SIN autenticación
```

Eso obliga a que las reglas del RTDB estén abiertas (`".write": true`), es decir:
**cualquiera en internet puede escribir en tu base de datos ahora mismo.**

**Pasos**

1. Firebase Console → **Configuración del proyecto** → **Cuentas de servicio** →
   **Secretos de base de datos** → revoca el secreto legacy.
2. Crea un usuario de servicio para el dispositivo:
   Authentication → Users → Add user (p. ej. `esp32@agrotech.local` + contraseña larga).
3. Copia su **UID** y sustitúyelo en `database.rules.json`, donde ahora dice
   `ESP32_AGROTECH_UID`.
4. Cambia el firmware a autenticación por email/contraseña (Fase 2):

```cpp
config.api_key = FIREBASE_WEB_API_KEY;   // la AIza… del proyecto
auth.user.email = DEVICE_EMAIL;
auth.user.password = DEVICE_PASSWORD;
// se elimina config.signer.test_mode
```

---

## Orden de despliegue (importante)

Las reglas nuevas **rechazan escrituras sin autenticar**. Si las despliegas antes
de actualizar el firmware, el ESP32 deja de publicar datos.

```
1. Crear el usuario de servicio y anotar su UID
2. Poner el UID en database.rules.json
3. Actualizar y flashear el firmware (Fase 2)
4. Recién entonces:  firebase deploy --only database,firestore:rules
```

Para desplegar las reglas de Firestore, que no dependen del ESP32, puedes ir antes:

```bash
firebase deploy --only firestore:rules
```

---

## ¿Y el historial de git?

Rotar es suficiente para cerrar el riesgo: una credencial revocada en el historial
ya no sirve. Limpiar el historial (`git filter-repo`) es opcional y **reescribe todos
los commits**, así que solo tiene sentido si el repositorio es privado y hay pocos
clones. No lo hagas sin coordinarlo con quien tenga copias.
