# Inventario Escritorio

Aplicación de escritorio (Electron + React + TypeScript) para gestión de inventario: productos, stock, ventas, compras, proveedores, clientes y reportes. Pensada para operar **local-first** — sigue funcionando sin conexión y sincroniza los cambios contra la API (`../api`) cuando hay red disponible.

## Funcionalidad

- **Productos**: alta/edición/baja (soft-delete) con imagen, SKU único, proveedor asociado.
- **Inventario**: movimientos de `ENTRADA`/`SALIDA`/`AJUSTE`, con el stock del producto siempre derivado del historial de movimientos (nunca se pisa a mano).
- **Ventas**: carrito con precio editable por ítem (descuentos), cálculo de total y descuento de stock automáticos.
- **Compras**: entrada de stock asociada a un proveedor.
- **Proveedores / Clientes**: CRUD con un registro "general" protegido contra borrado, para no obligar a cargar uno real antes de poder facturar.
- **Reportes**: alertas de stock bajo, resumen de ventas por período, productos más vendidos.
- **Usuarios y roles** (`ADMIN` / `VENDEDOR` / `ALMACEN`), gestionados contra la API.
- **Sincronización**: cola local (*outbox*) que registra cada cambio y lo reproduce contra la API cuando está disponible, con pantalla propia para ver pendientes/errores y forzar una sincronización manual.
- **Respaldos**: snapshot automático de los datos locales en cada arranque (se conservan los últimos 10), más respaldo y restauración manual desde la UI.

## Stack

| Área | Detalle |
| --- | --- |
| Shell | Electron 43 (`electron-vite` para el bundle de los tres procesos) |
| UI | React 19 + TypeScript, Ant Design + Tailwind CSS v4, `react-router-dom`, Zustand |
| Datos locales | JSON plano en `userData/data/` (sin SQLite ni dependencias de storage) |
| Backend | API REST propia (`../api`) — ver [Conexión con la API](#conexión-con-la-api) |
| Tests | Vitest (proceso `main` y `renderer`) |
| Empaquetado | `electron-builder` |

## Arquitectura

Los tres procesos de Electron, cada uno con su responsabilidad:

- **`src/main`**: dueño de los datos. Maneja el filesystem local, habla con la API (`src/main/api/`), aplica todas las reglas de negocio y expone todo por IPC. El renderer nunca toca el disco ni la red directamente.
- **`src/main/preload.ts`**: puente seguro (`contextBridge`) que expone `window.api` al renderer, tipado end-to-end.
- **`src/renderer`**: la UI. Solo llama a `window.api.*` — nunca a `fetch`/`axios` ni al filesystem.
- **`src/shared`**: tipos e IDs de canales IPC compartidos por los tres procesos.

## Requisitos

- Node.js 20+
- La API corriendo en local (o accesible por red) — ver [`../api/README.md`](../api/README.md)

## Arranque en desarrollo

```bash
npm install
npm run dev
```

Esto levanta la ventana de Electron con recarga en caliente del renderer. Con la API arriba (`docker compose up -d` + `npm run start:dev` en `../api`), ya se puede loguear:

```text
email:    admin@inventario.local
password: admin123
```

Sin la API disponible, la app sigue funcionando para todo lo que no requiera login (no hay modo "invitado": el login es contra la API, ver más abajo).

## Conexión con la API

El login, la gestión de usuarios y la sincronización de cambios hablan con la API real — no hay una base de usuarios local. La URL se configura con una variable de entorno (ver `.env.example`):

```bash
cp .env.example .env
```

| Variable | Default | Descripción |
| --- | --- | --- |
| `MAIN_VITE_API_URL` | `http://localhost:3000/api/v1` | URL base de la API |

**Cómo sincroniza**: cada alta/baja/edición se guarda primero en el disco local y se encola (`cambios_pendientes.json`). Desde `Ajustes → Sincronización y respaldos` se puede ver esa cola y forzar el envío contra la API — un cambio que falla queda marcado como `ERROR` con el motivo real (nunca se descarta ni se pierde) y se reintenta en la próxima sincronización. Esto permite seguir trabajando sin red y ponerse al día después.

## Scripts

```bash
npm run dev              # levanta la app en desarrollo
npm run build             # build de producción (out/)
npm run preview           # corre el build de producción

npm run typecheck         # tsc sobre main + renderer + tests
npm run test               # Vitest, una pasada
npm run test:watch         # Vitest en modo watch
npm run lint               # ESLint
npm run lint:fix
npm run format              # Prettier --write
npm run format:check

npm run dist               # empaqueta con electron-builder (plataforma actual)
npm run dist:win           # empaqueta para Windows
npm run dist:mac           # empaqueta para macOS
npm run dist:linux         # empaqueta para Linux
```

## Datos locales

En Windows, los datos y respaldos quedan fuera de la carpeta del proyecto:

```text
%APPDATA%/inventario-escritorio/data/*.json        # productos, ventas, movimientos, usuarios locales, cola de sync...
%APPDATA%/inventario-escritorio/backups/<timestamp>/  # snapshots automáticos y manuales
```

Para "resetear" la app (perder todos los datos locales), alcanza con borrar la carpeta `data/`.

## Tests

```bash
npm run test
```

Corren sobre Node/jsdom — no requieren la ventana de Electron. Cubren el proceso `main` (reglas de negocio, handlers IPC, cliente HTTP de la API) y el `renderer` (stores, servicios, hooks). Los flujos de UI end-to-end (Playwright) quedan como trabajo pendiente — ver `ESTADO.md`.

## Documentación adicional

- [`ESTADO.md`](./ESTADO.md) — historial detallado de decisiones y estado del proyecto módulo por módulo.
- [`ESQUEMA.md`](./ESQUEMA.md) / [`migracion-api-compatibilidad.md`](./migracion-api-compatibilidad.md) — modelo de datos y contrato de compatibilidad con la API.
