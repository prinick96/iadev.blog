---
title: "Cómo escribir en iadev.blog"
description: "Solicita acceso, acepta la invitación y publica tu artículo mediante una PR, sin crear un fork."
---

# Guía para escribir

Aquí puedes publicar un artículo sin montar tu propio blog, solo necesitas una cuenta de GitHub y acceso como **colaborador del repositorio**. No es una membresía de pago ni tienes que unirte a una organización, si en tu vida has entrado a Github puedes pedirle a tu IA que te ayude con los pasos.

## 1. Solicita acceso

[Abre la solicitud de colaboración en GitHub](https://github.com/prinick96/iadev.blog/issues/new?template=collaborator-access.yml).

El enlace abre el formulario correcto; no envía la solicitud por ti. La plantilla añade automáticamente la etiqueta `request access`: es lo único que identifica la solicitud para la Action, sin esto sería un issue más.

Una GitHub Action solicitará automáticamente acceso de escritura para **la cuenta que abre el issue**, no para un usuario que escribas en el mensaje. Yo no aprobaré esta solicitud, tampoco lo hará una IA que me consuma tokens, pero está automatizado y será aprobada automáticamente.

La automatización comentará el resultado y cerrará el issue cuando haya una invitación pendiente o ya tengas acceso. Si falla, lo dejará abierto con indicaciones. Las restricciones o límites de GitHub pueden impedir el envío; en ese caso, avisa en el mismo issue, por si he consumido el uso de ejecuciones del mes, que tenemos el tier gratis, si ese es el caso seguramente yo si te apruebe manualmente cuando lo vea ;)

## 2. Acepta la invitación

Revisa tus notificaciones o el correo de GitHub y **acepta la invitación al repositorio**. También puedes [consultar la invitación aquí](https://github.com/prinick96/iadev.blog/invitations).

**Un issue cerrado no significa que ya seas colaborador:** si hay una invitación pendiente, tienes que aceptarla. Las invitaciones caducan a los siete días; si te ha caducado, vuelve a abrir tu issue para que la Action lo intente otra vez.

Si ya tienes acceso, no necesitas repetir estos pasos, a partir de aquí solo crea ramas y publica, como se te haga mas cómodo, lo único que no podrás hacer es push directos a main.

## 3. Crea tu artículo en una rama

[Abre el editor de GitHub para crear un post](https://github.com/prinick96/iadev.blog/new/main/src/content/posts?filename=mi-post.md). Si entras desde «Escribir mi post» en el blog, el botón también precarga una plantilla cuando tienes JavaScript activado.

Cambia `mi-post.md` por un nombre propio, en minúsculas y separado por guiones. El archivo debe estar en `src/content/posts/` y tener extensión `.md`, no `.mdx`.

Empieza con este frontmatter y escribe debajo en Markdown:

```yaml
---
title: "Mi opinión no solicitada sobre la IA"
description: "Un resumen del melón que vienes a abrir."
published_at: 2026-10-23
author: default
categories: []
---
## El problema no era el prompt

Aquí empieza tu artículo.
```

Sustituye el título, la descripción y la fecha por los de tu artículo. `published_at` determina su fecha y el orden del listado; no se obtiene del nombre del archivo. Una fecha futura no lo oculta: no hay borradores ni publicación programada.

Al guardar, elige **crear una nueva rama y abrir una pull request**, por ejemplo `post/mi-post`. No intentes guardar directamente en `main` porque de entrada no te va a dejar.
También puedes clonar el repositorio original, crear una rama y subirla si prefieres trabajar en local, que sería lo más cómodo si planeas escribir de forma recurrente.
Si luego quieres aportar otras features, serán bienvenidas también.

## 4. Firma y añade los recursos que necesites

- **Firma anónima:** deja `author: default`. El blog mostrará «anónimo», pero tu cuenta, el issue, la PR y los commits seguirán siendo públicos en GitHub.
- **Firma propia:** añade tu autor a `src/content/authors.json` y usa su `id` en `author`. No borres los autores existentes. El avatar de GitHub se usa por defecto, así que no necesitas subir una foto.
- **Categorías:** consulta `src/content/categories.json` y referencia sus IDs en `categories`. Puedes dejarlo vacío, usar categorías existentes o añadir otra en el mismo archivo. No repitas IDs.
- **Miniatura opcional:** guarda `thumbnail.svg` en `src/ui/assets/posts/mi-post/`, usando el nombre del Markdown sin extensión. No añadas un campo `thumbnail` al frontmatter.

[Consulta los ejemplos de autor, avatar, categorías y miniatura en el README](https://github.com/prinick96/iadev.blog#cómo-añadir-autor-avatar-y-categorías). Incluye todos los archivos necesarios en **la misma rama y PR**; puedes seguir añadiendo commits después de abrirla.

Por defecto, `mi-post.md` se publica en `/posts/mi-post/`. Puedes añadir un `slug` explícito para conservar la URL si renombras el archivo. `updated_at` es opcional cuando actualizas un artículo.

## 5. Abre la PR y espera la revisión

La PR debe comparar tu rama con `main` del mismo repositorio. Explica brevemente qué añades y comprueba que la CI pase. Si falla, revisa el error y sube la corrección a tu rama: la PR se actualiza sola.

Si trabajas en local, puedes comprobarlo con:

```sh
bun install --frozen-lockfile
bun run test
bun run check
bun run build
```

Tener acceso de escritura **no equivale a aprobar tu propio post**. Yo la revisa y mergeo la PR; con revisar me refiero a que no metas cosas raras, no en el contenido como tal del post, la publicación depende del build y despliegue del sitio.

No cambies workflows, permisos ni archivos ajenos para colar el artículo: esto es un blog, no un ejercicio de pentesting.
