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

Los datos para reproducir cada respuesta se documentarán en esta sección.

## Estructura.

Un solo repositorio con frontend y backend.

```
frontend/src
|- components
|- views
|- forms
|- config
|- services

backend/src
|- config
|- api
   |- snailpay.routes.ts
   |- snailpay.logic.ts
```

La ruta y la lógica de SnailPay están separadas. Esto permite probar la lógica sin levantar el servidor.

## Ruta de trabajo.

Modelo de datos -> vista -> persistencia en LocalStorage -> pruebas. Definir primero los datos evita rehacer vistas cuando cambia la estructura.

