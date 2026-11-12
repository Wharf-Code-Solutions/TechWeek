# JARANA · Backend (FastAPI) y reparto

> Propuesta de Dev 3 · 11 nov 2026 · **Pendiente de validar por los 3 devs.**
> Cambia el contrato "Backend" de `docs/contratos.md`: ya no es solo Supabase.

## Arquitectura

```
Celular (React) ──/api/*──▶ FastAPI ──service_role──▶ Supabase (Postgres + sesión anónima)
```

- **El navegador ya no habla con Supabase.** Se eliminaron `@supabase/supabase-js` y `src/lib/supabase.ts`; el frontend usa solo `src/lib/api.ts`. En el `.env` del frontend ya no hay llaves de Supabase.
- **Supabase** queda como base de datos y servicio de sesión anónima, detrás del backend. Sus llaves viven en `backend/.env`; la `service_role` nunca sale del servidor.
- **Sesión:** `POST /api/sesion` crea el usuario anónimo y `POST /api/sesion/renovar` lo renueva. El token se guarda en `localStorage` y viaja como `Authorization: Bearer`. FastAPI lo valida contra `/auth/v1/user` para obtener el `perfil_id`.
- **Catálogo:** se sirve desde `GET /api/...`. El reto se entrega **sin las respuestas correctas**; se validan en el servidor.
- **Reemplaza** las funciones RPC planeadas y la lectura pública por RLS. ✅ Hecho en la migración 0002: las tablas están cerradas a `anon` y `authenticated`; solo entra `service_role`.

## Endpoints (v0.1)

| Método y ruta | Qué hace | Regla |
| --- | --- | --- |
| `GET /health` | Estado del servicio | — |
| `POST /api/sesion` · `POST /api/sesion/renovar` | Abre o renueva la sesión anónima | Un usuario por celular |
| `GET /api/lugares` · `/lugares/{slug}/reto` · `/comercios` · `/promociones` · `/eventos` · `/fotos` | Catálogo de solo lectura | El reto no incluye respuestas |
| `GET /api/saldo` | Saldo de Tlacos del celular | Suma del libro |
| `POST /api/visitas` | Registra la llegada `{lugar_slug, metodo, lat?, lng?}` | Una vez por lugar; con `gps` valida el radio (haversine) |
| `POST /api/retos/{slug}/completar` | Valida `{respuesta, revelar, idioma}` y paga | Una sola vez; `revelar` paga menos y nunca bloquea |
| `POST /api/promociones/{slug}/canjear` | Descuenta y devuelve `{codigo, saldo}` | Revisa saldo (402 si no alcanza) |

Pendientes de API: bono de fin de ruta (`bono_fin`), guardar ruta y perfil, `?demo=1` sin GPS.

## Carpetas

```
backend/
  app/main.py            App FastAPI, CORS, routers
  app/config.py          Variables de entorno
  app/auth.py            Valida el JWT anónimo de Supabase
  app/db.py              Cliente PostgREST (service_role) y nombres de la moneda
  app/geo.py             Distancia en metros (radio de 40 m)
  app/retos.py           Validación de los dos minijuegos
  app/routers/           sesion, catalogo, visitas, retos, canjes
  tests/                 pytest
src/lib/api.ts           Único cliente del frontend (sesión + token)
```

## Cómo correrlo

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate    # Windows
pip install -r requirements-dev.txt
cp .env.example .env                              # llenar SUPABASE_URL y SUPABASE_SERVICE_KEY
uvicorn app.main:app --reload --port 8000
pytest
```
Con `npm run dev`, Vite redirige `/api` a `localhost:8000`. Documentación interactiva en `http://localhost:8000/docs`.

## Reparto a partir de aquí

### Dev 1 · Carlos Daniel — Datos y API de negocio
1. Aplicar `0001_esquema.sql` en Supabase, activar la sesión anónima y entregar a los demás `SUPABASE_URL`, la anon key y la service key (por canal privado).
2. ✅ Renombrar `clacos` → `tlacos` en SQL, `seed.json`, tipos y `backend/app/db.py`.
3. Migración 0002: cerrar las tablas al rol `anon` (quitar políticas de lectura pública), restricciones de "una sola vez" y, si hace falta, función SQL atómica para el canje.
4. Cargar el seed real (coordenadas verificadas, retos de las 5 paradas) y probar `retos` y `canjes` contra él.
5. Endpoint de bono de fin de ruta, guardar ruta y perfil (`rutas_usuario`, `perfiles`) y el algoritmo de ruta (M3).
6. Tests de lógica del backend con datos falsos de Supabase.

### Dev 2 · Luis — Mapa e interfaz
1. Tokens y componentes base (`Boton`, `Tarjeta`, `Banderines`, `Ilustracion`).
2. Mapa (M4): límite, 3D, marcadores y línea de ruta, leyendo `api.lugares()`.
3. Pantallas de minijuegos: leen `api.retoDeLugar(slug)` (sin respuestas) y envían con `api.completarReto(...)`; "ver respuesta y seguir" es `revelar: true`.
4. Panel deslizable (M7), pasaporte y rompecabezas (M9), agenda (M11), fin de ruta (M12).
5. Pedir a Dev 1 cualquier campo nuevo que necesiten las pantallas, no leerlo de otro sitio.

### Dev 3 · Manuel — Núcleo, posición y despliegue
1. Subir el esqueleto del backend y `lib/api.ts`; mantener `auth`, `sesion`, CORS y configuración.
2. `usePosition()` real (M5): permiso, GPS, radio de 40 m y modo explorador; la llegada llama a `api.registrarLlegada`.
3. Recorrido virtual (M6) con `?demo=1`, Turf y la ruta de la demo guardada como respaldo.
4. Pantallas de preferencias, ¡Llegaste! y recompensa.
5. Cartera y cupón deslizable (M10) con `api.saldo()` y `api.canjear()`.
6. Despliegue: frontend y backend en Vercel (o servicio aparte), variables de entorno, pruebas con celular real.

### Orden
| Fase | Dev 1 | Dev 2 | Dev 3 |
| --- | --- | --- | --- |
| 1 Arranque (ahora) | Supabase real + Tlacos + 0002 | Tokens y componentes | Backend y `api.ts` subidos, despliegue |
| 2 Jugable | Seed real, retos probados | Mapa y minijuegos | GPS, llegada, recorrido virtual, pantallas |
| 3 Colección | Canje atómico, saldo | Panel, pasaporte | Cartera y cupón |
| 4 Completar | Retos faltantes, inglés, bono fin | Agenda, fin de ruta | Ajustar ruta, modo explorador |
| 5 Pulido | Datos finales | Animaciones, accesibilidad | Pruebas en campo (los tres ensayan) |

## Decisiones abiertas

- **Dónde se despliega:** FastAPI en Vercel (funciones Python) o en un servicio aparte (Render/Railway). Se decide al conectar Supabase real; mientras tanto corre local.
- ✅ **Atomicidad del saldo:** resuelta. El canje usa la función SQL `canjear` (migración 0002), que bloquea por perfil y revisa, descuenta y genera el código en una sola transacción.
- ✅ **Tlacos:** columnas renombradas a `tlacos`, `tlacos_revelado`, `costo_tlacos` y `movimientos_tlacos`.
- **Commits:** el módulo del backend usa el scope `db` (o proponer `api`).
