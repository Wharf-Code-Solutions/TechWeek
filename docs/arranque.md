# JARANA · Guía de arranque para los 3 devs

> Léela primero (5 min). Después, según tu rol: `docs/backend.md` (API y reparto) y `docs/contratos.md` (esquema, retos, rutas).

## Qué cambió con este push

1. **Hay backend propio:** FastAPI en `backend/`. El navegador **ya no habla con Supabase**: todo pasa por `src/lib/api.ts` → `/api/*`.
2. **Supabase** queda detrás del backend (base de datos y sesión anónima). Sus llaves solo van en `backend/.env`.
3. **El reto llega sin respuestas**; se validan en el servidor al completarlo.
4. **Moneda: Tlacos.** El proyecto se llama JARANA. **No hay QR**: se llega con un enlace.
5. Parada 2 de la demo: **Solar de la Condesa de Malibrán** (el Callejón del Diamante se descartó).

## Poner todo a correr

```bash
git pull
npm install
cp .env.example .env.local          # VITE_MAPBOX_TOKEN (pídelo a Dev 1)

cd backend
python -m venv .venv
.venv\Scripts\activate              # Windows (Mac/Linux: source .venv/bin/activate)
pip install -r requirements-dev.txt
cp .env.example .env                # SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY (pídelas a Dev 1)
uvicorn app.main:app --reload --port 8000
pytest                              # 8 pruebas deben pasar
```

En otra terminal, en la raíz: `npm run dev`. Vite redirige `/api` al puerto 8000. Documentación interactiva de la API: `http://localhost:8000/docs`.

Mientras Supabase no esté listo, el frontend puede leer `src/data/seed.json` y el backend responde 503 en lo que depende de la base.

## Usar la API desde el frontend

```ts
import { api } from '../lib/api'
await api.lugares()
await api.registrarLlegada('catedral', 'gps', lat, lng)   // 'demo' con ?demo=1
await api.completarReto('catedral', ['palabra1'], false, 'es')
await api.canjear('cafe-2x1')
```
Nunca sumes ni restes Tlacos en el navegador, ni guardes llaves en el repo.

## Primeras tareas

| Dev | Empieza por |
| --- | --- |
| **Dev 1 · Carlos Daniel** | Aplicar `0001_esquema.sql` en Supabase y activar sesión anónima; **pasar las llaves al equipo por canal privado**; renombrar `clacos` → `tlacos` (SQL, seed, tipos, `backend/app/db.py`); migración 0002 (cerrar tablas al rol `anon`); cargar el seed real. |
| **Dev 2 · Luis** | Tokens y componentes base (`Boton`, `Tarjeta`, `Banderines`, `Ilustracion`); mapa con `api.lugares()`; pantallas de minijuegos contra `api.retoDeLugar()` y `api.completarReto()`. |
| **Dev 3 · Manuel** | `usePosition()` real (GPS, 40 m, modo explorador); recorrido virtual `?demo=1`; pantallas de preferencias, ¡Llegaste! y recompensa; despliegue. |

## Reglas de trabajo

- **Commits:** `<tipo>(<módulo>): <resumen>` ≤ 50 caracteres, con Contexto, Detalles y Dev (plantilla `.gitmessage`: `git config commit.template .gitmessage`).
  - Tipos: `feat`, `fix`, `chore`, `refactor`, `style`, `docs`.
  - Módulos: `db`, `map`, `geo`, `game`, `ui`, `core`.
- Un commit por tarea terminada y solo si el proyecto corre sin errores.
- Antes de subir: `git pull --rebase`, `npm run build`, `npm run lint` y `pytest`.
- Trabajen en archivos de su carpeta (ver estructura en `docs/contratos.md`) para evitar conflictos. Si necesitas cambiar un contrato, avisa y actualiza el doc en el mismo commit.
- Todo texto visible pasa por i18n (ES/EN). Áreas táctiles ≥ 44 px, contraste ≥ 4.5:1, `aria-label` en botones solo con ícono.

## Pendientes abiertos

- Dónde se despliega el backend (Vercel o servicio aparte).
- Coordenadas verificadas de los lugares y retos de Catedral, Portales y Zócalo.
- Validar la leyenda de la Condesa de Malibrán con un cronista.
- Nombres reales de comercios y promociones.
