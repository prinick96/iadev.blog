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

- Abre `http://localhost:4321`. Los artículos están en `src/content/posts/`; puedes crear `tu-primer-post.md`.
- Para entrar desde el móvil u otro dispositivo en la misma wifi, abre la URL `Network` que muestra Astro al arrancar (por ejemplo, `http://192.168.1.100:4321`). Desarrollo y previsualización escuchan en todas las interfaces de red: úsalos solo en redes de confianza y permite el acceso en el firewall si lo bloquea.
- Cada `.md` necesita `title`, `description`, `published_at` y `author` en el frontmatter. `updated_at`, `slug` y `categories` son opcionales.
- Las categorías se definen en `src/content/categories.json` con `id`, `name` y `description`. El ID es estable y usa minúsculas y guiones; cambiar `name` no cambia la URL. En los posts, usa `categories: [inteligencia-artificial, desarrollo]`. Las referencias inexistentes o repetidas hacen fallar el build. `/categories/` lista solo categorías con artículos y enlaza a `/categories/<id>/`; los posts mantienen sus URLs.
- No hay borradores ni filtros por fecha.
- La miniatura es opcional: guarda `thumbnail.svg` en `src/ui/assets/posts/<id-del-artículo>/`, sin añadir frontmatter. Para `ejemplo.md`, la ruta es `src/ui/assets/posts/ejemplo/thumbnail.svg`; los IDs anidados conservan sus subcarpetas. Si falta, se utiliza `placehold.co`, que recibe una petición del navegador.
- Los autores se definen en `src/content/authors.json` con `id`, `name`, `bio` y un `avatar` opcional. Cada post elige exactamente uno con `author: prinick96`, usando su ID estable; un autor ausente o inexistente hace fallar el build. El avatar es una ruta relativa a `src/ui/assets/authors/`, por ejemplo `prinick96/avatar.webp`. Se admiten JPG, JPEG, PNG, TIFF, WebP, GIF, SVG y AVIF como origen; Astro conserva el formato de origen y optimiza el avatar durante el build. Si se omite `avatar` o falta la imagen, se muestra un placeholder. `bio` admite HTML local de confianza, no contenido externo sin sanitizar.
-

## Arquitectura

Astro genera todo durante el build: páginas, artículos, RSS y sitemap. La salida es estática (`dist/`), sin SSR ni JavaScript de cliente.

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
