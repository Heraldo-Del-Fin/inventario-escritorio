# Propuesta de arquitectura — API (NestJS + PostgreSQL)

> Complementa `ESQUEMA.md` (modelo de datos actual del desktop) y `migracion-api-compatibilidad.md` (reglas de compatibilidad). Este documento es la propuesta concreta de cómo estructurar el backend: módulos NestJS, entidades de Postgres y endpoints. Es un punto de partida para discutir, no una decisión cerrada.

---

## 1. Stack y decisiones base

| Decisión | Elección | Por qué |
|---|---|---|
| Framework | NestJS | Ya asumido en `migracion-api-compatibilidad.md`; su sistema de módulos/DTOs/guards encaja bien con "un módulo por entidad" que ya tenemos calcado del desktop. |
| Estilo de API | REST, un recurso por entidad | Ver análisis previo — encaja mejor que GraphQL con el patrón de outbox/reintentos que ya existe. |
| ORM | TypeORM | Mapea 1:1 con el patrón `@Entity`/repositorio de NestJS, soporta bien `uuid` como PK asignada por el cliente (no autogenerada) y transacciones explícitas, que acá son necesarias (ver §5). Prisma es la otra opción razonable si se prefiere su DX; no cambia nada del resto de este documento. |
| Base de datos | PostgreSQL | Tipos nativos `uuid`, `jsonb` si hace falta, buen soporte de transacciones — sin necesidad real de nada más especializado para este volumen de datos. |
| Auth | JWT (access + refresh) | Ver §7. Implementa la "Opción A" ya recomendada (API como fuente de verdad de usuarios). |
| Validación | `class-validator` + `class-transformer` sobre DTOs | Estándar de NestJS, permite que el DTO documente la regla (`@IsUUID()`, `@Min(0)`, etc.) en vez de dejarla implícita como hoy en el IPC local. |
| Versionado | Prefijo `/api/v1` | Para poder evolucionar el contrato sin romper al desktop mientras conviven versiones. |

**Regla de nombres (heredada de `migracion-api-compatibilidad.md`):** las clases `@Entity()` de TypeORM y los DTOs de respuesta usan **los mismos nombres de campo en español y camelCase** que `ESQUEMA.md` (`sku`, `creadoEn`, `stockMinimo`). Las columnas de Postgres sí pueden usar `snake_case` (`stock_minimo`) porque es la convención del motor — TypeORM traduce eso automáticamente y el JSON que sale por HTTP nunca expone el nombre de columna, solo el nombre de la propiedad de la entidad. Esto no viola la regla de compatibilidad: la regla protege el **contrato con el cliente**, no el detalle interno de storage.

---

## 2. Estructura de módulos

```
src/
├── common/
│   ├── errores/
│   │   ├── codigo-error.enum.ts        # calcado del enum ya definido en migracion-api-compatibilidad.md
│   │   ├── app-exception.ts             # excepción base con { codigo, mensaje }
│   │   └── http-exception.filter.ts     # filtro global -> siempre responde { codigo, mensaje }
│   ├── decorators/
│   │   └── roles.decorator.ts           # @Roles('ADMIN')
│   └── guards/
│       ├── jwt-auth.guard.ts
│       └── roles.guard.ts
├── database/
│   └── database.module.ts               # TypeOrmModule.forRootAsync + config por env
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts               # POST /auth/login, POST /auth/refresh
│   ├── auth.service.ts
│   ├── strategies/jwt.strategy.ts
│   └── dto/login.dto.ts
├── usuarios/
│   ├── usuarios.module.ts
│   ├── usuarios.controller.ts
│   ├── usuarios.service.ts
│   ├── usuario.entity.ts
│   └── dto/{crear,actualizar}-usuario.dto.ts
├── productos/
│   ├── productos.module.ts
│   ├── productos.controller.ts
│   ├── productos.service.ts
│   ├── producto.entity.ts
│   └── dto/{crear,actualizar}-producto.dto.ts   # actualizar-producto.dto NO incluye `stock`
├── inventario/
│   ├── inventario.module.ts
│   ├── inventario.controller.ts
│   ├── inventario.service.ts             # registrarMovimiento() vive acá, igual que stock.ts hoy
│   ├── movimiento.entity.ts
│   └── dto/crear-movimiento.dto.ts
├── ventas/
│   ├── ventas.module.ts
│   ├── ventas.controller.ts
│   ├── ventas.service.ts                 # depende de InventarioService (genera SALIDA), igual que hoy
│   ├── venta.entity.ts
│   ├── item-venta.entity.ts
│   └── dto/crear-venta.dto.ts
├── compras/
│   ├── compras.module.ts
│   ├── compras.controller.ts
│   ├── compras.service.ts                # depende de InventarioService (genera ENTRADA)
│   ├── orden-compra.entity.ts
│   ├── item-compra.entity.ts
│   └── dto/crear-compra.dto.ts
├── proveedores/  (mismo patrón que clientes)
├── clientes/     (mismo patrón que proveedores)
└── main.ts
```

**Dependencias entre módulos** (importa para el orden de implementación): `Inventario` depende de `Productos` (para leer/actualizar stock); `Ventas` y `Compras` dependen de `Inventario` y `Productos`. `Auth`/`Usuarios` son independientes del resto. Conviene construir en ese orden: Common → Database → Usuarios/Auth → Productos → Inventario → Ventas/Compras → Proveedores/Clientes.

---

## 3. Entidades de PostgreSQL

### `usuarios`

```sql
CREATE TABLE usuarios (
  id             UUID PRIMARY KEY,              -- asignado por el cliente al crear
  nombre         VARCHAR(200) NOT NULL,
  email          CITEXT NOT NULL UNIQUE,        -- CITEXT = unicidad case-insensitive nativa (extensión citext)
  password_hash  VARCHAR(255) NOT NULL,
  rol            VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN','VENDEDOR','ALMACEN')),
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
- `password_hash`: recomiendo `argon2id` (paquete `argon2`) en vez de reusar `scrypt` — es el estándar actual para APIs Node/NestJS y ya viene con parámetros por defecto razonables. Es una decisión independiente del desktop (que puede seguir usando `scrypt` para su caché local offline, ver `migracion-api-compatibilidad.md` §6).
- `email` nunca se expone en un JOIN público sin roles — solo el propio usuario o un ADMIN puede leer la lista completa (`GET /usuarios` protegido con `@Roles('ADMIN')`).

### `proveedores` / `clientes`

```sql
CREATE TABLE proveedores (
  id          UUID PRIMARY KEY,
  nombre      VARCHAR(200) NOT NULL,
  contacto    VARCHAR(200),
  telefono    VARCHAR(50),
  email       VARCHAR(200),
  es_general  BOOLEAN NOT NULL DEFAULT false
);
-- clientes: igual, sin "contacto"
```
- Solo puede existir **una fila** con `es_general = true` por tabla — se impone con un índice único parcial:
  ```sql
  CREATE UNIQUE INDEX proveedores_general_unico ON proveedores (es_general) WHERE es_general = true;
  ```
  Esto traslada a nivel de base de datos algo que hoy el IPC local garantiza "a mano" (revisando si ya existe antes de sembrar).

### `productos`

```sql
CREATE TABLE productos (
  id              UUID PRIMARY KEY,
  sku             CITEXT NOT NULL UNIQUE,
  nombre          VARCHAR(200) NOT NULL,
  descripcion     TEXT,
  precio          NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
  stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo    INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  proveedor_id    UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  imagen_url      TEXT,                          -- ver nota abajo
  creado_en       TIMESTAMPTZ NOT NULL,
  actualizado_en  TIMESTAMPTZ NOT NULL
);
CREATE INDEX productos_proveedor_idx ON productos (proveedor_id);
```
- **`imagen_url` como `TEXT` (base64 embebido) mantiene paridad exacta con el desktop hoy** — es la opción más simple para v1 y evita introducir un flujo de subida de archivos/S3 en el primer corte. Trade-off consciente: `TEXT`/base64 en Postgres es más pesado que un blob storage real; si el catálogo de productos crece mucho o las imágenes empiezan a pesar, vale la pena migrar a un bucket (S3-compatible) y que `imagenUrl` pase a ser una URL real en vez de un data URL — pero **no es necesario para tener paridad con la v1 del desktop**, se puede posponer.
- `precio >= 0` y los `CHECK` en general son la validación "de última línea" — la validación real y con mensajes de error legibles sigue viviendo en el DTO/service (ver §6), la constraint de SQL es solo la red de seguridad final.
- **`stock` no tiene columna propia de "solo lectura a nivel DB"** — Postgres no distingue eso, la protección vive en el DTO de actualización (ver §4) y en que el único service que hace `UPDATE productos SET stock = ...` es `InventarioService`, nunca `ProductosService`.

### `movimientos_inventario`

```sql
CREATE TABLE movimientos_inventario (
  id           UUID PRIMARY KEY,
  producto_id  UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  tipo         VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA','SALIDA','AJUSTE')),
  cantidad     INTEGER NOT NULL,
  motivo       VARCHAR(300),
  usuario_id   UUID REFERENCES usuarios(id) ON DELETE SET NULL,  -- NUEVO respecto al desktop, ver nota
  creado_en    TIMESTAMPTZ NOT NULL
);
CREATE INDEX movimientos_producto_idx ON movimientos_inventario (producto_id);
CREATE INDEX movimientos_creado_en_idx ON movimientos_inventario (creado_en);
```
- **`ON DELETE RESTRICT` en `producto_id`**: a diferencia del desktop (que permite borrar un producto y deja movimientos/ventas "colgados" apuntando a un id que ya no resuelve — señalado como hueco en `ESQUEMA.md` §7), en Postgres conviene impedir el borrado físico de un producto que ya tiene movimientos. La forma correcta de "eliminar" un producto con historial es un soft-delete (`activo BOOLEAN` o `eliminado_en TIMESTAMPTZ`), no un `DELETE` real. **Esto es un cambio de comportamiento respecto al desktop actual** — vale la pena decidirlo explícitamente antes de implementar (ver checklist al final).
- **`usuario_id`**: no existe hoy en el tipo `MovimientoInventario` del desktop. Ya lo habíamos marcado como hueco de auditoría en `ESQUEMA.md` — si se agrega ahora en el desktop (`usuarioId?: string` opcional), la columna ya queda lista de este lado.

### `ventas` + `items_venta`

```sql
CREATE TABLE ventas (
  id          UUID PRIMARY KEY,
  cliente_id  UUID REFERENCES clientes(id) ON DELETE SET NULL,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,   -- NUEVO, mismo motivo que arriba
  total       NUMERIC(14,2) NOT NULL CHECK (total >= 0),         -- recalculado server-side, nunca confiado del cliente
  creado_en   TIMESTAMPTZ NOT NULL
);

CREATE TABLE items_venta (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- interno, nunca se expone en el JSON de respuesta
  venta_id          UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id       UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad          INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario   NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0)
);
CREATE INDEX items_venta_venta_idx ON items_venta (venta_id);
```
- `items_venta` está normalizada (tabla propia) aunque `ESQUEMA.md` la modela como array embebido (`Venta.items: ItemVenta[]`) — es una decisión puramente de storage. El `VentasService` arma la respuesta juntando `venta` + sus `items_venta` en el shape exacto de la interfaz TS antes de devolverla; el cliente nunca ve la tabla intermedia ni el `id` interno de cada línea.
- `id` de `items_venta` tiene `DEFAULT gen_random_uuid()` (a diferencia del resto) porque **no es una entidad sincronizable independiente** — no tiene id propio en el contrato TS, así que no rompe la regla de "el cliente decide el id" del punto 3 de `migracion-api-compatibilidad.md`.

### `compras` (`ordenes_compra`) + `items_compra`

```sql
CREATE TABLE ordenes_compra (
  id            UUID PRIMARY KEY,
  proveedor_id  UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  usuario_id    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en     TIMESTAMPTZ NOT NULL
);

CREATE TABLE items_compra (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id    UUID NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_id  UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad     INTEGER NOT NULL CHECK (cantidad > 0)
);
CREATE INDEX items_compra_compra_idx ON items_compra (compra_id);
```
- Sin `precio`/`costo`, igual que hoy — coherente con la decisión ya tomada de no modelar margen en v1.

### Diagrama de relaciones

```
usuarios ──┬─< movimientos_inventario >── productos ──> proveedores
           ├─< ventas >──< items_venta ──> productos
           │         └──> clientes
           └─< ordenes_compra >──< items_compra ──> productos
                              └──> proveedores
```

---

## 4. DTOs — ejemplo del patrón para Productos

```typescript
// productos/dto/crear-producto.dto.ts
export class CrearProductoDto {
  @IsUUID() id: string                       // el cliente lo asigna, no el servidor
  @IsString() @IsNotEmpty() sku: string
  @IsString() @IsNotEmpty() nombre: string
  @IsOptional() @IsString() descripcion?: string
  @IsNumber() @Min(0) precio: number
  @IsNumber() @Min(0) stock: number           // solo permitido al CREAR, no al actualizar
  @IsNumber() @Min(0) stockMinimo: number
  @IsOptional() @IsUUID() proveedorId?: string
  @IsOptional() @Matches(/^data:image\/(png|jpe?g|webp|gif);base64,/) imagenUrl?: string
  @IsISO8601() creadoEn: string                // respetado tal cual lo manda el cliente
}

// productos/dto/actualizar-producto.dto.ts
export class ActualizarProductoDto extends PartialType(
  OmitType(CrearProductoDto, ['id', 'stock', 'creadoEn'] as const)
) {}
```
El resto de los módulos (`ventas`, `compras`, `movimientos`, `proveedores`, `clientes`, `usuarios`) siguen el mismo patrón: `Crear*Dto` con `id` + `creadoEn` obligatorios (los manda el cliente), `Actualizar*Dto` como `PartialType` que excluye los campos protegidos de cada entidad.

---

## 5. Idempotencia — el punto más delicado

El outbox local reintenta un `CREAR` en estado `ERROR` sin saber si el intento anterior realmente falló en el servidor o si falló solo la respuesta de vuelta. Cada `service.crear()` tiene que ser **"buscar antes de crear"**, envuelto en transacción cuando hay efectos secundarios (Ventas/Compras generan movimientos):

```typescript
// ventas/ventas.service.ts (boceto)
async crear(dto: CrearVentaDto): Promise<Venta> {
  const existente = await this.ventasRepo.findOne({ where: { id: dto.id } })
  if (existente) return this.buildRespuesta(existente)   // idempotente: reintento no duplica

  return this.dataSource.transaction(async (manager) => {
    await this.validarStockDisponible(dto.items, manager)   // mismas reglas que ventas.ipc.ts hoy
    const total = this.calcularTotal(dto.items)
    const venta = await manager.save(Venta, { id: dto.id, ...dto, total })
    await manager.save(ItemVenta, dto.items.map(i => ({ ventaId: venta.id, ...i })))

    for (const item of dto.items) {
      await this.inventarioService.registrarMovimiento(
        { productoId: item.productoId, tipo: 'SALIDA', cantidad: item.cantidad, motivo: `Venta ${venta.id}` },
        manager   // misma transacción — si algo falla, no queda venta sin movimiento ni viceversa
      )
    }
    return this.buildRespuesta(venta)
  })
}
```
Mismo patrón para `ComprasService.crear()` (con `ENTRADA` en vez de `SALIDA`) e `InventarioService.registrarMovimiento()` en general. Esta es la pieza que **no tiene equivalente hoy en el desktop** (ahí no hace falta, porque no hay reintentos de red) y es la más importante de acertar antes de escribir el primer controller de escritura.

---

## 6. Errores

`common/errores/codigo-error.enum.ts` — arranca con los códigos ya listados en `migracion-api-compatibilidad.md` y se amplía por módulo a medida que se implementa:

```typescript
export enum CodigoError {
  // Productos
  SKU_DUPLICADO = 'SKU_DUPLICADO',
  PRODUCTO_NO_ENCONTRADO = 'PRODUCTO_NO_ENCONTRADO',
  // Inventario
  STOCK_INSUFICIENTE = 'STOCK_INSUFICIENTE',
  CANTIDAD_INVALIDA = 'CANTIDAD_INVALIDA',
  // Usuarios
  EMAIL_DUPLICADO = 'EMAIL_DUPLICADO',
  ULTIMO_ADMIN = 'ULTIMO_ADMIN',
  // Proveedores/Clientes
  REGISTRO_GENERAL_PROTEGIDO = 'REGISTRO_GENERAL_PROTEGIDO',
  // Auth
  CREDENCIALES_INVALIDAS = 'CREDENCIALES_INVALIDAS',
  TOKEN_EXPIRADO = 'TOKEN_EXPIRADO',
}
```
`AppException extends HttpException` lleva `{ codigo, mensaje }`; un `HttpExceptionFilter` global asegura que **toda** respuesta de error (incluidas las que NestJS genera solo, como un 404 de ruta inexistente) tenga esa forma consistente.

---

## 7. Auth

- `POST /api/v1/auth/login` → `{ accessToken, refreshToken, usuario }`. `accessToken` JWT de vida corta (ej. 15 min), `refreshToken` de vida más larga (ej. 30 días) guardado hasheado en una tabla `refresh_tokens` (o Redis si se prefiere no tocar Postgres para esto).
- `POST /api/v1/auth/refresh` → nuevo `accessToken` a partir de un `refreshToken` válido.
- **Guard global** (`JwtAuthGuard`) aplicado por defecto a todos los controllers salvo `@Public()` en login/refresh — corrige el hueco marcado en `ESQUEMA.md` de que hoy ningún handler valida quién llama.
- **`RolesGuard` + `@Roles('ADMIN')`** para los endpoints que hoy están restringidos solo en la UI del desktop (gestión de usuarios, endpoints de administración).
- Vida útil del `accessToken` pensada para el caso "vendedor offline un rato" — 15 minutos es corto para eso. Vale la pena decidir junto con el desktop cómo se comporta cuando el token expira sin conexión: ¿se seguiría escribiendo en la cola local igual (ya lo hace hoy) y listo, o el desktop necesita su propio criterio de "sesión offline válida por N horas" independiente del JWT? Es una conversación a tener con el lado desktop, no solo de la API.

---

## 8. Endpoints

Prefijo común: `/api/v1`. `🔒` = requiere `JwtAuthGuard`. `👑` = además requiere rol `ADMIN`.

| Método | Ruta | Rol | Body | Notas |
|---|---|---|---|---|
| POST | `/auth/login` | público | `LoginDto` | |
| POST | `/auth/refresh` | público | `{ refreshToken }` | |
| GET | `/usuarios` | 🔒👑 | — | |
| GET | `/usuarios/:id` | 🔒👑 | — | |
| POST | `/usuarios` | 🔒👑 | `CrearUsuarioDto` | idempotente por `id` |
| PATCH | `/usuarios/:id` | 🔒👑 | `ActualizarUsuarioDto` | `password` opcional |
| DELETE | `/usuarios/:id` | 🔒👑 | — | 409 `ULTIMO_ADMIN` si aplica |
| GET | `/productos` | 🔒 | — | filtros por query (`?stockBajo=true`, etc. — a definir) |
| GET | `/productos/:id` | 🔒 | — | |
| POST | `/productos` | 🔒 | `CrearProductoDto` | idempotente por `id` |
| PATCH | `/productos/:id` | 🔒 | `ActualizarProductoDto` | sin `stock` |
| DELETE | `/productos/:id` | 🔒👑 | — | soft-delete, ver §3 |
| GET | `/movimientos?productoId=` | 🔒 | — | |
| POST | `/movimientos` | 🔒 | `CrearMovimientoDto` | idempotente por `id`; actualiza `productos.stock` en la misma transacción |
| GET | `/ventas` | 🔒 | — | |
| POST | `/ventas` | 🔒 | `CrearVentaDto` | idempotente por `id`; genera movimientos `SALIDA` |
| GET | `/compras` | 🔒 | — | |
| POST | `/compras` | 🔒 | `CrearCompraDto` | idempotente por `id`; genera movimientos `ENTRADA` |
| GET | `/proveedores` | 🔒 | — | |
| POST/PATCH/DELETE | `/proveedores(/:id)` | 🔒 | — | `DELETE` rechaza `es_general` |
| GET | `/clientes` | 🔒 | — | |
| POST/PATCH/DELETE | `/clientes(/:id)` | 🔒 | — | `DELETE` rechaza `es_general` |

Deliberadamente **no** hay `DELETE /ventas/:id` ni `DELETE /compras/:id` — ni el desktop ni este esquema contemplan anular una venta/compra ya registrada; si se necesita eso en el futuro, es una funcionalidad nueva (nota de crédito / reverso), no un borrado.

---

## Checklist de decisiones abiertas antes de empezar a codear

- [ ] ¿Se acepta el cambio de comportamiento de **soft-delete en `productos`** (vs. el borrado físico que hace el desktop hoy)? Si sí, hay que sumar el campo equivalente al tipo `Producto` en `ESQUEMA.md`/desktop para mantener paridad.
- [ ] Agregar `usuarioId` opcional a `Venta`/`OrdenCompra`/`MovimientoInventario` del lado del desktop **antes** de fijar el esquema de Postgres, para que las columnas `usuario_id` no queden huérfanas desde el día uno.
- [ ] TypeORM vs Prisma — no cambia este documento, pero hay que elegir antes de armar `database.module.ts`.
- [ ] Vida útil del `accessToken` y comportamiento del desktop cuando expira sin conexión (mencionado en §7) — requiere alinear con el lado desktop, no es una decisión unilateral de la API.
- [ ] `argon2` (recomendado) vs mantener `scrypt` también en el servidor por simplicidad de tener un solo algoritmo en todo el sistema.
