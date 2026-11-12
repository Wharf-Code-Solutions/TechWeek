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
| 1 | Catedral de la Asunción | Completa la frase ✅ |
| 2 | Solar de la Condesa de Malibrán | Completa la leyenda ✅ |
| 3 | Baluarte de Santiago (solo exterior) | Orden cronológico ✅ |
| 4 | Portales y café lechero | Completa la frase ✅ |
| 5 | Zócalo / Plaza de Armas | Orden cronológico ✅ |

Fuera de la demo: Palacio Municipal y Faro Venustiano Carranza. **Regla:** solo lugares dentro del Centro Histórico del puerto. El Callejón del Diamante se descartó porque está en Xalapa.

## 2 · `usePosition()` (`src/features/geo/usePosition.ts`)

```ts
usePosition(): { lat: number; lng: number; precision: number; fuente: 'gps' } | null
```
El mapa, la detección de llegada y el recorrido virtual **solo** hablan con este hook. Si devuelve `null`, no hay permiso de ubicación y la app entra en modo explorador.

## 3 · Formato de los retos

**Palabras** (`tipo: 'palabras'`): cada `"{n}"` en `texto` es un hueco y su palabra correcta es `respuestas[n]`.
```json
{ "texto": ["La condesa recurría a la ", "{0}", "..."],
  "respuestas": ["brujería"],
  "opciones": ["brujería", "medicina", "..."] }
```

**Orden** (`tipo: 'orden'`): `orden_correcto` lista los `id` de los eventos. Si un evento trae `anio_texto` (por ejemplo "Siglo XVII"), la pantalla lo muestra en lugar de `anio`.
```json
{ "eventos": [{ "id": "e1", "anio": 1635, "texto": "..." }],
  "orden_correcto": ["e1", "e2"] }
```

### Retos rápidos (un toque, más sencillos; dan 30 doblones, 10 si se revela)

Solo en lugares fuera de la ruta demo. El backend **quita `correcta`** antes de enviar el reto.

**Trivia** (`tipo: 'trivia'`): una pregunta y 3 opciones. Respuesta: `[opcionElegida]` (el texto).
```json
{ "pregunta": "¿Qué se vende en la Gran Nevería Yucatán?",
  "opciones": ["Llantas", "Nieves y helados", "Zapatos"],
  "correcta": "Nieves y helados" }
```

**¿Verdadero o falso?** (`tipo: 'verdadero_falso'`): dos botones. Respuesta: `['verdadero']` o `['falso']`. `intentos_max: 2`.
```json
{ "afirmacion": "Desde el malecón se pueden ver barcos.", "correcta": true }
```

**¿Cuál es el intruso?** (`tipo: 'intruso'`): 4 opciones, una no pertenece. Respuesta: `[opcionIntrusa]`.
```json
{ "pregunta": "¿Cuál NO es comida típica del mercado?",
  "opciones": ["Picadas", "Tornillos", "Gorditas", "Empanadas"],
  "correcta": "Tornillos" }
```

Tipos TS: `ContenidoTrivia`, `ContenidoVerdaderoFalso`, `ContenidoIntruso` y `TipoReto` en `src/types/contratos.ts`.
Para la pantalla: `t('reto.titulo_<tipo>')`, `t('reto.instrucciones_<tipo>')` y `t('reto.comprobar_<tipo>')` necesitan sus claves nuevas en `es.json` y `en.json`.

> **Estado:** el seed ya trae 15 retos rápidos (5 trivia, 6 verdadero/falso, 4 intruso), pero **no están cargados en Supabase** hasta que existan sus pantallas: hoy `Reto.tsx` trata cualquier tipo distinto de `palabras` como `orden`. Cuando las pantallas estén listas, Dev 1 corre `python -m scripts.cargar_seed`.

Cada reto incluye `tlacos` (si acierta), `tlacos_revelado` (si usa "ver respuesta y seguir") e `intentos_max`. Nunca se bloquea al turista.

## 4 · API del backend (lista completa en `docs/backend.md`)

| Endpoint | Entrada | Devuelve | Regla |
| --- | --- | --- | --- |
| `POST /api/visitas` | `lugar_slug, metodo ('gps'), lat, lng` | la visita | Una sola vez por celular y lugar; valida siempre el radio |
| `POST /api/retos/{slug}/completar` | `respuesta, revelar, idioma` | `{ correcto, completado, tlacos_ganados, saldo }` | Paga una sola vez |
| `POST /api/promociones/{slug}/canjear` | — | `{ codigo, saldo }` | Atómico (función SQL `canjear`); 402 si no alcanza |

**Nunca se suman ni restan doblones desde el navegador.**

## 5 · Componentes base y tokens (Dev 2)

- **Tokens:** `src/styles/tokens.css`, con la paleta "Fiesta Jarocha", las tipografías, los bordes y la sombra dura.
- **Componentes:** `src/components/ui/` contiene `Boton`, `Tarjeta`, `<Banderines fondo cuerda />` e `<Ilustracion nombre="..." />`.
- **Íconos:** `@phosphor-icons/react`, en estilo duotono.

## 6 · Rutas de pantalla (`src/app/routes.tsx`)

`/` preferencias · `/mapa` · `/lugar/:slug` · `/reto/:slug` · `/recompensa/:slug` · `/cupon/:id` · `/fin`.
Ya no existe el modo demo (`?demo=1`): lejos del Centro la posición se mueve tocando el mapa.

`/reto/:slug` requiere la llegada registrada (si no, el backend responde 409). Al completarse navega a `/recompensa/:slug` con el resultado de `api.completarReto()` en `location.state`: `{ correcto, completado, tlacos_ganados, saldo }`. Si `correcto` es `false`, el turista siguió con el premio reducido.

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
