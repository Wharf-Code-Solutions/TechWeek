# Problema
A pesar de contar con atractivos históricos, culturales y turísticos de primer nivel, el Centro Histórico de Veracruz no logra retener a los visitantes ni integrarlos plenamente en la vida comercial y cultural local. Los recorridos suelen ser breves y carecen de conexión con la oferta comercial, por lo que el gasto por visitante es bajo y el flujo turístico no se traduce en un consumo significativo para los negocios de la zona.

Esta situación reduce la rentabilidad de los comercios, favorece el cierre temprano o definitivo de negocios y contribuye a la vacancia de locales. A su vez, la pérdida de actividad comercial genera menos empleos y una menor recaudación municipal, lo que limita los recursos disponibles para el mantenimiento, la seguridad y la mejora del espacio público.

Como resultado, el Centro Histórico pierde atractivo y competitividad frente a otros destinos, y desaprovecha su potencial como motor económico y cultural de la ciudad. La falta de difusión efectiva de eventos y actividades agrava esta problemática, ya que impide que visitantes y residentes descubran y participen en la oferta cultural y comercial disponible.
# Usuarios 
El proyecto estará dirigido a tres grupos principales:

- **Visitantes y turistas**, quienes podrán conocer de manera más clara la oferta cultural, gastronómica, comercial y de servicios del Centro Histórico, así como descubrir eventos, rutas y experiencias que incentiven una estancia más larga.

- **Comerciantes y prestadores de servicios del centro**, incluyendo tiendas, restaurantes, cafeterías, hoteles, guías, artesanos y otros negocios, quienes podrán dar mayor visibilidad a sus productos, servicios y actividades, y atraer con mayor eficacia al flujo de visitantes.

- **Autoridades de turismo y cultura**, quienes podrán utilizar la plataforma o herramienta como un medio para difundir eventos, coordinar acciones con el sector empresarial y obtener información sobre la afluencia, preferencias y necesidades de los visitantes.
# ¿Comó usar ... ?
# ¿Comó instalar ...?
# Tecnológias
## 01. Frontend
**Interfaz de usuario**

| Tecnología | Uso |
|---|---|
| **React + Vite** | Desarrollo y compilación de la aplicación web SPA. |
| **React Router** | Navegación entre mapa, pasaporte, retos y agenda. |
| **CSS Modules** | Gestión de estilos independientes por componente. |
| **Framer Motion** | Animaciones, transiciones y funcionalidades Drag & Drop. |

## 02. Mapa 3D
**Geolocalización y visualización cartográfica**

| Tecnología | Uso |
|---|---|
| **Mapbox GL** | Motor cartográfico y visualización del mapa 3D. |
| **react-map-gl** | Integración de Mapbox con React. |
| **Extrusión 3D** | Representación tridimensional de edificios y elementos urbanos. |
| **Bounding Box** | Delimitación de la vista al Centro Histórico. |

## 03. Cámara y códigos QR
**Interacción con el entorno físico**

| Tecnología | Uso |
|---|---|
| **html5-qrcode** | Escaneo y lectura de códigos QR mediante la cámara del dispositivo desde el navegador. |

## 04. Backend y base de datos
**Gestión de información y autenticación**

| Tecnología | Uso |
|---|---|
| **Supabase** | Plataforma backend para gestionar los servicios de la aplicación. |
| **PostgreSQL** | Base de datos para usuarios, locaciones, retos y Tlacos. |
| **Supabase Auth** | Autenticación y administración de usuarios. |
| **Google OAuth** | Inicio de sesión mediante cuentas de Google. |

## 05. Internacionalización
**Soporte multidioma**

| Tecnología | Uso |
|---|---|
| **react-i18next** | Implementación de una interfaz bilingüe (Español / Inglés). |

## 06. Despliegue
**Publicación y alojamiento**

| Tecnología | Uso |
|---|---|
| **Vercel** | Alojamiento, publicación y despliegue de la aplicación web en producción. |

---

## Arquitectura tecnológica

```text
                  REACT + VITE
                (Frontend / SPA)
                       |
          +------------+------------+
          |            |            |
       MAPBOX       SUPABASE    HTML5-QRCODE
       (Mapa 3D)    (Backend)    (Escáner QR)
                       |
                 POSTGRESQL
                 (Base de datos)
                       |
                  VERCEL
                (Despliegue)
```

# Bitacora de IA
# Datos
- Grajeda Rosado, R. M., Diaz Olaldez, M., Prieto Alonso, E. T., y Mondragón Olán, M. (2025). Informe: Opinión pública del Centro de Veracruz. La voz de los veracruzanos: Percepción y desafíos en el Centro de Veracruz. Observatorio Universitario Metropolitano de Veracruz; Universidad Veracruzana. https://www.uv.mx/veracruz/omv/files/2025/09/2025-Encuesta-Informe.pdf
