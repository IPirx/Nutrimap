# NutriMap Estudiantil · Landing page (sitio informativo)

Sitio público del proyecto **NutriMap Estudiantil: Gestor y Radar Nutricional** (HCI for UX Design, 1ASI0784, UPC, 2026-20).
Es un espacio **independiente de la app**: aquí se explica el servicio y desde aquí se entra a la app (`../app/index.html`). No contiene el radar, el plan ni los paneles de comercio y revisor; eso vive en la app.

Solo HTML, CSS y JavaScript nativos, sin recursos externos. Archivos: `pages/index.html`, `css/styles.css`, `js/main.js`, `js/data.js` y `assets/`.

## Historias de usuario que implementa

| HU | Sección | Pantalla de diseño |
|---|---|---|
| US37 Propuesta de valor | Hero: título, frase y botón principal visibles sin desplazarse | W08 |
| US38 Cómo funciona | 4 pasos con ilustración y texto alternativo, enlazado desde el menú | W08 |
| US39 Beneficios por perfil | Pestañas Estudiantes / Comercios / Nutricionistas con flechas | W08 |
| US40 Radar de ejemplo | Filtros de presupuesto y distancia con locales simulados y aviso «Datos de ejemplo» | W08 |
| US41 Solicitud de información | Formulario con validación de correo | W08 |
| US42 Lista de espera | Correo, campus, consentimiento y sin duplicados | W08 |
| US43 Preguntas frecuentes | Acordeón accesible, una abierta a la vez | W08 |
| US44 Conocer al equipo | Foto, nombre y rol | W08 |
| US45–US47 | Responsive 360 / 768 / 1440 px, accesibilidad y carga rápida | W14 |

## Accesos a la app

Todos los enlaces a la app son relativos (`../app/index.html…`). Apuntan al archivo y no a la carpeta, porque al abrir el sitio con doble clic (`file://`) el navegador muestra el contenido de la carpeta en vez de abrir su `index.html`:
- «Abrir la app» y «Crear cuenta gratis» (estudiante).
- «Entrar como comercio» → `../app/index.html#/acceso-rol?r=com`.
- «Entrar como nutricionista» → `../app/index.html#/acceso-rol?r=rev`.
