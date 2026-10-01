# Carrera de caracoles.

Aplicación web con temática de apuestas en carreras de caracoles. El usuario se registra, inicia sesión, consulta un dashboard con datos simulados y carga saldo mediante SnailPay, una pasarela de pagos simulada.

> Proyecto en desarrollo. Este documento se actualiza conforme avanza el trabajo.

## Stack.

- Frontend: React con TypeScript.
- Backend: Express con TypeScript.
- Persistencia: LocalStorage para usuario, sesión y saldo.

## Funcionalidades.

### Registro e inicio de sesión.

- Registro con nombre completo, correo, contraseña y confirmación de contraseña.
- Inicio y cierre de sesión.
- La información se conserva después de recargar la página.
- El dashboard solo es accesible con una sesión activa.
- El usuario inicia con saldo de $0.

### Dashboard.

- Nombre del usuario y saldo actual.
- Gráfica tipo donut con apuestas ganadas y perdidas.
- Gráfica de barras con las victorias de 6 caracoles en un día de 6 carreras.
- Opción para cargar saldo con SnailPay.
- Opción para cerrar sesión.

Los datos de apuestas y carreras son simulados. No hay sección para apostar ni lógica para ejecutar carreras.

### SnailPay.

Servicio simulado en Express. No se conecta a servicios reales ni procesa información financiera real. Contempla tres resultados:

- Cobro exitoso: el saldo aumenta y se guarda en LocalStorage.
- Error en la transacción: el saldo no cambia y el usuario recibe un mensaje claro.
- Error del sistema: SnailPay no procesa solicitudes y no se aplica ninguna recarga.

#### Endpoint.

`POST /api/snailpay/charges` con body JSON:

| Campo | Tipo | Formato |
|---|---|---|
| `card_number` | texto | 16 dígitos. |
| `expiration_date` | texto | MM/AA. |
| `cvv` | texto | 3 dígitos. |
| `cardholder_name` | texto | No vacío. |
| `amount` | número | Mayor que 0, máximo 2 decimales y hasta $10,000. |
| `payer_id` | texto | No vacío. |
| `payer_email` | texto | Correo válido. |

#### Respuesta.

| Campo | Formato |
|---|---|
| `id` | UUID. |
| `status` | `approved`, `rejected` o `error`. |
| `status_detail` | Detalle del resultado. Ver escenarios. |
| `message` | Texto en español para mostrar al usuario. |
| `transaction_amount` | Monto solicitado. |
| `date_created` | ISO 8601 en UTC. |
| `authorization_code` | 6 dígitos. Solo en operaciones aprobadas, en otro caso `null`. |
| `reference` | `SP-AAAAMMDD-XXXXXX`. |
| `payer_id`, `payer_email` | Datos del usuario. |
| `card_number`, `cvv` | Datos ficticios de la tarjeta. |

Códigos HTTP: `200` aprobado, `422` rechazado y `503` error del sistema.

#### Escenarios.

| Datos | status | status_detail |
|---|---|---|
| `1234123412341234`, `12/26`, `543` | approved | accredited |
| Misma tarjeta con otra fecha o CVV | rejected | cvv_mismatch |
| `4000000000009995` | rejected | insufficient_funds |
| Otra tarjeta de 16 dígitos | rejected | card_declined |
| `9999999999999999` | error | service_unavailable |
| `4000000000000408` | error | service_unavailable (responde después de 10 segundos) |
| Tarjeta sin 16 dígitos | rejected | invalid_card_number |
| Fecha sin formato MM/AA | rejected | invalid_expiration_date |
| CVV sin 3 dígitos | rejected | invalid_cvv |
| Nombre vacío | rejected | invalid_cardholder_name |
| Monto ≤ 0 o con más de 2 decimales | rejected | invalid_amount |
| Monto mayor a $10,000 | rejected | amount_exceeds_limit |
| Usuario sin id o correo válido | rejected | invalid_payer |

Orden de revisión: primero el error del sistema, después las validaciones de formato en el orden de la tabla y al final el resultado de la tarjeta. Se devuelve el primer error encontrado.

#### Error del sistema.

Hay dos formas de simularlo:

- Desde la interfaz: usar la tarjeta `9999999999999999`.
- Desde el servidor: iniciar el backend con `SNAILPAY_SYSTEM_FAILURE=true`. Todas las solicitudes responden `503`, incluso con la tarjeta aprobada.

En ambos casos no se genera `authorization_code` y no se aplica ninguna recarga.

#### Timeout.

La tarjeta `4000000000000408` tarda 10 segundos en responder. Sirve para probar que el frontend corta la petición y avisa al usuario. Si la respuesta llega tarde, es un error: nunca aprueba un cobro.

#### Otros errores.

| Caso | HTTP | error |
|---|---|---|
| Body que no es JSON válido | 400 | invalid_json |
| Ruta inexistente | 404 | not_found |
| Error inesperado del servidor | 500 | internal_error |

## Estructura.

Un solo repositorio con frontend y backend.

```
frontend/src
|- components
|- views
|- forms
|- config
|- services

backend
|- src
|  |- config
|  |- api
|     |- snailpay.routes.ts
|     |- snailpay.logic.ts
|     |- snailpay.types.ts
|- tests
```

La ruta y la lógica de SnailPay están separadas. Esto permite probar la lógica sin levantar el servidor.

## Ejecución.

Requisitos: Node.js 22.12 o mayor y npm.

### Backend.

```bash
cd backend
npm install
npm run dev
```

El servidor queda en `http://localhost:3000`. Para confirmar que responde: `GET /health`.

Variables de entorno opcionales:

| Variable | Valor por defecto | Uso |
|---|---|---|
| `PORT` | `3000` | Puerto del servidor. |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen permitido del frontend. |
| `SNAILPAY_SYSTEM_FAILURE` | `false` | Con `true` simula el error del sistema. |

Iniciar con el error del sistema activo:

```bash
# Bash
SNAILPAY_SYSTEM_FAILURE=true npm run dev
```

```powershell
# PowerShell
$env:SNAILPAY_SYSTEM_FAILURE="true"; npm run dev
```

### Pruebas.

```bash
cd backend
npm test
```

- `tests/snailpay.logic.test.ts`: lógica de cobro, validaciones y mensajes.
- `tests/snailpay.routes.test.ts`: ruta HTTP, códigos de respuesta, error del sistema, timeout y errores de la API.

### Frontend.

Pendiente.

## Ruta de trabajo.

Modelo de datos -> vista -> persistencia en LocalStorage -> pruebas. Definir primero los datos evita rehacer vistas cuando cambia la estructura.

