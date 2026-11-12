# JARANA - Juego, Aventura, Recorridos, Arte, Negocios y Alegría

Plataforma web turística y gamificada del **Centro Histórico de Veracruz**. El turista entra desde su celular, elige qué le gusta y cuánto tiempo tiene, y JARANA le arma una ruta a pie por los lugares del Centro. En cada parada desbloquea una curiosidad y un minijuego, gana **doblones** (la moneda de JARANA), sellos y piezas de un rompecabezas, y canjea sus doblones en comercios locales.

🌐 **Demo en vivo:** https://techweek-eta.vercel.app

---

# Problema
A pesar de contar con atractivos históricos, culturales y turísticos de primer nivel, el Centro Histórico de Veracruz no logra retener a los visitantes ni integrarlos plenamente en la vida comercial y cultural local. Los recorridos suelen ser breves y carecen de conexión con la oferta comercial, por lo que el gasto por visitante es bajo y el flujo turístico no se traduce en un consumo significativo para los negocios de la zona.

Esta situación reduce la rentabilidad de los comercios, favorece el cierre temprano o definitivo de negocios y contribuye a la vacancia de locales. A su vez, la pérdida de actividad comercial genera menos empleos y una menor recaudación municipal, lo que limita los recursos disponibles para el mantenimiento, la seguridad y la mejora del espacio público.

Como resultado, el Centro Histórico pierde atractivo y competitividad frente a otros destinos, y desaprovecha su potencial como motor económico y cultural de la ciudad. La falta de difusión efectiva de eventos y actividades agrava esta problemática, ya que impide que visitantes y residentes descubran y participen en la oferta cultural y comercial disponible.

---

# Usuarios
El proyecto estará dirigido a tres grupos principales:

- **Visitantes y turistas**, quienes podrán conocer de manera más clara la oferta cultural, gastronómica, comercial y de servicios del Centro Histórico, así como descubrir eventos, rutas y experiencias que incentiven una estancia más larga.

- **Comerciantes y prestadores de servicios del centro**, incluyendo tiendas, restaurantes, cafeterías, hoteles, guías, artesanos y otros negocios, quienes podrán dar mayor visibilidad a sus productos, servicios y actividades, y atraer con mayor eficacia al flujo de visitantes.

- **Autoridades de turismo y cultura**, quienes podrán utilizar la plataforma o herramienta como un medio para difundir eventos, coordinar acciones con el sector empresarial y obtener información sobre la afluencia, preferencias y necesidades de los visitantes.

---

# ¿Cómo usar JARANA?
No hay que instalar nada ni crear una cuenta: se abre en el navegador del celular y el progreso se guarda en ese dispositivo con una sesión anónima.

1. **Arma tu ruta.** Elige idioma (español, inglés o francés), cuánto tiempo tienes (de 30 min a 5 h) y qué te gusta: historia, leyendas, música, comida, mar o artesanía. JARANA calcula una ruta a pie con los lugares que más te interesan y que caben en tu tiempo, y evita los que en ese momento están llenos.
2. **Camina el Centro.** El mapa te muestra la ruta por las calles y una línea amarilla hasta tu siguiente parada. Si te desvías (más de 60 m durante 5 s), esa línea se recalcula por otras calles hasta la misma parada. Lo que ya recorriste se queda marcado en turquesa como checkpoint. Al llegar a menos de 40 m de un lugar (por GPS) el mapa se acerca y aparece **¡Llegaste!** con una curiosidad del sitio. Si estás lejos del Centro o sin GPS, sales a una cuadra del Zócalo y te mueves tocando el mapa.
   - En la lista de la ruta, cada parada tiene un **punto de color** según cuánta gente hay: 🟢 tranquilo, 🟡 concurrido, 🔴 lleno. Si la siguiente parada está llena, JARANA te sugiere una alternativa tranquila cercana.
   - Puedes **saltar** una parada: se queda en la lista marcada como saltada y la ruta sigue con la siguiente.
   - Si tu celular va lento, el mapa activa solo el **modo ligero** (sin edificios 3D ni animaciones); también puedes activarlo desde el menú del mapa.
3. **Juega el reto del lugar** y gana doblones:
   - *Completa la frase* o la leyenda (50 doblones).
   - *Ordena los hechos* de la historia (60).
   - *Trivia*, *¿verdadero o falso?* y *¿cuál es el intruso?*: retos de un toque (30).
   - Si fallas, puedes "seguir" con menos doblones: nunca te quedas atorado.
4. **Colecciona.** Cada reto te da un sello en tu **pasaporte** y una pieza del **rompecabezas** de una foto o postal del puerto.
5. **Descubre y canjea.** En el panel del mapa están tu **cartera**, la **agenda** de eventos del Centro y la **vitrina** de comercios (cafés, restaurantes, fondas, librerías, tiendas y artesanías). Canjea tus doblones por promociones deslizando el cupón frente al mesero.
6. **Termina la ruta** para recibir el bono final y doblones extra por la distancia recorrida, y compártela.

---

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

---

# Tecnologías
JARANA es una aplicación web que se abre en el navegador del celular, sin instalar nada. Se eligieron herramientas conocidas y con versión gratuita para que el equipo pudiera construir, probar y publicar en pocos días: una interfaz en React, una API propia en Python que concentra las reglas del juego, una base de datos en Supabase y un mapa de Mapbox. Cada sección explica qué parte del producto resuelve cada tecnología.

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
| **Mapbox Directions** | Trazo de la ruta a pie por las calles entre paradas y recálculo de la guía cuando el turista se desvía. |
| **Bounding Box** | Delimitación de la vista al Centro Histórico. |
| **Geolocation API** | Posición del turista y detección de llegada en un radio de 40 m. |

## 03. Backend
**Lógica de juego y reglas de negocio**

| Tecnología | Uso |
|---|---|
| **FastAPI (Python)** | API propia: sesión, catálogo, llegadas, retos, ruta, pasaporte, canjes y vitrina. |
| **httpx** | Consultas del backend a Supabase (REST y Auth). |
| **Algoritmo de ruta** | Selección por intereses y tiempo, orden por vecino más cercano y mejora 2-opt; resta peso a los lugares concurridos y deja fuera los llenos. |
| **Afluencia** | Ocupación de cada lugar con las llegadas de la última hora entre su capacidad (30 por hora): menos de 50 % tranquilo, de 50 % a 99 % concurrido, 100 % o más lleno. |
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
| **react-i18next** | Interfaz y contenido en español, inglés y francés. Si un texto aún no está en francés se muestra en inglés, y los retos se juegan y validan en ese idioma. |

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
        React + Vite (SPA, ES/EN/FR)
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

**Seguridad.** Que el backend sea la única puerta evita que alguien se invente doblones o respuestas desde el celular, y mantiene las llaves de la base fuera del navegador. El mapa es lo único que el celular consulta por su cuenta, y solo para dibujar. Como frontend y backend viven en el mismo dominio, no hay configuración de permisos entre ambos y la app sigue sencilla de desplegar.

**Afluencia.** Para que muchos turistas a la vez no terminen todos en el mismo lugar, el servidor cuenta cuántas personas llegaron a cada sitio en la última hora y cuántas llevan una ruta activa hacia él. Los lugares llenos se dejan fuera de las rutas nuevas mientras haya alternativas, y los concurridos pierden prioridad. Esa cuenta solo incluye a quienes usan JARANA: no mide a los turistas que no tienen la app.

---

# Bitácora de IA
El equipo usó inteligencia artificial como apoyo durante el hackathon en tres frentes: **planear** (ordenar el trabajo y repartirlo entre tres desarrolladores), **investigar** (reunir y contrastar información del Centro Histórico) y **programar** (escribir código, pruebas y contenido a partir de lo que el equipo decidía). Las decisiones de producto —qué construir, el nombre del proyecto, la moneda (doblones) y las reglas del juego— las tomó el equipo, y todo lo generado se revisó, probó y ajustó antes de integrarlo.

| Etapa | Herramienta | Uso | Revisión humana |
| --- | --- | --- | --- |
| Planeación | Gemini | Plan de módulos y dependencias, reparto entre 3 desarrolladores y lienzo de diseño de las pantallas. Sirvió para saber qué podía avanzar en paralelo y qué dependía de qué. | El equipo validó cada decisión, cambió el nombre del proyecto y de la moneda, y ajustó el alcance al tiempo disponible. |
| Investigación | Gemini | Inventario de 104 sitios del Centro Histórico en un CSV, con dirección, vigencia en 2026, horario, descripción y fuente de cada uno. También se contrastaron las leyendas con fuentes publicadas; por ejemplo, se descartó el Callejón del Diamante porque pertenece a Xalapa y no a Veracruz. | Se conservó solo información con fuente; contenido pendiente de validar con un cronista. |
| Backend y datos | Claude Code | Esquema y migraciones de la base, API de retos, ruta, pasaporte, canjes y vitrina, carga del seed, ubicación de lugares con OpenStreetMap y Mapbox, algoritmo de ruta y de reparto de gente, y pruebas automáticas. | Cada cambio importante se revisó y se probó contra la base real y en producción; antes de publicar se realizó la compilación, el análisis de código y las pruebas automáticas. |
| Frontend y mapa | Claude Code | Apoyo en componentes, mapa, animaciones, pantalla de carga y estilos. | Revisado por cada desarrollador. |
| Contenido | Claude Code | Redacción de curiosidades y retos en español e inglés a partir del CSV de sitios y la investigación, y su traducción al francés. | Revisado por el equipo; ningún dato sin fuente. Las traducciones al francés de los retos de "completa la frase" están pendientes de revisión por un hablante nativo. |

## ¿Cómo se trabajó con la IA?
Se le pedía una tarea concreta (por ejemplo, "armar la ruta según intereses y tiempo"), se revisaba lo que proponía y se probaba antes de aceptarlo. El resultado se comprobaba siempre con la aplicación abierta y, cuando algo no funcionaba, se corregía en una nueva ronda. El historial de decisiones y pendientes de cada jornada se llevó en un archivo de seguimiento del proyecto (`memory.md`), que permitió retomar el trabajo sin perder contexto.

---

# Datos
JARANA trabaja con dos clases de datos. La primera es el **contenido del Centro Histórico**: los lugares que se visitan, los retos, los comercios y los eventos. Es información que el equipo reunió antes de la demostración y que vive en un solo archivo (`src/data/seed.json`), de donde se carga a la base de datos. La segunda son los **datos que genera cada turista al usar la app**: su ruta, sus visitas y sus doblones.

## Contenido del Centro Histórico

Son **34 lugares**, las paradas de la ruta, cada uno con su curiosidad en español e inglés; salen de un inventario de 104 sitios (`sitios-turisticos-veracruz.csv`) y sus coordenadas se ubicaron con OpenStreetMap y Mapbox. Cada lugar tiene su **reto** (34 en total), un minijuego escrito a partir de su curiosidad que da doblones y un sello en el pasaporte. Las **6 fotos históricas** (una fotografía de dominio público y cinco ilustraciones del proyecto) se arman como rompecabezas.

La vitrina reúne **37 comercios** del mismo inventario (librerías, fondas, tiendas, cafeterías y otros negocios, con dirección y horario) y **4 promociones** de ejemplo que se canjean con doblones. La agenda del Centro muestra **20 eventos** de ejemplo.

## Datos que genera el turista
Cada celular abre una sesión anónima: no se pide nombre, correo ni contraseña. Con esa sesión la app guarda las **visitas** a cada lugar (qué lugar y a qué hora), la **ruta** armada (los lugares, el tiempo elegido y los intereses) y el **libro de doblones** (cada ganancia y cada canje). Sirven para tres cosas: recordar el progreso del turista y su pasaporte, validar que cada recompensa se cobre una sola vez, y calcular cuánta gente hay en cada lugar para repartir mejor las rutas.

## Alcance de la información
Las promociones y los 20 eventos son de demostración: muestran cómo funcionan la vitrina y la agenda, y no implican un acuerdo con los negocios. La afluencia se calcula con las personas que usan JARANA. Cualquier cifra de una simulación se identifica como tal.

**Fuentes consultadas**
- Grajeda Rosado, R. M., Diaz Olaldez, M., Prieto Alonso, E. T., y Mondragón Olán, M. (2025). Informe: Opinión pública del Centro de Veracruz. La voz de los veracruzanos: Percepción y desafíos en el Centro de Veracruz. Observatorio Universitario Metropolitano de Veracruz; Universidad Veracruzana. https://www.uv.mx/veracruz/omv/files/2025/09/2025-Encuesta-Informe.pdf
- E-Consulta Veracruz. (2024, 29 de octubre). Las leyendas de Veracruz: Marina y la Condesa de Malibrán. https://e-veracruz.mx/nota/2024-10-29/municipios/las-leyendas-de-veracruz-marina-y-la-condesa-de-malibran
- Gobierno del Estado de Veracruz. (2026, 20 de octubre). Inaugura SECVER las exposiciones La piel de la ciudad y Galería. https://www.veracruz.gob.mx/2026/10/20/inaugura-secver-las-exposiciones-la-piel-de-la-ciudad-y-galeria-imagen-de-veracruz/
- H. Ayuntamiento de Veracruz. (2023). Programa Municipal de Desarrollo Urbano de Veracruz, Ver. Gobierno Abierto Veracruz. https://gobiernoabierto.veracruzmunicipio.gob.mx/wp-content/uploads/2023/11/PROGRAMA-MUNICIPAL-DE-DESARROLLO-URBANO-DE-VERACRUZ-VER.pdf
- H. Ayuntamiento de Veracruz. (2023). Reglamento del Centro Histórico del Municipio de Veracruz, Ver. Gobierno Abierto Veracruz. https://gobiernoabierto.veracruzmunicipio.gob.mx/wp-content/uploads/2023/04/Reglamento-del-Centro-Hist%C3%B3rico-del-Municipio-de-Veracruz-Ver..pdf
- H. Ayuntamiento de Veracruz. (2024). Plan Municipal de Desarrollo 2022 - 2025. Municipio de Veracruz. Gobierno Abierto Veracruz. https://gobiernoabierto.veracruzmunicipio.gob.mx/wp-content/uploads/2024/01/Plan-Municipal-de-Desarrollo-2022-2025.pdf
- InfoVeracruz. (2025, 8 de diciembre). Baluarte de Santiago podría reabrir sus puertas para el primer trimestre del 2026. https://infoveracruz.com.mx/index.php/2025/12/08/baluarte-de-santiago-podria-reabrir-sus-puertas-para-el-primer-trimestre-del-2026/
- La Silla Rota. (2024, 3 de febrero). Negocios antiguos que han sobrevivido al abandono en el Centro Histórico de Veracruz. https://lasillarota.com/veracruz/2024/2/3/negocios-antiguos-que-han-sobrevivido-al-abandono-en-el-centro-historico-de-veracruz-380886.html
- La Silla Rota. (2026, 5 de septiembre). Centro comercial de Rayón: el más antiguo de Veracruz que aún sobrevive con arquitectura única. https://lasillarota.com/veracruz/reportajes/2026/9/5/centro-comercial-de-rayon-el-mas-antiguo-de-veracruz-que-aun-sobrevive-con-arquitectura-unica-527411.html
- Las promociones de los comercios son de **demostración** y no implican un acuerdo con los negocios.
