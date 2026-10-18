# iadev.blog

Sátira, humor negro y humor friki sobre el maravilloso circo de la inteligencia artificial. Para programadores que leen el stack trace, vibecoders que se lo pegan a otro chat, CEOs que quieren meter IA hasta en la sopa y autodenominados «ingenieros de IA» cuyo stack es una suscripción de 20 euros.

Aquí el humo no se vende: se documenta. Si un artículo te parece una barbaridad, es sátira. Si te parece un plan de negocio, probablemente ya estés preparando la ronda de inversión.

Blog estático con Astro y artículos en Markdown. Sin agentes autónomos para servir HTML: sabemos que eso complica levantar capital.

## En local

Requisitos: Node.js 24 y Bun 1.3.14 o superior, **espera, qué? ve al final y tienes el prompt para vibecoders**

```sh
bun install --frozen-lockfile
bun run dev
```

- Abre `http://localhost:4321`. Los artículos están en `src/content/posts/`; puedes crear `tu-primer-post.md`. 
- Cada `.md` necesita `title`, `description` y `published_at` en el frontmatter. `updated_at` y `slug` son opcionales. 
- No hay borradores ni filtros por fecha.

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
- **Rutas e interfaz:** `src/pages/` genera las rutas y renderiza el Markdown; `src/ui/` recibe props y slots, sin consultar colecciones. La presentación usa componentes Astro y CSS nativo scoped con BEM.

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

~~Publica únicamente `dist/` en un hosting estático.~~ Espera, eres ingeniero no debería estar diciéndote esto.

Los mismos comandos están disponibles con `make i`, `make run`, `make test`, `make check`, `make format`, `make build` y `make start`. Las dependencias tienen versiones exactas porque no quiero que nos cuelen algo algo entre ellas, actualiza a mano, o mejor, dile a la IA que lo haga (de verdad).

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
