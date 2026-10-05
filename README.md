# TaskFlow Web

[![CI](https://github.com/jose28gena/TaskFlow-Web/actions/workflows/ci.yml/badge.svg)](https://github.com/jose28gena/TaskFlow-Web/actions/workflows/ci.yml)
![Angular 19](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

Frontend en **Angular 19** para [TaskFlow API](https://github.com/jose28gena/TaskFlow): registro e inicio de sesión con JWT y un gestor de tareas con filtro por estado y paginación.

Está pensado para mostrar un frontend de producción en pequeño: componentes standalone con **signals**, interceptor y guard de autenticación, rutas con carga diferida, formularios reactivos, manejo de errores del backend, accesibilidad, modo oscuro y **45 tests (≈ 98 % de líneas cubiertas)**.

## Funcionalidades

- Registro, login y cierre de sesión; la sesión se restaura al recargar y se descarta al vencer el token.
- Crear tareas, cambiar su estado (`Por hacer` / `En progreso` / `Hecha`) y eliminarlas con confirmación en dos pasos.
- Filtro por estado y paginación (el backend pagina; el cliente nunca descarga todo).
- Mensajes de error comprensibles a partir de la respuesta de la API (validación, conflicto, caída del servidor, sin conexión).
- Interfaz responsive, con tema claro/oscuro según el sistema y controles accesibles por teclado (etiquetas, `aria-live`, `aria-pressed`, foco visible).

## Arquitectura

```
src/app/
├── core/
│   ├── auth.service.ts       # Sesión (signal), login/registro, persistencia tolerante a fallos
│   ├── auth.interceptor.ts   # Adjunta el Bearer solo a /api (salvo /api/auth), cierra sesión ante 401
│   ├── auth.guard.ts         # Protege /tasks
│   ├── tasks.service.ts      # Cliente HTTP de tareas
│   ├── api-error.ts          # ProblemDetails / errores de validación → mensaje legible
│   └── models.ts, config.ts
├── features/
│   ├── login/                # Login y registro en un solo formulario
│   └── tasks/                # Tablero de tareas
└── app.component.ts          # Shell: cabecera con la sesión y <router-outlet>
```

Decisiones relevantes:

- **Standalone + signals**: sin NgModules; el estado de la vista vive en señales y `computed`.
- **El token no se filtra**: el interceptor lo agrega únicamente a rutas bajo `/api` y nunca a login/registro ni a dominios externos (hay tests que lo verifican).
- **401 distinto según contexto**: un 401 en una llamada autenticada cierra la sesión; un 401 en el login solo muestra "credenciales inválidas".
- **Errores 5xx sin detalles internos**: la UI muestra un mensaje genérico aunque el servidor envíe un detalle.
- **API relativa (`/api`)**: en desarrollo `ng serve` la redirige al backend con `proxy.conf.json`, sin necesidad de CORS; en producción debe servirse desde el mismo origen (reverse proxy).

## Ejecutar en local

Requisitos: Node 20+ y el [.NET 8 SDK](https://dotnet.microsoft.com/download).

**1. Levanta la API** (en el repositorio [TaskFlow](https://github.com/jose28gena/TaskFlow)):

```powershell
# PowerShell
$env:Jwt__Key = "una-clave-larga-y-aleatoria-de-al-menos-32-caracteres"
dotnet run --project src/TaskFlow.Api --urls http://localhost:5000
```

**2. Levanta el frontend:**

```bash
npm install
npm start
# http://localhost:4200
```

Si tu API corre en otro puerto, ajusta `proxy.conf.json`.

## Tests

```bash
npm test            # modo interactivo (Chrome)
npm run test:ci     # headless + cobertura, como en CI
```

| Qué se prueba | Cómo |
| --- | --- |
| `AuthService` | Guarda/restaura/borra sesión, token vencido, almacenamiento corrupto |
| `authInterceptor` | Cabecera solo a `/api`, sin token a login ni a terceros, manejo de 401 |
| `authGuard` | Acceso con sesión y redirección a `/login` |
| `TasksService` | Método, URL, parámetros y cuerpo de cada petición |
| `describeError` | Validación, `ProblemDetails`, 401, 5xx sin detalles, sin conexión |
| `LoginComponent` | Validación, éxito, error del servidor, cambio a registro |
| `TasksComponent` | Carga, vacío, crear, validar, filtrar, cambiar estado, confirmar borrado, errores, paginación |

## Límites conocidos

- **El token se guarda en `localStorage`**: simple, pero expuesto a XSS. En producción preferiría una cookie `httpOnly` emitida por el backend.
- No hay edición del título/descripción ni fechas de vencimiento en la interfaz (la API ya las soporta).
- No incluye pruebas end-to-end con navegador; el contrato con la API real se verificó a mano (registro, CRUD, filtros y 401) a través del proxy de desarrollo.

## Licencia

MIT. Consulta [LICENSE](LICENSE).
