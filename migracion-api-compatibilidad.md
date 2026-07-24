# Cambios recomendados al esquema para migrar a API sin romper compatibilidad

> Basado en `ESQUEMA.md` (v1.0 de la app de escritorio, 100% local). Objetivo: que la migración de IPC local → API real sea mecánica, sin reescrituras ni sorpresas de sincronización.

---

## 1. Los nombres y formas deben calcar exactamente el `ESQUEMA.md`

El error más común al migrar de local a API es que alguien "mejora" los nombres en el camino (`sku` → `codigo`, `creadoEn` → `createdAt`) y ahí empiezan los problemas de compatibilidad.

**Regla general:** las entidades de NestJS deben ser un espejo 1:1 de las interfaces TS ya definidas — mismos nombres de campo, mismo idioma (español), mismo formato de fecha (ISO 8601 string, no `Date` object en el JSON de respuesta).

```typescript
// packages/shared-types/producto.types.ts
// Debe quedar IDÉNTICO a lo que ya usa la app de escritorio
export interface Producto {
  id: string
  sku: string
  nombre: string
  descripcion?: string
  precio: number
  stock: number
  stockMinimo: number
  proveedorId?: string
  imagenUrl?: string
  creadoEn: string
  actualizadoEn: string
}
```

Primer paso concreto: copiar el `ESQUEMA.md` completo dentro de `shared-types`, literal, antes de tocar el módulo de NestJS.

---

## 2. `stock` debe ser de solo lectura en el DTO de actualización

Ya identificado en el esquema: la única vía "oficial" para cambiar `stock` es un `MovimientoInventario`. En la API esto debe ser una restricción estricta, no una convención de UI:

```typescript
// productos/dto/actualizar-producto.dto.ts
export class ActualizarProductoDto {
  // stock NO aparece aquí — ni siquiera opcional
  @IsOptional() @IsString() nombre?: string
  @IsOptional() @IsNumber() @Min(0) precio?: number
  @IsOptional() @IsNumber() @Min(0) stockMinimo?: number
  // ...
}
```

**Diferencia clave con el IPC actual:** el handler local acepta el campo si se lo mandan porque confía en que "la UI nunca lo hace". En la API no se puede confiar en eso — cualquier cliente HTTP puede mandarlo. El DTO debe rechazarlo explícitamente (mejor con 400 explícito que ignorarlo en silencio, para que el error sea ruidoso).

---

## 3. IDs generados en el cliente, no en el servidor

**El cambio más importante y el más fácil de pasar por alto.**

Hoy la app genera `UUID v4` localmente. Si la API decide generar sus propios IDs al crear un registro, se rompe toda la lógica de sincronización: el outbox local ya tiene un `entidadId` generado offline, y las ventas/movimientos ya referencian esos IDs entre sí *antes* de sincronizar.

La API debe **aceptar el ID que manda el cliente** en el `POST`, no generarlo:

```typescript
// ventas.controller.ts
@Post()
async crear(@Body() dto: CrearVentaDto) {
  // dto.id viene del cliente (generado offline)
  // el servicio debe usar ese id, no generar uno nuevo
  return this.ventasService.crear(dto)
}
```

Y el servicio debe ser **idempotente por ese id**: si el outbox reintenta un `CREAR` porque el primer intento tuvo timeout (pero sí se guardó en el servidor), un segundo `POST` con el mismo `id` no debe crear un duplicado — debe devolver el registro existente o un 409 manejable. Esto es crítico porque el outbox reintenta automáticamente en estado `ERROR`.

---

## 4. Timestamps: decide quién manda

`creadoEn` / `actualizadoEn` hoy se generan localmente. Al sincronizar, ¿la API respeta esa fecha (cuando ocurrió realmente en el dispositivo) o la sobreescribe con la hora del servidor (cuando llegó la sincronización)?

Esto importa para reportes ("¿cuántas ventas hubo el martes?" — el martes según el dispositivo, no según cuándo se sincronizó, que puede ser días después si no había internet).

**Recomendación:** la API respeta el timestamp que manda el cliente como `creadoEn` (es un hecho del pasado, no debe cambiar), y puede tener su propio campo adicional tipo `recibidoEn` para trazabilidad de sincronización, sin tocar el campo original.

---

## 5. Errores: pasar de strings a códigos

Hoy los handlers lanzan errores con mensajes como `"Stock insuficiente"`. Si la UI de escritorio compara ese string exacto para decidir qué mostrar, migrar a HTTP rompe eso en cuanto cambie una coma en el mensaje.

Antes de construir los endpoints, definir códigos de error estables:

```typescript
// shared-types/errores.types.ts
export enum CodigoError {
  STOCK_INSUFICIENTE = 'STOCK_INSUFICIENTE',
  SKU_DUPLICADO = 'SKU_DUPLICADO',
  ULTIMO_ADMIN = 'ULTIMO_ADMIN',
  REGISTRO_GENERAL_PROTEGIDO = 'REGISTRO_GENERAL_PROTEGIDO',
}
```

Respuesta HTTP de error siempre con esta forma:

```json
{ "codigo": "STOCK_INSUFICIENTE", "mensaje": "Stock insuficiente para completar la venta" }
```

Así el frontend decide *comportamiento* por `codigo` (estable) y solo *muestra* el `mensaje` (puede cambiar de texto sin romper nada).

---

## 6. Usuarios y Auth — la decisión que hay que tomar ya, no después

Lo más delicado del esquema. Dos caminos, y hay que elegir antes de escribir el módulo `auth`:

**Opción A — La API es la fuente de verdad de usuarios/auth.**
El desktop deja de tener su propio `usuarios.repository.ts` local y todo login pasa por la API (con caché local solo para modo offline). Implica JWT real con expiración, refresh tokens, y que `usuarios` **sí** entre al mecanismo de sync (contradice la decisión actual de "a propósito no se sincronizan").

**Opción B — Cada dispositivo mantiene su propia lista de usuarios locales**, y la API tiene un usuario/rol completamente distinto (ej. una API key por dispositivo, no un login de persona). Más simple, pero significa que "quién hizo qué" (el `usuarioId` pendiente de agregar) nunca se puede cruzar de forma confiable entre dispositivos, porque cada uno tiene su propio universo de usuarios.

**Recomendación: Opción A.** Vale la pena centralizar usuarios desde el día uno de la API, aunque hoy solo haya un dispositivo, porque si más adelante se agrega un segundo punto de venta se va a necesitar login centralizado de todas formas — hacerlo después implica migrar contraseñas y romper sesiones existentes.

---

## 7. Reglas de negocio "protegidas" deben ser validación de servidor, no solo de UI

Cosas como `esGeneral` no editable/no eliminable, o "no se puede eliminar el único ADMIN" — hoy viven en el handler IPC (código propio, confiable). En la API, esa misma regla tiene que vivir en el **service**, no en el controller ni en el DTO, porque cualquier cliente HTTP (no solo el desktop) podría intentar el `DELETE`:

```typescript
// usuarios.service.ts
async eliminar(id: string) {
  const usuario = await this.buscarOFallar(id)
  if (usuario.rol === 'ADMIN') {
    const totalAdmins = await this.contarPorRol('ADMIN')
    if (totalAdmins <= 1) {
      throw new ConflictException({ codigo: CodigoError.ULTIMO_ADMIN })
    }
  }
  // ...
}
```

---

## 8. El contrato de sincronización que faltaba decidir

Recomendación concreta:

- **Endpoint REST por entidad**, no genérico `POST /sync` — más fácil de versionar y debuggear, y sirve tanto para sync como para un futuro cliente en tiempo real.
- Cada entidad sincronizable expone:
  - `POST /:entidad` (crear, idempotente por `id` del cliente)
  - `PATCH /:entidad/:id`
  - `DELETE /:entidad/:id`
- El outbox local simplemente mapea `operacion` → verbo HTTP y llama al endpoint correspondiente. El cambio de código en `enviarCambioApi()` es literalmente un `switch` sobre `operacion` con 3 llamadas HTTP.

---

## Checklist antes de escribir el primer controller

- [ ] Copiar las interfaces de `ESQUEMA.md` a `shared-types` sin modificar nombres/formas
- [ ] `stock` fuera de los DTOs de escritura de Producto
- [ ] Decidir: ¿API genera IDs o los acepta del cliente? → **acepta del cliente**, con idempotencia
- [ ] Decidir política de timestamps (respetar `creadoEn` del cliente)
- [ ] Definir enum de códigos de error antes de escribir el primer `throw`
- [ ] Decidir Opción A o B para usuarios/auth (recomendado: A)
- [ ] Portar las reglas "protegidas" (esGeneral, último admin, stock insuficiente) al service layer, no solo dejarlas de convención
