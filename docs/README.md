# NutriMap Estudiantil · Landing y app

La landing y la app comparten los recursos (`assets/`) y se enlazan entre sí. Estructura lista para GitHub Pages:

```
web/
├── index.html            Entrada del sitio: redirige a pages/index.html
├── favicon.ico           Ícono del sitio (también hay favicon.svg en assets/icons/)
├── .gitignore            Archivos que Git ignora
├── assets/               Recursos de la landing y de la app
│   ├── images/           Logo, ilustraciones, pasos y fotos del equipo
│   ├── icons/            favicon.svg
│   ├── fonts/            Bricolage Grotesque (woff2)
│   └── videos/           Videos o multimedia (vacía por ahora)
├── css/styles.css        Estilos de la landing
├── js/                   main.js (interacciones de la landing) y data.js (datos de ejemplo)
├── pages/index.html      Landing page (US37–US47)
├── app/                  La aplicación (estudiante, comercio y nutricionista revisor)
│   ├── index.html        Enlace «Ir al sitio» en el encabezado y el pie
│   ├── css/app.css       Tokens de la guía de estilos 4.1 y componentes
│   └── js/               seed · core · model · student-radar · student-life · auth · biz · rev · main
└── docs/                 README.md (este archivo) y landing.md
```

Los enlaces entre la landing y la app son relativos y apuntan a los archivos (`../app/index.html`, `../pages/index.html`), no a las carpetas, así que funcionan igual abriendo los archivos con doble clic, en un servidor local o en GitHub Pages.

## Cómo probarlo

```bash
cd web
python -m http.server 8000
# landing:  http://localhost:8000/pages/
# app:      http://localhost:8000/app/
```

Los datos (cuentas, plan, favoritos, reportes, artículos, etiquetas) se guardan en el `localStorage` del navegador; no hay servidor. Todos los locales, precios y artículos son de ejemplo.

## Cuentas de demostración (contraseña `Demo1234`)

| Rol | Correo | Qué demuestra |
|---|---|---|
| Estudiante | `estudiante@demo.pe` | Cuenta de ejemplo para probar ingreso, plan y favoritos |
| Comercio | `dona.rosa@demo.pe` | Menú Doña Rosa: oferta publicada, 2 reportes nuevos, etiquetas pendiente / aprobada / observada |
| Comercio | `nuevo.comercio@demo.pe` | Sin negocio: recorre registro, ubicación y primera publicación |
| Comercio | `sangrecita.lucho@demo.pe` | Sangrecita Don Lucho |
| Nutricionista | `nutri@upc.edu.pe` | Bandeja con 2 artículos y 2 etiquetas por revisar, borrador con comentarios e historial |

Al abrir la app, la primera pantalla pregunta el rol (`#/rol`: estudiante, comercio o nutricionista). El estudiante puede usar la app sin cuenta o crear una (`#/registro`); comercio y nutricionista pasan por `#/acceso-rol`. «Cambiar rol» en el pie vuelve a esa pantalla.

## Cómo se conectan los tres roles

- Lo que **publica el comercio** aparece en el **radar** del estudiante.
- Lo que **reporta el estudiante** desde la ficha llega a **Reportes** del comercio, que lo corrige o lo marca «No aplica».
- La **etiqueta de hierro** que solicita el comercio entra a la bandeja del revisor y solo se muestra a los estudiantes cuando el revisor la **aprueba**.
- El artículo que **aprueba el revisor** aparece en **Aprende**; si pide cambios, vuelve a «Borrador» con sus comentarios por fragmento y el autor lo ve en **Contenido**.

## Pantallas de la app

Las rutas siguen los mockups (M01–M53, W01–W23) y los user flows F01–F15:

| Rol | Ruta | Pantallas | Historias |
|---|---|---|---|
| Estudiante | `#/bienvenida`, `#/ubicacion` | M01, M02 | US10 |
| | `#/inicio` | M03 | US26, US03 |
| | `#/radar` (mapa y lista, filtros, sin resultados, carga) | M04, M05, M23, M44, M50, W01 | US01, US02, US17, US18, US47 |
| | `#/comparar` | M27, W16 | US27 |
| | `#/local/:id`, `…/ruta`, `…/reportar` | M06, M07, M24, M28, W02 | US15, US16, US19, US09 |
| | `#/plan`, `#/plan/presupuesto`, `#/historial` | M08, M09, M29, M33, W03 | US03, US14, US20, US25 |
| | `#/lista`, `#/lista?edit=1`, compartir | M10, M30, M31 | US04, US22, US23 |
| | `#/gasto`, `#/recordatorios` | M32, M22 | US26, US24 |
| | `#/aprende`, `#/articulo/:id`, `#/receta/:id` | M11, M25, M26, W04 | US05, US21 |
| | `#/perfil` (favoritos, preferencias, privacidad) | M12, M20, M21, M34, M52 | US09, US10, US14, US48 |
| Cuenta | `#/registro`, `#/ingresar`, `#/recuperar`, `#/restablecer`, `#/restablecer-vencido` | M17, M18, M19, M45, M51 | US11, US12, US13, US48 |
| | `#/acceso-rol` | M49, W23 | US12 |
| Comercio | `#/com/registro`, `#/com/ubicacion` | M35, M36, W17 | US28, US29 |
| | `#/com/hoy` (inicio), `#/com/oferta` | M37, W12 · M13, M40, W05 | US06, US07, US30, US31 |
| | `#/com/perfil`, `#/com/visibilidad` | M14, M53 | US07, US32 |
| | `#/com/reportes`, `#/com/etiquetas` | M38, M39 | US31, US33 |
| Nutricionista | `#/rev`, `#/rev/articulo/:id` | M15, M16, M43, M47, W06, W18, W19 | US08, US34 |
| | `#/rev/etiqueta/:id` | M41, M48, W20 | US35 |
| | `#/rev/historial/:id` | M42, W21 | US36 |
| | `#/rev/contenido`, `#/rev/autor/:id` | M46, W22 | US34 |

## Decisiones que conviene conocer

- **Navegación:** barra inferior en móvil y barra superior desde 768 px, como en los mockups. El comercio y el revisor tienen su propia navegación (3 ítems), separada de la del estudiante.
- **Orden del radar:** por distancia (US01 CA02). «Priorizar fuentes de hierro» está desactivado por defecto; al activarlo, los locales con hierro aprobado van primero.
- **Presupuesto y radar (US14 CA02):** el presupuesto semanal se convierte en un filtro inicial de «presupuesto por comida» (el chip más cercano por debajo de presupuesto ÷ 7, p. ej. S/ 90 → «Hasta S/ 12»), que se puede quitar.
- **Recuperar contraseña (US13):** es una simulación sin correo real: la pantalla ofrece botones de demostración para abrir el enlace válido o uno vencido.
- **Contraseñas:** se guardan con SHA-256 en el navegador para demostrar el criterio de US48. En producción deben cifrarse en el servidor (bcrypt o Argon2) y viajar por HTTPS.
- **Recordatorios (US24):** notifican mientras la app está abierta o con el permiso de notificaciones del navegador.

## Despliegue en GitHub Pages

Sube la carpeta `web/` a la raíz del repositorio (rama `main`) y en **Settings → Pages** elige «Deploy from a branch», `main`, `/ (root)`. Quedan:
`https://<usuario>.github.io/<repositorio>/` (redirige a la landing), `…/pages/` y `…/app/`.
