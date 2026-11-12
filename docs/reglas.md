# JARANA · Reglas del equipo

> Obligatorias para los 3 devs. Si una regla estorba, se discute en el equipo y se cambia **aquí** en el mismo commit; no se ignora.
> Última actualización: 11 nov 2026 · Dev 1 · Carlos Daniel

## 1. Quién es responsable de qué

| Dev | Rol | Carpetas que le pertenecen |
| --- | --- | --- |
| **Dev 1 · Carlos Daniel** | Datos y API de negocio | `supabase/`, `src/data/`, `src/types/`, `src/hooks/`, `src/features/ruta/`, en `backend/`: `db.py`, `retos.py`, `ruta.py`, `routers/retos.py`, `routers/canjes.py`, `routers/visitas.py`, `routers/rutas.py`, `scripts/` y `tests/` |
| **Dev 2 · Luis** | Mapa e interfaz | `src/components/`, `src/styles/`, `src/features/mapa/`, `retos/` (pantallas), `pasaporte/`, `agenda/` |
| **Dev 3 · Manuel** | Núcleo, posición y despliegue | `src/app/`, `src/lib/`, `src/features/geo/`, `cartera/`, en `backend/`: `main.py`, `config.py`, `auth.py`, `routers/sesion.py` y `routers/catalogo.py`; configuración de Vite y Vercel |

- **Trabaja solo en tus carpetas.** Si necesitas cambiar un archivo de otro dev, avísale antes por el chat del equipo.
- **Archivos compartidos** (`package.json`, `src/locales/*.json`, `docs/`): cambios pequeños, con `git pull --rebase` justo antes y avisando en el chat.
- **Infraestructura:** Supabase y Vercel los administra **Dev 1**. Si necesitas un cambio en la base de datos, una variable de entorno o una llave, pídeselo a él.

## 2. Git

### Flujo diario
1. **Al empezar:** `git pull --rebase`.
2. Trabaja en **una tarea a la vez**.
3. **Antes de subir**, todo esto debe pasar sin errores:
   ```bash
   npm run build
   npm run lint
   cd backend && pytest
   ```
4. `git pull --rebase` otra vez y luego `git push`.
5. Si hay conflictos, **no borres el código de otro dev**: resuélvelo con él.

### Reglas
- **Nunca** uses `git push --force` en `main`.
- **Nunca** subas código que no compila o que rompe las pruebas. Para algo experimental, usa una rama: `git checkout -b exp/<tu-nombre>-<tema>`.
- **No** subas `node_modules/`, `dist/`, `.venv/`, `.env` ni `.env.local` (ya están en `.gitignore`).
- **Sin co-autores de IA** en los commits: nada de líneas `Co-Authored-By` de asistentes.

## 3. Commits

Activa la plantilla una sola vez: `git config commit.template .gitmessage`, y pon tu nombre en la línea `Dev:`.

```
<tipo>(<módulo>): <resumen corto en modo imperativo>

- Contexto: <Qué se hizo y por qué se necesitaba>
- Detalles: <Cambios técnicos específicos o retos resueltos>
- Dev: <tu nombre>
```

- **Título:** máximo 50 caracteres, en español y en imperativo ("crear", "corregir", no "creado").
- **Tipos:** `feat` (función nueva), `fix` (corrige un error), `chore` (dependencias o configuración), `refactor` (mejora sin cambiar el comportamiento), `style` (solo visual o formato), `docs` (documentación).
- **Módulos:**
  - `db`: Supabase, migraciones, seed, API de negocio.
  - `map`: Mapbox y marcadores.
  - `geo`: GPS, llegada, recorrido virtual.
  - `game`: minijuegos.
  - `ui`: pantallas y componentes.
  - `core`: Vite, rutas, configuración, backend base y despliegue.
- **Atómicos:** un commit por tarea terminada, no un commit gigante al final del día.

Ejemplo:
```
feat(db): canjear promociones de forma atómica

- Contexto: Dos toques rápidos podían gastar el mismo saldo.
- Detalles: Función SQL canjear con candado por perfil; el endpoint la llama por RPC.
- Dev: Carlos Daniel
```

## 4. Seguridad y llaves

- **Las llaves nunca van al repo.** Solo `.env.example` con los nombres de las variables, sin valores.
- **La `service_role` de Supabase es secreta.** Solo va en `backend/.env`. Nunca en el frontend, ni en capturas de pantalla, ni en el chat del equipo. Si se filtra, avisa a Dev 1 para rotarla.
- Las llaves se comparten **solo por mensaje privado** y las entrega Dev 1.
- El token de Mapbox (`pk.`) es público, pero va restringido a nuestros dominios.

## 5. Arquitectura (no negociable sin acuerdo)

- **El navegador nunca habla con Supabase.** Todo pasa por `src/lib/api.ts` → `/api/*` (FastAPI).
- **Los Tlacos solo se suman o restan en el backend.** El frontend solo muestra el saldo que devuelve la API.
- **Los retos llegan sin respuestas** y se validan en el servidor. No guardes las respuestas en el frontend.
- **Los cambios a la base de datos solo se hacen con migraciones** en `supabase/migrations/NNNN_nombre.sql`, numeradas en orden. Nunca edites tablas a mano desde el panel. Una migración ya aplicada no se modifica: se crea otra.
- **Los contratos** (`docs/contratos.md`) son el acuerdo entre módulos. Si necesitas cambiar uno (un campo, un endpoint, una ruta), avisa y actualiza el doc en el mismo commit.
- **Un campo nuevo en una pantalla** se le pide a Dev 1, que lo agrega a la base de datos y a la API. No lo leas de otra fuente.

## 6. Contenido

- **Solo lugares del Centro Histórico del puerto de Veracruz** (Perímetros A y B del INAH). Nada de Xalapa ni del entorno colindante. San Juan de Ulúa no entra en las rutas a pie.
- **Datos con fuente:** cada curiosidad o leyenda sale del CSV de sitios o de la investigación compartida. Si un dato no tiene fuente, no entra.
- **Leyendas:** se cuenta la leyenda **y** el dato histórico real (por ejemplo, la Condesa de Malibrán y Doña Beatriz del Real).
- **Comercios reales:** no se publican promociones de un negocio sin su acuerdo. Hasta entonces se usan nombres de ejemplo entre corchetes.
- **Coordenadas** marcadas con `verificar: true` hasta confirmarlas en campo o en Google Maps (el radio de llegada es de 40 m).

## 7. Código y calidad

- **TypeScript** en el frontend; no uses `any` salvo con un comentario que diga por qué.
- **Todo texto visible pasa por i18n** (`src/locales/es.json` y `en.json`), siempre en los dos idiomas.
- **Accesibilidad:**
  - Áreas táctiles de al menos 44 px.
  - Contraste de al menos 4.5:1.
  - `aria-label` en los botones que solo tienen ícono.
- **Estilos** con CSS Modules y los tokens de `src/styles/tokens.css`. No uses colores sueltos.
- **Backend:** cada endpoint nuevo lleva al menos una prueba en `backend/tests/`.
- Prioridad: **lo que aparece en el guion de la demo de 4 minutos va primero.**

## 8. Comunicación

- **Antes de empezar una tarea,** di en el chat cuál tomas para que nadie la duplique.
- **Si te bloquea otro dev,** avísale de inmediato y avanza con datos de prueba (`src/data/seed.json`).
- **Si te desvías del plan** (`docs/backend.md`, `docs/contratos.md`), dilo antes de programarlo, no después.
