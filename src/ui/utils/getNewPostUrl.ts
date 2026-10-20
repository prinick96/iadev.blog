export function getNewPostUrl(baseUrl: string, date: Date): string {
  const url = new URL(baseUrl)
  const publishedAt = date.toISOString()
  const template = `---
title: "Mi opinión no solicitada sobre la IA"
description: "Un resumen del melón que vienes a abrir."
published_at: ${publishedAt}
author: default
categories: []
---

<!-- Cambia el nombre mi-post.md por uno propio, en minúsculas y con guiones please. -->
<!-- Deja author: default para firmar como anónimo en el blog. Tu cuenta de GitHub seguirá siendo pública (en el commit xd). -->
<!-- Para firmar con tu propio autor, créalo en src/content/authors.json y sustituye default por su id. Se recomienda que ese id coincida con tu usuario de GitHub, porque el perfil enlaza a https://github.com/<id>. -->
<!-- Para añadir autor, avatar o categorías, consulta el README del repositorio. -->

Aquí empieza tu artículo. El cursor es tuyo; las consecuencias, también.

## El asunto

Cuenta lo que tengas que contar.
`

  url.searchParams.set('value', template)

  return url.href
}
