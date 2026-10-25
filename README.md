# NeoDat Consultores

Versión mejorada del repositorio público https://github.com/neodats/neodat.

## Ver la web

Con Node.js 22 o posterior, desde esta carpeta:

```sh
node scripts/serve.mjs
```

Abra http://127.0.0.1:4173. Los HTML generados se pueden alojar como archivos estáticos; no necesitan Node en producción. Para probar formularios y navegación use un servidor HTTP, no `file://`.

## Desarrollar y verificar

```sh
npm ci
npm run build
npm run check
npm test
```

- `content/site.json`: servicios, equipo, metodología, ámbitos y catálogo.
- `content/contact-form.html`: estructura del formulario.
- `scripts/build-pages.mjs`: plantillas compartidas de las siete páginas corporativas y del sitemap. Edite aquí las cabeceras, pie y estructura; vuelva a generar los HTML.
- `assets/marketing.css`: diseño corporativo y puntos de adaptación.
- `assets/site.js`: navegación, accesibilidad y utilidades de exportación.
- `assets/finance.js`: cálculos compartidos y probados.
- `assets/js/`: lógica de cada simulador, separada del HTML.
- `assets/admin.js`: acceso de administradores, consultas y exportaciones.
- `assets/vendor/sources.json`: repositorios de origen, revisiones y SHA-256 de los recursos incorporados.

No se incorporó un framework de aplicación: la web conserva alojamiento estático y los nueve simuladores existentes. El contenido institucional conserva las personas y especialidades del proyecto original. No se añadieron testimonios, clientes ni resultados comerciales ficticios.

## Activar el formulario protegido

La entrega incluye la función de servidor y los cambios SQL, pero NO los aplica sobre la base de datos remota ni publica la web automáticamente.

Mientras no haya una clave pública de Turnstile configurada, el formulario permite **preparar un correo**. El visitante completa su envío en su aplicación de correo. No mostramos una confirmación de guardado en ese caso.

Para activar el guardado directo:

1. En una instalación nueva, ejecute primero `supabase/neodat-schema.sql`. En una base existente con esas tablas, no hace falta reinstalar el esquema base.
2. Aplique `supabase/hardening.sql`. Es repetible y preserva los contactos existentes. Revoca la inserción directa de contactos desde el navegador, permite los eventos de interacción y crea un límite atómico de solicitudes.
3. Cree un widget de Cloudflare Turnstile para los dominios utilizados. Configure la **clave pública** en `assets/supabase-config.js`, propiedad `turnstileSiteKey`.
4. Despliegue `supabase/functions/submit-contact/index.ts` con el nombre `submit-contact`. La configuración `verify_jwt = false` es intencionada: el endpoint admite visitantes sin cuenta y verifica CAPTCHA, origen y campos en su propio código. No reutilice esta configuración para funciones administrativas.
5. Configure los secretos del servidor: `TURNSTILE_SECRET_KEY`, `CONTACT_RATE_SALT` (valor aleatorio privado, de al menos 32 caracteres) y, si su entorno no los suministra, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Nunca ponga una clave secreta en los archivos de la web.
6. `ALLOWED_ORIGINS` acepta orígenes separados por comas; el valor predeterminado admite `https://www.neodat.net` y `https://neodat.net`. Para preproducción, añada su origen y configure también Turnstile para ese hostname. Actualice `contactEndpoint` si cambia el proyecto.
7. Pruebe un envío en preproducción con CAPTCHA real: debe aparecer una sola fila en `contact_leads`, incluso al reintentar una petición con el mismo `request_id`. Confirme también el rechazo de CAPTCHA inválido y el límite de envíos.

El límite adicional permite cinco solicitudes por intervalo fijo de diez minutos por huella del origen de red. Depende de las cabeceras de IP proporcionadas por el proxy de Supabase; no sustituye la verificación CAPTCHA ni un WAF del proveedor. Los contadores se depuran al recibir nuevas solicitudes y no guardan la IP en claro. La analítica enviada desde un cliente público puede ser falsificada; no debe utilizarse como evidencia contable o de transacciones.

## Administradores

Cree el usuario en Supabase Auth y asígnele un registro en `admin_users` según el esquema. Las políticas RLS restringen las métricas, los contactos y los movimientos financieros a administradores. La sesión del panel permanece en memoria y requiere volver a iniciar sesión al recargar; no guarda tokens de administración de forma persistente en el navegador.

El panel indica un error si una consulta supera 50.000 filas, en lugar de presentar resultados incompletos. Reduzca el intervalo de fechas en ese caso. Las fechas de consulta y visualización utilizan la zona horaria del navegador del administrador.

## Privacidad, métricas y seguridad

- La analítica solo se activa con permiso; respeta Global Privacy Control.
- Al rechazarla se detienen nuevos eventos y se borran los identificadores locales. Esto no elimina eventos ya guardados en el servidor.
- Se registran rutas sin parámetros, no el contenido de formularios ni URLs completas.
- Un clic hacia Contacto expresa interés; no se interpreta como una reunión agendada.
- El evento de formulario se emite después de confirmar el guardado.
- Las inserciones públicas de métricas están limitadas por tipo y tamaño; la lectura requiere administración.
- La política CSP limita scripts a la propia web y los proveedores declarados; permite estilos en línea por compatibilidad con los simuladores. El servidor de alojamiento debe añadir cabeceras adicionales si se requiere protección contra incrustación. `robots.txt` y `noindex` no son controles de acceso.
- Los simuladores con almacenamiento local funcionan como demostraciones en el navegador. El simulador de trámites funciona explícitamente en modo local: se retiró una referencia a un archivo de sincronización que el repositorio original no contenía.
- Antes de publicación, la empresa debe confirmar que el texto de privacidad refleja sus prácticas reales de atención y conservación.

## Publicar

Genere las páginas y ejecute las verificaciones. Publique los HTML de la raíz, `robots.txt`, `sitemap.xml`, `assets/`, `imagenes/`, `simuladores/`, `Neo1.png` y `logo.png` con su alojamiento habitual. Mantenga la carpeta y rutas relativas. No publique `node_modules`, `.git`, archivos de secretos, pruebas ni el código de las funciones como parte de la web estática. La función se despliega por separado en Supabase.

Para GitHub Pages, una forma segura es publicar desde una carpeta o artefacto que contenga solo esos archivos. No se ha cambiado la configuración del repositorio remoto ni se ha enviado un commit.

## Recursos públicos de GitHub

- Lucide: https://github.com/lucide-icons/lucide — revisión `7faf87628a1ad6175975bc595344337ce14a7db4`. Iconos SVG locales, licencia ISC y MIT para los derivados de Feather.
- modern-normalize: https://github.com/sindresorhus/modern-normalize — revisión `076c61bd806ba4770a8d766d8e63903e4fb0dfa6`. Base CSS, licencia MIT.
- Supabase JS: https://github.com/supabase/supabase-js — versión fija `2.118.0` en el panel y la función.
- PGlite, Happy DOM, TypeScript y Prettier se usan solo para desarrollo y comprobaciones, con versiones e integridad en `package-lock.json`.

Las licencias de los recursos copiados se incluyen en `assets/vendor/`. Los iconos se sirven localmente, sin cargar un paquete de iconos desde una CDN.
