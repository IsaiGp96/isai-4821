# Carrera de caracoles.

Aplicación web con temática de apuestas en carreras de caracoles. El usuario se registra, inicia sesión, consulta un dashboard con datos simulados y carga saldo mediante SnailPay, una pasarela de pagos simulada.

Aplicación desplegada: https://isai-4821-j18g.vercel.app. No requiere credenciales: basta con registrarse. Las tarjetas de prueba están en la sección [Escenarios](#escenarios).

## Stack.

- Frontend: React con TypeScript y Vite.
- Backend: Express con TypeScript.
- Persistencia: LocalStorage para usuarios, sesión, saldo y recargas.
- Interfaz: Tailwind CSS y componentes de shadcn/ui.
- Rutas: React Router.
- Gráficas: Recharts.
- Pruebas: Vitest en frontend y backend.

## Funcionalidades.

### Registro e inicio de sesión.

- Registro con nombre completo, correo, contraseña y confirmación de contraseña.
- Inicio y cierre de sesión.
- La información se conserva después de recargar la página.
- El dashboard solo es accesible con una sesión activa.
- El usuario inicia con saldo de $0.
- La contraseña nunca se guarda en texto plano. Se deriva con PBKDF2-SHA256 (600,000 iteraciones) y una sal aleatoria por usuario, usando Web Crypto.
- Se pueden registrar varios usuarios. El correo es único y no distingue mayúsculas.

### Dashboard.

- Nombre del usuario y saldo actual.
- Gráfica tipo donut con apuestas ganadas y perdidas.
- Gráfica de barras con las victorias de 6 caracoles en un día de 6 carreras.
- Opción para cargar saldo con SnailPay.
- Historial de las últimas 5 recargas, incluidas las rechazadas.
- Opción para cerrar sesión.

Los datos de apuestas y carreras son simulados. No hay sección para apostar ni lógica para ejecutar carreras.

Reglas de la simulación:

- Cada carrera tiene un ganador. Las victorias de los 6 caracoles siempre suman 6.
- El usuario hace una apuesta por carrera. Gana si apostó al caracol ganador. Ganadas y perdidas siempre suman 6.
- Las dos gráficas salen de las mismas carreras, así que siempre son congruentes.
- Los datos se generan con una semilla (usuario y fecha local). No cambian al recargar la página, pero sí de un día a otro.

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
| `reference` | `SP-AAAAMMDD-XXXXXX`. La fecha es la de `date_created`, en UTC. |
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

Para reproducir cada escenario desde la interfaz: iniciar sesión, presionar "Cargar saldo" y usar los datos de la tabla. Para los campos que la tabla no menciona, usar `12/26`, `543`, cualquier nombre y un monto como `100`.

El monto máximo de $10,000 por recarga es una decisión de diseño. Evita recargas accidentales muy grandes y permite probar el rechazo por límite. El formulario lo muestra debajo del campo de monto.

#### Error del sistema.

Hay dos formas de simularlo:

- Desde la interfaz: usar la tarjeta `9999999999999999`.
- Desde el servidor: iniciar el backend con `SNAILPAY_SYSTEM_FAILURE=true`. Todas las solicitudes responden `503`, incluso con la tarjeta aprobada.

En ambos casos no se genera `authorization_code` y no se aplica ninguna recarga.

#### Timeout.

La tarjeta `4000000000000408` tarda 10 segundos en responder. Sirve para probar que el frontend corta la petición y avisa al usuario. Si la respuesta llega tarde, es un error: nunca aprueba un cobro.

El frontend cancela la petición a los 5 segundos. Muestra que SnailPay no respondió a tiempo y no aplica ninguna recarga. El timeout no se guarda en el historial porque no hay respuesta de SnailPay.

#### Manejo en el frontend.

| Resultado | Saldo | Historial | Mensaje |
|---|---|---|---|
| Aprobado | Aumenta. | Se guarda. | "Recarga aprobada" y el mensaje de SnailPay. |
| Rechazado o error del sistema | No cambia. | Se guarda. | El `message` de SnailPay. |
| Timeout | No cambia. | No se guarda. | SnailPay tardó demasiado en responder. |
| Sin conexión con el backend | No cambia. | No se guarda. | No se pudo conectar con SnailPay. |
| Respuesta con formato inválido | No cambia. | No se guarda. | SnailPay respondió con datos inesperados. |

Una aprobación solo suma al saldo si el `payer_id` y el monto coinciden con la petición. Así una respuesta equivocada nunca genera un cobro exitoso falso.

#### Datos en LocalStorage.

| Clave | Contenido |
|---|---|
| `snailrace.users` | Lista de usuarios con hash y sal de la contraseña, y saldo. |
| `snailrace.session` | Id del usuario con sesión y fecha de inicio. |
| `snailrace.recharges` | Respuestas de SnailPay, con número de tarjeta y CVV ficticios. |

Lo que se lee de LocalStorage se valida antes de usarse. Si los datos están corruptos se tratan como inexistentes.

#### Otros errores.

| Caso | HTTP | error |
|---|---|---|
| Body que no es JSON válido | 400 | invalid_json |
| Ruta inexistente | 404 | not_found |
| Error inesperado del servidor | 500 | internal_error |

## Estructura.

Un solo repositorio con frontend y backend.

```
frontend
|- src
|  |- components   Piezas de la interfaz: gráficas, tarjetas, rutas protegidas.
|  |  |- ui        Componentes generados con shadcn/ui.
|  |- views        Pantallas: login, registro y dashboard.
|  |- forms        Formularios de login, registro y recarga.
|  |- config       Rutas, URL del API, reglas de la simulación y claves de LocalStorage.
|  |- services     Lógica: autenticación, contraseñas, SnailPay, recargas, simulación y almacenamiento.
|  |- types        Tipos compartidos.
|  |- lib          Validadores, formatos y utilidades.
|- tests

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

En el frontend, las vistas no tienen lógica de negocio: llaman a los servicios. Los tipos de SnailPay se importan del backend con `import type`, así frontend y API no se desincronizan.

## Ejecución.

Requisitos: Node.js 22.22.2 o mayor (o 24.15 o mayor) y npm.

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

### Frontend.

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`. El puerto es fijo porque el backend solo acepta peticiones de ese origen.

El registro, el login y las gráficas funcionan sin el backend. La carga de saldo necesita el backend encendido.

Variables de entorno opcionales:

| Variable | Valor por defecto | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | URL del backend. |

### Pruebas.

```bash
cd backend
npm test

cd ../frontend
npm test
```

Backend:

- `tests/snailpay.logic.test.ts`: lógica de cobro, validaciones y mensajes.
- `tests/snailpay.routes.test.ts`: ruta HTTP, códigos de respuesta, error del sistema, timeout, errores de la API y punto de entrada para Vercel.

Frontend:

- `tests/storage.service.test.ts`: lectura y escritura en LocalStorage, lista de usuarios, datos inexistentes, datos corruptos y errores del navegador.
- `tests/password.service.test.ts`: derivación con PBKDF2, sal distinta por contraseña y verificación.
- `tests/auth.service.test.ts`: registro, validaciones, correo repetido, inicio y cierre de sesión, y sesión de un usuario inexistente.
- `tests/routes.test.tsx`: redirecciones de la ruta protegida y de las rutas de invitado.
- `tests/race.service.test.ts`: reglas del día simulado y semilla.
- `tests/snailpay.service.test.ts`: respuestas de SnailPay, timeout, falta de conexión y respuestas inválidas.
- `tests/recharge.service.test.ts`: cambios de saldo, historial, decimales y aprobaciones que no corresponden a la petición.

Otros comandos del frontend: `npm run lint` y `npm run build`.

## Despliegue.

La aplicación está en Vercel, en dos proyectos creados desde este mismo repositorio.

| Proyecto | Root Directory | URL |
|---|---|---|
| Frontend | `frontend` | https://isai-4821-j18g.vercel.app |
| Backend | `backend` | https://isai-4821.vercel.app |

Para confirmar que el backend responde: https://isai-4821.vercel.app/health.

### Frontend.

- Vercel lo detecta como proyecto de Vite. Ejecuta `npm run build` y publica la carpeta `dist`.
- `frontend/vercel.json` redirige todas las rutas a `index.html`. Sin esto, recargar la página en `/dashboard` da 404, porque las rutas las resuelve React Router en el navegador.
- Variable de entorno: `VITE_API_URL` con la URL del backend, sin `/` al final. Se lee al compilar, así que si cambia hay que volver a desplegar.

### Backend.

- Vercel detecta Express sin configuración extra y convierte la app en una sola función serverless.
- Vercel toma `src/app.ts` como punto de entrada y usa la app que exporta por defecto. En local se sigue usando `src/server.ts`.
- `tsconfig.json` fija `typeRoots`. Vercel compila desde otra carpeta y sin esa ruta no encuentra los tipos de Node.
- Variable de entorno: `CORS_ORIGIN` con la URL del frontend, sin `/` al final. Después de cambiarla hay que volver a desplegar.
- La tarjeta de timeout responde a los 10 segundos. El límite de una función en el plan gratuito es de 300 segundos, así que no se corta.

### Limitaciones.

- Los datos viven en el LocalStorage de cada navegador. Cada persona se registra en su propio navegador y no ve las cuentas de otros.
- CORS solo acepta el dominio de producción del frontend. Las URL de preview de Vercel no pueden hacer recargas.
- El primer request después de un rato sin uso puede tardar un poco más, mientras la función arranca.
- El error del sistema por variable de entorno (`SNAILPAY_SYSTEM_FAILURE`) no está activo en producción. Se prueba con la tarjeta `9999999999999999`.

## Propuesta de base de datos.

La aplicación no usa base de datos. La propuesta para conectarla, con el diagrama de tablas y relaciones, está en [`docs/diagrama.md`](docs/diagrama.md).

## Ruta de trabajo.

Modelo de datos -> vista -> persistencia en LocalStorage -> pruebas. Definir primero los datos evita rehacer vistas cuando cambia la estructura.
