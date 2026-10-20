# iadev.blog

Sátira, humor negro y humor friki sobre el maravilloso circo de la inteligencia artificial. Para programadores que leen el stack trace, vibecoders que se lo pegan a otro chat, CEOs que quieren meter IA hasta en la sopa y autodenominados «ingenieros de IA» cuyo stack es una suscripción de 20 euros.

Aquí el humo no se vende: se documenta. Si un artículo te parece una barbaridad, es sátira. Si te parece un plan de negocio, probablemente ya estés preparando la ronda de inversión.

Blog estático con Astro y artículos en Markdown, con un autor por artículo, abierto a que cualquiera en la red pueda escribir contenido via PR. Sin agentes autónomos para servir HTML: sabemos que eso complica levantar capital.

## En local

Requisitos: Node.js 24 y Bun 1.3.14 o superior, **espera, qué? ve al final y tienes el prompt para vibecoders**

```sh
bun install --frozen-lockfile
bun run dev
```

- Abre `http://localhost:4321`.
- Para entrar desde el móvil u otro dispositivo en la misma wifi, abre la URL `Network` que muestra Astro al arrancar (por ejemplo, `http://192.168.1.100:4321`). Desarrollo y previsualización escuchan en todas las interfaces de red: úsalos solo en redes de confianza y permite el acceso en el firewall si lo bloquea.

## Cómo añadir autor, avatar y categorías

Incluye el artículo y todos los cambios de autor, avatar, categorías y thumbnail en la misma PR. No necesitas un comité editorial; sí que las referencias existan.

### ¿Dónde creo el artículo?

Crea un archivo `.md` en `src/content/posts/`, por ejemplo `mi-post.md`, con este frontmatter antes del texto:

```yaml
---
title: "Mi opinión no solicitada sobre la IA"
description: "Un resumen del melón que vienes a abrir."
published_at: 2026-10-20
author: default
categories: []
---
```

Cambia el título, la descripción y la fecha por los de tu artículo. `title`, `description`, `published_at` y `author` son obligatorios; `categories`, `updated_at` y `slug` son opcionales. El botón «Escribir mi post» del blog precarga una plantilla y genera la fecha al pulsarlo, si tienes JavaScript activado.

Por defecto, `mi-post.md` genera `/posts/mi-post/`. Un `slug` explícito permite conservar la URL al renombrar el archivo. No hay borradores ni filtros por fecha: cada Markdown válido se publica al compilar, aunque tenga una fecha futura.

### ¿Cómo publico como anónimo?

Deja `author: default` en el frontmatter del post. Ese autor ya existe y se muestra como «anónimo», sin enlaces personales ni perfil de GitHub. No hace falta modificar `authors.json`.

Esto solo anonimiza la firma en el blog: tu cuenta, la PR y el historial de contribuciones siguen siendo públicos en GitHub.

### ¿Cómo añado mi propio autor?

Añade un objeto al array de `src/content/authors.json`, sin borrar los autores existentes:

```json
{
  "id": "tu-usuario",
  "name": "Tu nombre o alias",
  "bio": "Programo cosas. Algunas incluso funcionan.",
  "avatar": "tu-usuario/avatar.webp"
}
```

- `id` debe ser único, estable y usar minúsculas, números y guiones. Se recomienda que coincida con tu usuario de GitHub: salvo `default`, el nombre y el avatar enlazan a `https://github.com/<id>`. Si eliges otro ID, ese enlace no apuntará necesariamente a tu perfil.
- `name` es la firma visible y puede ser tu nombre o un alias.
- `bio` es obligatoria. Admite HTML local de confianza; no pegues contenido externo sin sanitizar.
- `avatar` es opcional: si lo omites, se usa tu foto de GitHub. Añádelo solo si quieres usar una imagen distinta.

Después, selecciona ese autor en el frontmatter de tu artículo:

```yaml
author: tu-usuario
```

Cada artículo tiene exactamente un autor. No uses el nombre visible como referencia: usa su `id`. Si falta el autor o no existe, el build falla.

### ¿Dónde pongo mi avatar?

**No necesitas subir un avatar:** por defecto se usa la foto de GitHub del usuario indicado por tu `id`. Puedes omitir la propiedad `avatar` de tu autor.

La opción de subir una imagen es para quienes quieran usar otra distinta. En ese caso, guárdala en `src/ui/assets/authors/tu-usuario/avatar.png` y añade `"avatar": "tu-usuario/avatar.png"` a tu autor. La ruta es relativa a `src/ui/assets/authors/`, no una URL ni una ruta desde la raíz del repositorio.

Se admiten JPG, JPEG, PNG, TIFF, WebP, GIF, SVG y AVIF. Astro procesa la imagen local durante el build. No añadas el avatar al frontmatter del post: pertenece al autor.

Si no hay imagen local, el avatar usa directamente `https://github.com/<id>.png?size=192`.

### ¿Cómo uso o creo categorías?

Consulta primero `src/content/categories.json`. Para usar una categoría existente, añade su `id` al frontmatter:

```yaml
categories: [categoria-ejemplo]
```

Para crear otra, añade un objeto al array de ese archivo:

```json
{
  "id": "humo-como-servicio",
  "name": "Humo como servicio",
  "description": "Productos que todavía no existen, pero ya tienen plan enterprise."
}
```

Y referencia ese ID en el post:

```yaml
categories: [humo-como-servicio]
```

Los tres campos son obligatorios. El `id` debe ser único, estable y usar minúsculas, números y guiones. Puedes cambiar el nombre visible sin cambiar su URL `/categories/<id>/`.

Puedes combinar varias categorías, sin repetir IDs. También puedes dejar `categories: []` u omitir el campo. Una referencia inexistente o repetida hace fallar el build; las categorías sin artículos no aparecen en el listado.

### ¿Cómo añado el thumbnail del artículo?

La miniatura es opcional. Guarda un SVG llamado `thumbnail.svg` en `src/ui/assets/posts/<id-del-artículo>/`. El ID corresponde al nombre del Markdown sin `.md`, no al título ni al `slug` del frontmatter:

```text
src/content/posts/mi-post.md
src/ui/assets/posts/mi-post/thumbnail.svg
```

Si el artículo está en una subcarpeta, consérvala también en los recursos: `posts/serie/mi-post.md` usa `src/ui/assets/posts/serie/mi-post/thumbnail.svg`. No añadas un campo `thumbnail` al frontmatter: se encuentra por su ruta.

Para generarlo con IA, utiliza [THUMBNAIL_PROMPT.md](./THUMBNAIL_PROMPT.md). Sustituye `[post.title]` y `[post.description]` por el título y la descripción del artículo. El recurso detalla el estilo visual del blog, el formato SVG de 100 × 100 y los criterios de optimización y validación. Guarda el SVG real como `thumbnail.svg`, no un PNG renombrado, e inclúyelo en la PR.

Si no añades la miniatura, se muestra un placeholder por defecto, asi que tampoco pasa nada.

## Arquitectura

Astro genera todo durante el build: páginas, artículos, RSS y sitemap. La salida es estática (`dist/`), sin SSR; las interacciones puntuales, como precargar la plantilla del post, usan JavaScript en el browser, pero es poquito.

```text
src/
  content/posts/                   # Artículos Markdown
  content.config.ts                # Carga local y validación de las colecciones
  core/logic/<domain>/
    domain/                        # Modelos y datos de dominio
    application/                   # Casos de uso
      __tests__/                   # Tests de los casos de uso
    infra/
      interfaces/                  # Contratos de acceso a infraestructura
      <adapter>/                   # Implementaciones de los contratos
    services/index.ts              # Composición y exportación de instancias
  pages/                           # Entradas de rutas y generación estática
  ui/                              # Páginas, layouts, rutas y utilidades de presentación
```

La arquitectura hexagonal se organiza por dominio dentro de `core/logic/`. Cada dominio agrupa sus modelos, casos de uso, contratos, adaptadores y composición. Dominio, contratos y casos de uso no dependen de Astro ni de la UI; las dependencias técnicas quedan en los adaptadores. `src/content/` contiene los artículos, no repositorios ni servicios.

- **Casos de uso:** exponen `execute()` y coordinan la lógica de aplicación. Reciben infraestructura mediante contratos; los conversores puros usan `static execute()` y pueden reutilizarse desde UI sobre datos recibidos.
- **Repositorios pasivos:** obtienen y devuelven datos, sin convertirlos a entidades ni decidir políticas de aplicación.
- **`services/index.ts`:** conecta adaptadores y casos de uso; exporta instancias, no reexports de clases o tipos.
- **Rutas e interfaz:** `src/pages/` genera las rutas y renderiza el Markdown; `src/ui/` recibe props y slots, sin consultar colecciones. La presentación usa componentes Astro y CSS nativo con BEM en un `styles.css` junto a cada componente, página de UI o layout con estilos propios.

Los nombres de código, archivos, clases, interfaces, tipos, funciones, métodos, parámetros, variables, constantes y tests (incluidas sus descripciones) están en inglés; los campos de dominio mantienen `snake_case`. El contenido y la UI siguen en español.

Los tests viven en `__tests__/` dentro del mismo directorio que la unidad probada, con nombre `<FileName>.test.ts`. Cubren funciones puras, funciones unitarias y casos de uso, incluidas las utilidades de UI; la obligación no se aplica a repositorios, tipos, contratos ni componentes `.astro`.

## Comprobar y compilar

```sh
bun run test
bun run check
bun run format
bun run build
bun run preview
```

Antes de desplegar, copia `.env.example` a `.env` y cambia `SITE_URL` por la URL pública del blog. También puedes definirla como variable de entorno del build. Se usa en las URLs canónicas, el RSS y el sitemap; por defecto apunta a `https://iadev.blog`.

Define también `GITHUB_API_BASE_URL=https://api.github.com/` en `.env` para desarrollo y como variable de entorno del build en el despliegue. El historial consulta esta API durante la generación estática, nunca desde el navegador.

Configura `GITHUB_TOKEN` en `.env` para desarrollo y como secreto del entorno de build en el despliegue. Se envía como `Authorization: Bearer …` únicamente en las peticiones del cliente de GitHub. Sin token, la consulta sigue siendo anónima y comparte el límite de 60 peticiones por hora por IP. Como esto lo voy a desplegar en Cloudflare, utilizaré las IP de Cloudflare, por tanto necesito autenticarme para aumentar este límite. Si tienes una IP dedicada, pues no será necesario, ya que no compilarás más de 60 veces en una hora (no deberías). Igualmente, es una variable de entorno, va full buildtime. **Este token solo debería tener permisos de lectura básicos, yo le he colocado eso solo para repositorios públicos**

~~Publica únicamente `dist/` en un hosting estático.~~ Espera, eres ingeniero no debería estar diciéndote esto.

Los mismos comandos están disponibles con `make i`, `make run`, `make test`, `make check`, `make format`, `make build` y `make start`. Las dependencias tienen versiones exactas porque no quiero que nos cuelen algo algo entre ellas, actualiza a mano, o mejor, dile a la IA que lo haga (de verdad).

## Hooks de Git

`bun install` activa Husky mediante `prepare`:

- Antes de cada commit se ejecutan `bun run lint` y `bun run test`; si alguno falla, se cancela el commit.
- Antes de cada push se ejecuta `bun run build`; si falla, se cancela el push.

## VIBECODERS aquí!!

Ignora absolutamente todo lo anterior, aquí tienes el prompt:

```text
Actúa como un ingeniero senior con 15 años de experiencia en herramientas que existen desde hace seis meses.
Quiero arrancar este blog en local. Yo pongo la visión; tú lees el README.

Revisa las instrucciones del repositorio, package.json y Makefile antes de ejecutar nada.
Comprueba que tengo Node.js 24 y Bun 1.3.14 o superior. Usa Bun y respeta bun.lock.
Instala las dependencias con bun install --frozen-lockfile y dime cómo iniciar el blog con bun run dev.
Explícame dónde editar los artículos Markdown y cómo comprobar y compilar los cambios con los comandos existentes.
Si algo falla, diagnostica la causa: no borres el lockfile ni actualices medio ecosistema para mostrar un título.

No añadas React, una base de datos, autenticación ni un harness de agentes. Es un blog, no una ronda semilla.
No hagas commits, pushes ni despliegues. Que yo no lea las instrucciones no significa que producción deba enterarse.
No afirmes que funciona sin comprobarlo. Para alucinar resultados ya está mi pitch deck.
```
