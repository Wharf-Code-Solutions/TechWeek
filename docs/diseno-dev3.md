# Diseño · Cambios pendientes en las pantallas de Dev 3

> De Dev 2 (Luis) para Dev 3 (Manuel) · 11 nov 2026.
> Fuente: el HTML del diseño "Clacos · Centro Histórico de Veracruz" (pídelo a Luis; no está en git, pesa 7.7 MB).
> Las pantallas de Dev 2 (mapa, panel, retos, pasaporte, agenda y fin) ya siguen el diseño.

## Lo que ya tienes sin hacer nada

- **Banderines** de papel picado del diseño en todas las pantallas que usan `<Banderines />`.
  Ahora aceptan color: `<Banderines fondo="#150A2E" />` (los recortes toman ese color; usa hex, no `var()`).
- **Ilustraciones a color** en `<Ilustracion nombre="..." />`. Disponibles: los `ilustracion` de los lugares,
  las categorías (`historia`, `leyendas`, `musica`, `comida`, `mar`, `artesania`), `moneda`, `puzzle`, `foco`,
  `avatar-flor`, `avatar-sombrero`, `avatar-gorra`, `avatar-paliacate`, `escena-leyenda`, `escena-puerto`.
  Para una imagen de fondo: `urlIlustracion(nombre)` de `src/components/ui/ilustraciones.ts`.
- **Abrir el mapa en una pestaña del panel:** `navigate('/mapa', { state: { pestana: 'cartera' } })`
  (`ruta`, `agenda`, `pasaporte` o `cartera`).

## No copiar del diseño

- El diseño dice **Clacos** y **Callejón del Diamante**: usamos **Tlacos**, **JARANA** y el **Solar de la Condesa de Malibrán**.
- Textos marcados entre corchetes (`[Café aliado]`, `[validar con cronista]`) son de relleno.

## Pantalla por pantalla

### 01 · Preferencias (`src/pages/Preferencias.tsx`)
El diseño la muestra como **hoja blanca sobre el mapa** (fondo lila rayado arriba, hoja desde y≈128 con borde redondeado y asa).
- Encabezado: "JARANA" en Shrikhand rosa 26px a la izquierda; selector **ES / EN** a la derecha en una píldora tinta (activo en amarillo).
- Título "¡Bienvenido al puerto!" (Shrikhand 26px) y bajada "Dinos qué te gusta y armamos tu ruta por el Centro Histórico." (14px, `#4A3F66`).
- **Falta: "Tu personaje".** Cuatro avatares de 44px en botones de 52px (`avatar-sombrero`, `avatar-flor`, `avatar-gorra`, `avatar-paliacate`), el elegido con borde; y un campo **"Tu apodo"** (input de 102×48).
  → **Guárdalo en las preferencias** (`personaje`, `apodo`): el mapa y el pasaporte hoy usan `AVATAR = 'avatar-flor'` fijo en `src/features/pasaporte/tipos.ts` y el nombre "Jarochita". Cuando lo guardes, avísame y lo conecto.
- Etiquetas de sección en morado 12px mayúsculas ("TU PERSONAJE", "¿CUÁNTO TIEMPO TIENES?", "¿QUÉ TE INTERESA?").
- Tiempos: 4 botones de 82×45 blancos con borde; el elegido en amarillo.
- Intereses: rejilla 3×2 de tarjetas con la ilustración de 40px arriba y el nombre abajo; elegidas en amarillo claro `#FFF3B0` con borde tinta y sombra, el resto lila `#F4F1FA`. Usa `<Ilustracion nombre={categoria} tamano={40} />`.
- Botón "Armar mi ruta" rosa a todo lo ancho.

### 02 · Permiso de ubicación (`src/features/geo/PermisoUbicacion.tsx`)
**Tarjeta blanca centrada sobre el mapa** (borde 3px tinta, radio grande, sombra amarilla abajo).
- Ilustración de un **pin rosa con un castillo** sobre un círculo turquesa (170×150; está en el diseño, puedo pasártela como SVG).
- Título "Te avisamos cuando llegues" (Shrikhand, centrado).
- Texto: "Usamos tu ubicación para desbloquear la curiosidad y el minijuego de cada lugar al llegar. Solo mientras tengas la página abierta."
- Botón rosa "Permitir ubicación" con ícono de mira; enlace morado subrayado "Ahora no: modo explorador"; nota chica "En modo explorador ves las curiosidades, pero no ganas Tlacos ni sellos."

### 04 · ¡Llegaste! (`src/pages/Lugar.tsx`)
**Hoja blanca desde y≈140** sobre el mapa centrado en el lugar.
- Arriba de la hoja, una **escena ilustrada de 250px** con fondo `#2E1A66` y esquinas redondeadas; encima, la píldora amarilla "¡Llegaste!" (izquierda) y un botón blanco redondo de 49px (derecha, cerrar).
  Puedes usar `escena-leyenda` / `escena-puerto` según la categoría mientras no haya una por lugar.
- Antetítulo morado 12px: "LEYENDA · PARADA 2 DE 5" (categoría y número de parada; la ruta está en `api.rutaActual()`).
- Nombre del lugar en Shrikhand 28px.
- Caja lila `#F4F1FA` con `<Ilustracion nombre="foco" />` de 40px, "¿Sabías que…?" en negritas y la curiosidad (14px, `#3A2F55`).
- Botón rosa grande "Jugar el reto · +50 Tlacos" (usa `tlacos` del reto) y enlace morado "Ahora no, seguir caminando".

### 05 · Recorrido virtual (`src/features/geo/ControlRecorrido.tsx`)
En el diseño los controles **reemplazan al panel** en la demo (barra abajo, no arriba del mapa):
- Píldora tinta arriba a la izquierda "● RECORRIDO VIRTUAL".
- Barra inferior blanca: "Siguiente: <lugar> (1 de 5)" con la distancia ("78 m"), barra de progreso rosa, botón **atrás** (blanco, cuadrado) y botón **"Avanzar >"** rosa grande.
- Nota: "Toca para dar un paso, mantén presionado para caminar."
- Hoy el mapa lo monta en `abajo` de `MapaLugares`, encima del panel. Si lo rediseñas como barra, dime y en la demo oculto el panel para que no se encimen.

### 08 · Recompensa (`src/pages/Recompensa.tsx`)
**Fondo tinta `#150A2E`** a pantalla completa.
- Arriba, una **ilustración grande de 480px**: la moneda con "+50 TLACOS" y el sello del lugar (en el diseño, del Diamante). Puedes armarla con `<Ilustracion nombre="moneda" />` grande y el sello.
- Título "¡Leyenda desbloqueada!" en Shrikhand 30px **amarillo**; texto blanco 15px "Ganaste 50 Tlacos, el sello de <lugar> y una pieza de la foto oculta."
- Dos botones lado a lado de 170×54: **turquesa** "Pieza 2 de 6" (con `puzzle`) y **morado** "Sello nuevo"; llevan al pasaporte: `navigate('/mapa', { state: { pestana: 'pasaporte' } })`.
- Botón rosa grande "Siguiente parada: <lugar>".

### 13 · Panel: Cartera (`src/features/cartera/Cartera.tsx`)
- Tarjeta **amarilla** de 98px: moneda de 66px, "TUS TLACOS" 12px y la cifra en Shrikhand 40px.
- Título "Gástalos en el puerto" (Shrikhand 22px) con "cerca de ti" en Caveat Brush rosa a la derecha.
- Cada promoción es una fila de color (alternar `#DDF7FA`, `#FFF3B0`, `#E3F7E8`, `#F4F1FA`) con: cuadro blanco de 58px con la ilustración (lechero, volován, nieve, lancha), título 16px, "comercio · distancia" 13px `#4A3F66`, y a la derecha un **botón rosa de 64×50 con el costo arriba y "Canjear" abajo**.
- Si no alcanza: sin botón, "Te faltan N Tlacos" y el costo en gris.
- Ilustraciones de volován, nieve y lancha: están en el diseño; si las quieres te las paso al set.

### 14 · Desliza para canjear (`src/pages/Cupon.tsx`)
**Fondo turquesa** a pantalla completa.
- Botón blanco redondo (volver) arriba a la izquierda; píldora tinta "MUESTRA AL MESERO" en amarillo a la derecha.
- **Boleto blanco** de 354×400 con muescas turquesa a los lados: comercio en `#A0005A` 12px, la promoción en Shrikhand 32px rosa, detalle "Dos lecheros medianos en mesa · 80 Tlacos" y una ilustración grande de 176px.
- Texto: "Desliza **frente al mesero**: una vez canjeado no se puede deshacer."
- Deslizador abajo: barra tinta de 354×72 con relleno rosa y la perilla amarilla de 57px con flecha; texto blanco "Desliza para canjear →".

## Cómo lo hice yo (por si te sirve)
- Saqué medidas y colores abriendo el HTML del diseño y leyendo el `style` de cada elemento.
- Los SVG del diseño se copian tal cual a `src/components/ui/ilustraciones/<nombre>.svg` y quedan disponibles en `<Ilustracion>`.
