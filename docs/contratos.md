# JARANA · Contratos entre módulos

> Propuesta de Dev 1 · 11 nov 2026 · **Pendiente de validar por los 3 devs.**
> Con estos contratos cada quien programa contra datos de prueba y luego se conecta sin reescribir nada.
> Si algo cambia, se actualiza este archivo en el mismo commit.

## Backend

```
Celular (React) ──/api/*──▶ FastAPI (backend/) ──service_role──▶ Supabase (Postgres + sesión anónima)
```
- El navegador **no** habla con Supabase: todo pasa por `src/lib/api.ts` (ver `docs/backend.md`).
- **Supabase** guarda los datos y crea la sesión anónima (cada celular tiene su `auth.uid()`).
- Las tablas están **cerradas** a los roles `anon` y `authenticated` (migración 0002): solo el backend, con `service_role`, lee y escribe.
- La lógica que necesita ser atómica (el canje) vive en una función SQL que solo el backend puede ejecutar.

## 1 · Esquema de datos y `seed.json`

- **Catálogo:** `lugares`, `retos`, `fotos_historicas`, `comercios`, `promociones`, `eventos`. El backend los sirve en `GET /api/...` (los retos sin respuestas).
- **Progreso del celular:** `perfiles`, `rutas_usuario`, `visitas`, `movimientos_tlacos` y `canjes`. Solo los escribe el backend, filtrando siempre por el `perfil_id` de la sesión.
- **Vista `saldo`:** `{ perfil_id, tlacos }`, la suma de `movimientos_tlacos`.
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

Cada reto incluye `tlacos` (si acierta), `tlacos_revelado` (si usa "ver respuesta y seguir") e `intentos_max`. Nunca se bloquea al turista.

## 4 · API del backend (lista completa en `docs/backend.md`)

| Endpoint | Entrada | Devuelve | Regla |
| --- | --- | --- | --- |
| `POST /api/visitas` | `lugar_slug, metodo ('gps'\|'demo'), lat?, lng?` | la visita | Una sola vez por celular y lugar; con `gps` valida el radio |
| `POST /api/retos/{slug}/completar` | `respuesta, revelar, idioma` | `{ correcto, completado, tlacos_ganados, saldo }` | Paga una sola vez |
| `POST /api/promociones/{slug}/canjear` | — | `{ codigo, saldo }` | Atómico (función SQL `canjear`); 402 si no alcanza |

**Nunca se suman ni restan Tlacos desde el navegador.**

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
