# Contrato de datos ESP32 ↔ aplicación

Dos repositorios comparten esta estructura. Si cambias un nombre de campo en uno,
cámbialo en el otro **y** en las reglas del RTDB, o la escritura será rechazada.

| Pieza | Archivo |
|---|---|
| Firmware | `esp-32-pio-wokwi-template/src/main.cpp` → `publicarEstado()` / `publicarHistorico()` |
| Aplicación | `cardenas/src/config/sensor-schema.ts` |
| Reglas | `cardenas/database.rules.json` |

---

## Un sensor o varios

El sistema admite **dos topologías**, y la app las soporta a la vez:

- **Un solo dispositivo (legacy).** El ESP32 escribe en los nodos planos
  `/sensores` y `/historico`. Una finca **sin** `deviceId` lee de aquí. Es lo que
  usa el prototipo actual; no hay que reprogramar nada.
- **Varios dispositivos.** Cada ESP32 tiene un identificador y escribe en
  `/dispositivos/<deviceId>/sensores` y `/dispositivos/<deviceId>/historico`, con
  la **misma estructura de campos** que se describe abajo. Una finca con el campo
  `deviceId` lee su propio sensor. Así cada parcela puede tener su hardware y el
  agricultor elige cuál ver desde el selector del panel.

Para migrar un dispositivo a multi-sensor: darle un `deviceId`, cambiar en el
firmware la ruta de publicación a `/dispositivos/<deviceId>/…`, y escribir ese
mismo id en el campo "ID del sensor" de la finca. Las reglas de
`database.rules.json` ya validan ambas rutas.

### Dos trampas al desplegar las reglas

1. **Las reglas de RTDB no heredan hacia arriba.** Conceder `.read` en
   `/dispositivos/$deviceId/sensores` NO permite leer `/dispositivos`. La página
   de Dispositivos escucha esa raíz para descubrir qué nodos existen, así que el
   `.read` va **en `/dispositivos`**. Con el permiso sólo en los hijos, la
   escucha falla con `permission_denied` aunque el despliegue diga "complete".

2. **Despliega los targets por separado.** `firebase deploy --only
   firestore:rules,database` ejecuta sólo el primero y **se salta el segundo en
   silencio**, terminando con "Deploy complete!". Usa dos comandos:
   `firebase deploy --only firestore:rules` y `firebase deploy --only database`.

---

## `/sensores` — última lectura (se sobrescribe)

Publicado cada **5 s** en una sola escritura JSON.

| Campo | Tipo | Rango | Origen |
|---|---|---|---|
| `temperatura` | float | °C | DHT22 (GPIO4) |
| `humedad_aire` | float | 0–100 % | DHT22 (GPIO4) |
| `humedad_suelo` | int | 0–4095 | ADC crudo (GPIO34) |
| `humedad_suelo_pct` | float | 0–100 % | normalizado en el ESP32 |
| `luz` | float | 0–100 % | fotorresistencia (GPIO35) |
| `punto_rocio` | float | °C | calculado (Magnus-Tetens) |
| `et` | float | mm/día | calculado (Hargreaves) |
| `movimiento` | bool | true/false | PIR HC-SR501 (GPIO27) |
| `estado` | string | 4 valores | lógica de control |

`estado` sólo puede ser: `SISTEMA NORMAL`, `RIEGO ACTIVO`, `ALERTA HUMEDAD`,
`ALERTA: RIESGO HELADA`.

`movimiento` es **opcional**: un dispositivo sin PIR simplemente no lo publica y
la app lo trata como `false`, sin marcarlo como incumplimiento del contrato.

El firmware sondea el PIR en **cada vuelta de `loop()`**, no en el ciclo de
sensores: el pulso del HC-SR501 dura unos segundos y muestrearlo sólo cada 2 s
podría perder una detección.

Además el aviso se **retiene 8 s** (`RETENCION_MOVIMIENTO_MS`) aunque el pin
vuelva a bajar, porque las publicaciones van cada 5 s y un movimiento entre dos
envíos no llegaría nunca a la aplicación. La ventana debe ser **mayor que
`INTERVALO_PUBLICACION`** para que toda detección se publique al menos una vez,
pero no mucho más: mientras sigue abierta el aviso ya está en alto, así que un
movimiento nuevo no genera flanco de subida y la app no lo cuenta como evento
aparte. Con 30 s había que esperar media vuelta de reloj para volver a probar.

## `/historico/<pushId>` — serie temporal

Publicado cada **60 s**. `ts` lo pone el servidor de Firebase (`.sv: timestamp`),
porque el ESP32 no tiene reloj fiable.

| Campo | Tipo | Significado |
|---|---|---|
| `ts` | int | epoch ms, puesto por el servidor |
| `t` | float | temperatura °C |
| `h` | float | humedad del aire % |
| `suelo_pct` | float | humedad de suelo % |
| `td` | float | punto de rocío °C |
| `et` | float | evapotranspiración mm/día |

---

## Cambios de la Fase 2

### `uv` no existía

La app leía `data.uv` y se lo pasaba a la IA como `uvRadiation`. **El firmware
nunca escribió ese campo**: el valor era siempre `0`.

La fotorresistencia sí estaba en el diagrama de Wokwi, pero:

- cableada a **GPIO34, el mismo pin que el potenciómetro** (dos fuentes en una
  entrada ADC),
- con un puente `esp:35 → esp:34` sin función,
- y el firmware no leía ninguno de los dos pines para luz.

Ahora el LDR usa su salida analógica en GPIO35 y publica `luz`. Se llama `luz` y
no `uv` porque un LDR mide **luz visible**, no radiación ultravioleta.

### Una escritura en vez de seis

Antes: seis `Firebase.setFloat` cada 2 s = **180 escrituras/minuto** (~260 000 al
día). Ahora: una `setJSON` cada 5 s + una `pushJSON` cada 60 s = **13
escrituras/minuto**. Unas 14 veces menos.

Los tres ritmos están separados para que el relé y los LEDs sigan respondiendo
cada 2 s aunque se publique menos a menudo.

### Umbral de riego corregido

El firmware regaba con `suelo < 800` (ADC) y la app diagnosticaba sequía con
`suelo < 600`. Ahora ambos usan **porcentaje**: `UMBRAL_RIEGO_PCT 20.0f` en el
firmware y `HUMEDAD_SUELO_PCT.RIEGO` en `config/constants.ts`.

### Resistencia del LED azul

`r4` valía **220 kΩ**, mil veces más de lo debido. El LED de alerta de helada
quedaba prácticamente apagado. Corregido a 220 Ω.

### Credenciales fuera del código

Estaban escritas en `main.cpp`. Ahora viven en `include/secrets.h`, que está en
`.gitignore`, con `include/secrets.example.h` como plantilla versionada.

---

## Historia (ya resuelto)

- **La app ya lee `/historico`.** Las pestañas "Hoy" y "Semana" de `monitoring`
  consumen la serie real de `/historico` vía `useHistorico` → `listarHistorico`.
  El dashboard también grafica la humedad de suelo real de la última semana. Ya
  no queda generación sintética con `Math.sin()`/`Math.random()`.

## Pendiente

1. **El dispositivo sigue escribiendo sin autenticar** (`USAR_MODO_PRUEBA` en
   `secrets.h`). Hasta que se cree el usuario de servicio, las reglas del RTDB
   deben seguir abiertas. Ver `docs/ROTACION_CREDENCIALES.md`.

2. **Sensor capacitivo real.** `sueloAPorcentaje()` asume escala directa, que es
   lo que hace el potenciómetro del simulador. Un sensor capacitivo real es
   inverso (más agua → lectura más baja) y habrá que devolver `100 - pct`.
