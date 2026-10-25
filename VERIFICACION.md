# Verificación de la entrega

- 21 pruebas automáticas satisfactorias en Node.js.
- Comprobación de sintaxis JavaScript, IDs únicos y referencias locales en 19 HTML de página, incluida la verificación de Google.
- Inicialización de las siete páginas corporativas y los nueve simuladores en DOM simulado.
- Cálculos: ahorro sin interés, capitalización mensual, tasas pequeñas, créditos, comisiones de tarjetas y redondeo de proformas.
- Seguridad: escape de texto editable y exportaciones CSV; rechazo de solicitudes inválidas, CAPTCHA fallido, orígenes no permitidos y cuerpos grandes en la función (proveedores simulados).
- Formulario: conservación del texto ante error, alternativa explícita por correo y confirmación solo al guardar.
- Base de datos: esquema y actualización ejecutados en PGlite/PostgreSQL local, conservación de filas, repetibilidad del SQL, RLS de administrador/no administrador, rechazo de inserciones públicas de contactos, eventos admitidos y límite atómico.
- Privacidad: sin eventos antes de aceptar, almacenamiento denegado, Global Privacy Control, retirada del permiso, eliminación de parámetros de URL y expiración de sesiones.
- Catálogo: nueve herramientas, filtrado por categoría, búsqueda sin distinción de tildes y estado sin resultados.
- Navegador real: revisión de la portada en escritorio y vistas estrechas; menú adaptable; comprobación de ausencia de desbordamiento horizontal en portada, equipo, contacto y catálogo en vista estrecha.

Las pruebas locales no verifican las credenciales, las políticas ya instaladas, la entrega de correo ni el CAPTCHA real en producción. Esos pasos requieren aplicar el SQL y desplegar/configurar la función según README.md. No se modificó la base de datos remota ni el repositorio de GitHub.
