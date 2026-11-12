# JARANA - Juego, Aventura, Recorridos, Arte, Negocios y Alegría

Plataforma web turística y gamificada del **Centro Histórico de Veracruz**. El turista entra desde su celular, elige qué le gusta y cuánto tiempo tiene, y JARANA le arma una ruta a pie por los lugares del Centro. En cada parada desbloquea una curiosidad y un minijuego, gana **doblones** (la moneda de JARANA), sellos y piezas de un rompecabezas, y canjea sus doblones en comercios locales.

🌐 **Demo en vivo:** https://techweek-eta.vercel.app

# Problema
A pesar de contar con atractivos históricos, culturales y turísticos de primer nivel, el Centro Histórico de Veracruz no logra retener a los visitantes ni integrarlos plenamente en la vida comercial y cultural local. Los recorridos suelen ser breves y carecen de conexión con la oferta comercial, por lo que el gasto por visitante es bajo y el flujo turístico no se traduce en un consumo significativo para los negocios de la zona.

Esta situación reduce la rentabilidad de los comercios, favorece el cierre temprano o definitivo de negocios y contribuye a la vacancia de locales. A su vez, la pérdida de actividad comercial genera menos empleos y una menor recaudación municipal, lo que limita los recursos disponibles para el mantenimiento, la seguridad y la mejora del espacio público.

Como resultado, el Centro Histórico pierde atractivo y competitividad frente a otros destinos, y desaprovecha su potencial como motor económico y cultural de la ciudad. La falta de difusión efectiva de eventos y actividades agrava esta problemática, ya que impide que visitantes y residentes descubran y participen en la oferta cultural y comercial disponible.

# Usuarios
El proyecto estará dirigido a tres grupos principales:

- **Visitantes y turistas**, quienes podrán conocer de manera más clara la oferta cultural, gastronómica, comercial y de servicios del Centro Histórico, así como descubrir eventos, rutas y experiencias que incentiven una estancia más larga.

- **Comerciantes y prestadores de servicios del centro**, incluyendo tiendas, restaurantes, cafeterías, hoteles, guías, artesanos y otros negocios, quienes podrán dar mayor visibilidad a sus productos, servicios y actividades, y atraer con mayor eficacia al flujo de visitantes.

- **Autoridades de turismo y cultura**, quienes podrán utilizar la plataforma o herramienta como un medio para difundir eventos, coordinar acciones con el sector empresarial y obtener información sobre la afluencia, preferencias y necesidades de los visitantes.

# ¿Cómo usar JARANA?
No hay que instalar nada ni crear una cuenta: se abre en el navegador del celular y el progreso se guarda en ese dispositivo con una sesión anónima.

1. **Arma tu ruta.** Elige idioma (español o inglés), cuánto tiempo tienes (de 30 min a 5 h) y qué te gusta: historia, leyendas, música, comida, mar o artesanía. JARANA calcula una ruta a pie con los lugares que más te interesan y que caben en tu tiempo.
2. **Camina el Centro.** El mapa te muestra la ruta por las calles. Al llegar a menos de 40 m de un lugar (por GPS) aparece **¡Llegaste!** con una curiosidad del sitio. Si estás lejos del Centro o sin GPS, la ruta sale del Zócalo y puedes moverte tocando el mapa.
3. **Juega el reto del lugar** y gana doblones:
   - *Completa la frase* o la leyenda (50 doblones).
   - *Ordena los hechos* de la historia (60).
   - *Trivia*, *¿verdadero o falso?* y *¿cuál es el intruso?*: retos de un toque (30).
   - Si fallas, puedes "seguir" con menos doblones: nunca te quedas atorado.
4. **Colecciona.** Cada reto te da un sello en tu **pasaporte** y una pieza del **rompecabezas** de una foto o postal del puerto.
5. **Descubre y canjea.** En el panel del mapa están tu **cartera**, la **agenda** de eventos del Centro y la **vitrina** de comercios (cafés, restaurantes, fondas, librerías, tiendas y artesanías). Canjea tus doblones por promociones deslizando el cupón frente al mesero.
6. **Termina la ruta** para recibir el bono final y doblones extra por la distancia recorrida, y compártela.

# ¿Cómo instalar JARANA?
Requisitos: **Node.js 20+**, **Python 3.12+** y acceso a las llaves del proyecto (Supabase y Vercel).

```bash
git clone https://github.com/Wharf-Code-Solutions/TechWeek.git
cd TechWeek
npm install
cp .env.example .env.local        # VITE_MAPBOX_TOKEN
```

Backend:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows (Mac/Linux: source .venv/bin/activate)
pip install -r requirements-dev.txt
cp .env.example .env              # SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
uvicorn app.main:app --reload --port 8000
```

Frontend, en la raíz: `npm run dev` y abrir http://localhost:5173. Vite redirige `/api` al backend en el puerto 8000; la documentación interactiva de la API queda en http://localhost:8000/docs.

**Base de datos:** el esquema vive en `supabase/migrations/` (aplicar en orden) y el contenido (lugares, retos, comercios, eventos y fotos) en `src/data/seed.json`. Para cargarlo: `cd backend && python -m scripts.cargar_seed`.

**Pruebas:** `npm test` (frontend, Vitest) y `pytest` dentro de `backend/`. Antes de subir cambios: `npm run build` y `npm run lint`.

**Despliegue:** Vercel publica la rama `main` automáticamente; el frontend y el backend (función de Python en `api/index.py`) comparten el mismo dominio.

Más detalle para el equipo en `docs/`: `arranque.md`, `backend.md`, `contratos.md` y `reglas.md`.

# Tecnologías
## 01. Frontend
**Interfaz de usuario**

| Tecnología | Uso |
|---|---|
| **React + Vite + TypeScript** | Desarrollo y compilación de la aplicación web SPA. |
| **React Router** | Navegación entre preferencias, mapa, lugar, reto, recompensa, cupón y fin de ruta. |
| **CSS + CSS Modules** | Estilos por pantalla y por componente con el sistema visual "Fiesta Jarocha". |
| **Framer Motion** | Animaciones, transiciones, panel deslizable del mapa y arrastrar y soltar en los minijuegos. |
| **Phosphor Icons** | Íconos de la interfaz. |
| **Web Share API** | Compartir la imagen de la ruta y el pasaporte desde el celular. |
| **Vitest** | Pruebas automáticas del frontend. |

## 02. Mapa y geolocalización
**Visualización cartográfica y llegada a los lugares**

| Tecnología | Uso |
|---|---|
| **Mapbox GL + react-map-gl** | Mapa 3D del Centro Histórico, pines de lugares, eventos y comercios, ruta animada por calles. |
| **Mapbox Directions** | Trazo de la ruta a pie por las calles entre paradas. |
| **Bounding Box** | Delimitación de la vista al Centro Histórico. |
| **Geolocation API** | Posición del turista y detección de llegada en un radio de 40 m. |

## 03. Backend
**Lógica de juego y reglas de negocio**

| Tecnología | Uso |
|---|---|
| **FastAPI (Python)** | API propia: sesión, catálogo, llegadas, retos, ruta, pasaporte, canjes y vitrina. |
| **httpx** | Consultas del backend a Supabase (REST y Auth). |
| **Algoritmo de ruta** | Selección por intereses y tiempo, orden por vecino más cercano y mejora 2-opt. |
| **PyJWT** | Validación local del token de la sesión anónima (llaves públicas de Supabase). |
| **pytest** | Pruebas automáticas del backend. |

## 04. Base de datos y sesión
**Datos del catálogo y progreso del turista**

| Tecnología | Uso |
|---|---|
| **Supabase** | Plataforma de base de datos y autenticación detrás del backend. |
| **PostgreSQL** | Lugares, retos, comercios, eventos, visitas, rutas, canjes y el libro de doblones. |
| **Supabase Auth (sesión anónima)** | Un usuario por celular, sin cuenta ni contraseña. |
| **RLS + función SQL** | Tablas cerradas al navegador y canje atómico de doblones. |

## 05. Internacionalización
**Soporte multidioma**

| Tecnología | Uso |
|---|---|
| **react-i18next** | Interfaz y contenido bilingües (Español / Inglés). |

## 06. Despliegue
**Publicación y alojamiento**

| Tecnología | Uso |
|---|---|
| **Vercel** | Publicación del frontend y del backend en el mismo dominio. |
| **GitHub** | Control de versiones con commits convencionales en español. |

---

## Arquitectura tecnológica

```text
            CELULAR DEL TURISTA
         React + Vite (SPA, ES/EN)
                     |
          +----------+----------+
          |                     |
       MAPBOX              /api/*  (mismo dominio)
   (mapa, ruta, pines)          |
                         FASTAPI (Python)
                   ruta · retos · doblones · canjes
                                |
                            SUPABASE
                  PostgreSQL + sesión anónima
                                |
                             VERCEL
                     (frontend + backend)
```

El navegador nunca habla directo con la base de datos: todo pasa por el backend, que valida las respuestas de los retos y es el único que puede sumar o restar doblones.

# Bitácora de IA
El equipo usó inteligencia artificial como apoyo durante el hackathon; todo lo generado se revisó, probó y ajustó a mano antes de integrarlo.

| Etapa | Herramienta | Uso | Revisión humana |
| --- | --- | --- | --- |
| Planeación | Gemini | Plan de módulos y dependencias, reparto entre 3 desarrolladores y lienzo de diseño de las pantallas. | El equipo validó decisiones, cambió el nombre y la moneda. |
| Investigación | Gemini | Inventario de sitios del Centro Histórico y verificación de leyendas (p. ej. se descartó el Callejón del Diamante por ser de Xalapa). | Se conservó solo información con fuente; contenido pendiente de validar con un cronista. |
| Backend y datos | Claude Code | Esquema y migraciones de la base, API de retos, ruta, pasaporte, canjes y vitrina, carga del seed, ubicación de lugares con OpenStreetMap/Mapbox y pruebas. | Cada cambio se revisó y aprobó antes del commit; se probó contra la base real y en producción. |
| Frontend y mapa | Claude Code | Apoyo en componentes, mapa y animaciones. | Revisado por cada desarrollador. |
| Contenido | Claude Code | Redacción de curiosidades y retos en español e inglés a partir del CSV y la investigación. | Revisado por el equipo; ningún dato sin fuente. |


# Datos
- Grajeda Rosado, R. M., Diaz Olaldez, M., Prieto Alonso, E. T., y Mondragón Olán, M. (2025). Informe: Opinión pública del Centro de Veracruz. La voz de los veracruzanos: Percepción y desafíos en el Centro de Veracruz. Observatorio Universitario Metropolitano de Veracruz; Universidad Veracruzana. https://www.uv.mx/veracruz/omv/files/2025/09/2025-Encuesta-Informe.pdf
- Las promociones de los comercios son de **demostración** y no implican un acuerdo con los negocios.
