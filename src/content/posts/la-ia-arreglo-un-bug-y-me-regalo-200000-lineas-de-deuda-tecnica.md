---
title: "La IA arregló un bug y me regaló 200.000 líneas de deuda técnica"
description: "La IA encontró el fallo, reprodujo el panic y preparó un fix, solo que necesitó clonar una dependencia entera y modificar el sistema de módulos."
published_at: 2026-10-22
author: prinick96
categories:
  - engineering
---

Estoy desarrollando un backend en Go y actualmente utilizo de Framework [Goravel](https://www.goravel.dev/), que sería algo así como la "implementación" de Laravel para Go.

En concreto utilizo la implementación Lite, que no trae absolutamente todo, si no que me permite ir incorporando modularmente cada feature del framework, pues esta implementación utiliza Gin para manejar el tema de rutas, http, etc.

Y simplemente haciendo un par de pruebas para un caso de uso que tenía, me he dado cuenta de que tenía un bug a **nivel librería, con la implementación de gin del framework**, en concreto cuando un formulario malformado llegaba desde frontend, bloqueaba petición y generaba un panic que me mataba el proceso, claramente algo así **no puede salir a producción**, imagina que un archivo corrupto por transferencia de red o algo, llegue a mi endpoint y por un fallo como este, se cae el proceso no solo para esa persona si no para todos los usuarios!

Esto claramente no es un error de la IA, el bug está en el framework que estoy utilizando.

Suelo programar con GPT 6.1 Sol en low/mid porque me entrega mejor resultado por precio que 5.6 Terra o GPT 6 luna, así que lo he subido a max y le he dicho que me programe el fix para revisarlo y ver si me cuadraba la solución, esto lo hice porque al ver que el problema estaba en Gin, había una posibilidad de poder atajar el panic antes de que ocurriera, en mi backend y ya está, pero si estaba en una etapa temprana no podría hacerlo si no que la solución tendría que ser modificar directamente la implementación de Gin del framework (y claramente esto no es una solución).

### Qué ha hecho la bendita IA?

Estuvo un rato pensando, haciendo pruebas, me creó par de ficheros de python para hacer pruebas sintéticas, etc, se dio cuenta de que el problema realmente era Gin, no era mi código, me creó una carpetica llamada `third_party/gin` y ahi literalmente clonó el repositorio de Gin y modificando mi fichero de dependencias `go.mod` encontró el problema, lo solucionó y me lo dejó allí.

Ahora, esto, **funcionaba**, claro, pero era correcta esta solución? NO.

Enseguida borré la carpeta, entré al repositorio, miré un poco los Issues / PR y encontré que alguien más había reportado el bug hace poco [#1010 issue en el repo de goravel](https://github.com/goravel/goravel/issues/1010), veo que en los comentarios efectivamente está la solución en una PR que ya fue mergeada, pero claro, como aún no hay release si no que está planificado el fix para la próxima release, mi fichero go.mod apunta a la versión release para descargarse la dependencia

```mod
require (
    github.com/goravel/gin v1.18.1
)
```

Cómo solucionamos esto antes de salir a producción? (a ver yo no saldré a producción hasta dentro de unos meses), y probablemente ya exista la release con esa solución, pero ahora mismo para desarrollo, me jode un poco que esa parte no esté resuelta.

Mi solución fue sencilla, la [PR#249](https://github.com/goravel/gin/pull/249) que lo solucionaba ya estaba mergeada al main, con el commit [dfb7c8bde12f](https://github.com/goravel/gin/commit/dfb7c8bde12fdefeddab5d0963e2a1a407de6ae8)

Entonces, solamente era cuestión de editar el fichero go.mod por

```mod
require (
    github.com/goravel/gin v1.18.1-0.20260926064847-dfb7c8bde12f
)
```

Y ya mi dependencia apunta exactamente a la solución de ese error.

Antes de salir a producción lo cambiaré, por la release, pero por ahora, me viene bien.

![ia-solutions](https://i.8upload.com/image/76b5437f82d1586e/flujo-de-depuracio-n-del-pa-nico-a-la-solucio-n-correcta.png)

## Y si estuviera vibecodeando?

Pues probablemente ahora mismo tendría un backend 100% funcional, desarrollado en 2 días, con 47 carpetas de código que no entiendo y una copia entera de Gin metida en `third_party/` pero, **HE CREADO UN SAAS EN UN FIN DE SEMANA CON IA! 🚀🚀🚀**

Y claro, faltaría más, habría subido un post a X/Linkedin explicando cómo los programadores tradicionales están obsoletos, que escribir código a mano es como cuando los dinosaurios escribian en Cobol y que lo importante es construir productos, no perder el tiempo entendiendo qué hacen, total, si compila, funciona.

```
git add -A && git commit -m "fix: production ready" && git push --force
```

Ahora imaginemos que, tres meses después, sale una vulnerabilidad crítica en Gin. Actualizamos dependencias, ¿no? Bueno, resulta que tenemos una copia entera de Gin metida en third_party/gin y nuestro go.mod apunta alegremente a esa copia local y durante ese tiempo probablemente si hemos seguido vibecodeando nuevas features, la IA en algún punto podría haber tocado ese Gin de nuevo añadiendo más cambios con respecto al original, sin nosotros saberlo pero no tenemos ni puta idea porque revisar el código es perder tiempo.

Pero coño, el bug original está fixeado...

Ahora tenemos que mantener nuestro propio parche de Gin? que las actualizaciones oficiales no se aplican automáticamente a nuestra copia? que nadie sabe exactamente qué ha tocado la IA ni por qué? ya que tuvimos de pronto +200k de lineas en el proyecto para arreglar un bug, que posiblemente acabamos de convertir un bug que ya estaba solucionado upstream en una deuda técnica que vamos a arrastrar durante meses?

Y lo mejor de todo es que la solución correcta estaba literalmente en una PR ya mergeada, no había que reinventar absolutamente nada, no hice nada, bastó con revisar el repositorio, encontrar el commit y apuntar temporalmente a él desde go.mod.

Pero claro, eso requiere una cosa bastante incómoda: **saber qué estás haciendo**

Y aquí está la parte verdaderamente graciosa: la IA no hizo necesariamente un mal trabajo técnico, encontró el origen del problema, reprodujo el fallo y consiguió solucionarlo, es más, probablemente invirtió bastante más esfuerzo del necesario en arreglarlo, y te cobró con tokens.

El problema es que, si yo no hubiera revisado lo que había hecho, habría aceptado una solución que funciona, pero que introduce un problema de mantenimiento completamente innecesario **y eso es precisamente lo peligroso del vibe coding cuando se practica sin criterio técnico.**

Ya me gustaría ver a Linus Torvalds aceptando un fix de este calibre para solucionar un problema en el Kernel de linux, porque la moda es no revisar el código y supuestamente el ahora es vibecoder, esto es como cuando antes ponían frases en imagenes de cientificos o famosos, frases que nunca dijeron xD

> Escribir código nunca fue la parte más difícil de ser programador.
