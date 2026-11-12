# Clacos · Contratos entre módulos

> Propuesta de Dev 1 · 11 nov 2026 · **Pendiente de validar por los 3 devs.**
> Con estos contratos cada quien programa contra datos de prueba y luego se conecta sin reescribir nada.
> Si algo cambia, se actualiza este archivo en el mismo commit.

## Backend

No hay servidor propio. **Supabase es el backend**:
- **Postgres:** las tablas de abajo.
- **Sesión anónima:** sin cuenta; cada celular tiene su propio `auth.uid()`.
- **RLS:** controla quién lee y escribe cada fila.
- **Funciones RPC:** contienen todo lo que mueve Clacos.

**Actualización de Dev 3:** el navegador ya no usa `supabase-js` ni habla con Supabase. Todo pasa por el backend FastAPI (`backend/`, ver `docs/backend.md`) mediante `src/lib/api.ts`. Las funciones RPC de la migración 0002 ya no se necesitan.

## 1 · Esquema de datos y `seed.json`

- **Catálogo (todos leen, nadie escribe desde el navegador):** `lugares`, `retos`, `fotos_historicas`, `comercios`, `promociones`, `eventos`.
- **Progreso del celular:**
  - `perfiles` y `rutas_usuario`: el dueño lee y edita sus filas.
  - `visitas`, `movimientos_clacos` y `canjes`: el dueño solo lee; escriben las funciones RPC.
- **Vista `saldo`:** `{ perfil_id, clacos }`, la suma de `movimientos_clacos`.
- **SQL completo:** `supabase/migrations/0001_esquema.sql`.
- **Tipos TS:** `src/types/contratos.ts`. Cuando el esquema se aplique, se generará `src/types/database.ts` con `supabase gen types`.

**Mientras Supabase no esté listo, el frontend lee `src/data/seed.json`.** En el seed:
- Los lugares se relacionan **por `slug`**, no por `id`.
- Las categorías válidas son `historia`, `leyendas`, `musica`, `comida`, `mar` y `artesania`, las mismas que los intereses de las preferencias.
- `en_demo: true` marca las 5 paradas de la demo.
- `verificar: true` marca las coordenadas aproximadas. Hay que confirmarlas antes de la fase 2.
- `pendiente_confirmar: true` marca comercios y eventos de ejemplo.

### Paradas de la demo
| Orden | Lugar | Reto |
| --- | --- | --- |
| 1 | Catedral de la Asunción | por definir |
| 2 | Solar de la Condesa de Malibrán | Completa la leyenda ✅ |
| 3 | Baluarte de Santiago (solo exterior) | Orden cronológico ✅ |
| 4 | Portales y café lechero | por definir |
| 5 | Zócalo / Plaza de Armas | por definir |

Fuera de la demo: Palacio Municipal y Faro Venustiano Carranza. **Regla:** solo lugares dentro del Centro Histórico del puerto. El Callejón del Diamante se descartó porque está en Xalapa.

## 2 · `usePosition()` (`src/features/geo/usePosition.ts`)

```ts
usePosition(): { lat: number; lng: number; precision: number; fuente: 'gps' | 'demo' } | null
```
El mapa, la detección de llegada y el recorrido virtual **solo** hablan con este hook. Si devuelve `null`, no hay permiso de ubicación y la app entra en modo explorador.

## 3 · Formato de los retos

**Palabras** (`tipo: 'palabras'`): cada `"{n}"` en `texto` es un hueco y su palabra correcta es `respuestas[n]`.
```json
{ "texto": ["La condesa recurría a la ", "{0}", "..."],
  "respuestas": ["brujería"],
  "opciones": ["brujería", "medicina", "..."] }
```

**Orden** (`tipo: 'orden'`): `orden_correcto` lista los `id` de los eventos.
```json
{ "eventos": [{ "id": "e1", "anio": 1635, "texto": "..." }],
  "orden_correcto": ["e1", "e2"] }
```

Cada reto incluye `clacos` (si acierta), `clacos_revelado` (si usa "ver respuesta y seguir") e `intentos_max`. Nunca se bloquea al turista.

## 4 · Funciones RPC (las prepara Dev 1, migración 0002)

| Función | Entrada | Devuelve | Regla |
| --- | --- | --- | --- |
| `registrar_llegada` | `lugar_id, metodo ('gps'\|'demo')` | la visita | Una sola vez por celular y lugar |
| `completar_reto` | `lugar_id, acerto (bool)` | `{ clacos_ganados, saldo }` | Paga una sola vez |
| `canjear` | `promocion_id` | `{ codigo, saldo }` | Revisa el saldo y descuenta |

**Nunca se suman ni restan Clacos desde el navegador.**

## 5 · Componentes base y tokens (Dev 2)

- **Tokens:** `src/styles/tokens.css`, con la paleta "Fiesta Jarocha", las tipografías, los bordes y la sombra dura.
- **Componentes:** `src/components/ui/` contiene `Boton`, `Tarjeta`, `<Banderines fondo cuerda />` e `<Ilustracion nombre="..." />`.
- **Íconos:** `@phosphor-icons/react`, en estilo duotono.

## 6 · Rutas de pantalla (`src/app/routes.tsx`)

`/` preferencias · `/mapa` · `/lugar/:slug` · `/reto/:slug` · `/recompensa/:slug` · `/cupon/:id` · `/fin`.
El parámetro `?demo=1` activa el recorrido virtual.

## Estructura del proyecto

```
src/
  app/routes.tsx           Rutas (contrato 6)
  pages/                   Una pantalla por ruta
  components/ui/           Componentes base (Dev 2)
  features/
    mapa/                  M4 Mapbox (Dev 2)
    geo/                   M5 GPS + M6 recorrido virtual (Dev 3)
    ruta/                  M3 algoritmo de ruta (Dev 1)
    retos/                 M8 minijuegos (Dev 2 UI / Dev 1 validación)
    pasaporte/             M9 (Dev 2)
    cartera/               M10 (Dev 3)
    agenda/                M11 (Dev 2)
  hooks/                   M2 capa de datos (Dev 1)
  lib/                     api.ts (cliente del backend), i18n.ts
  locales/                 es.json, en.json
  data/seed.json           Catálogo de respaldo
  types/                   Contratos y tipos generados
  styles/tokens.css        Tokens visuales
backend/                   API FastAPI (Dev 1 negocio / Dev 3 base)
supabase/migrations/       SQL versionado (Dev 1)
```

## Commits

Usamos Conventional Commits en español: `<tipo>(<módulo>): <resumen>`, con los bloques Contexto, Detalles y Dev.
- **Módulos:** `db`, `map`, `geo` (antes `qr`: GPS, posición, llegada y recorrido virtual), `game`, `ui` y `core`.
