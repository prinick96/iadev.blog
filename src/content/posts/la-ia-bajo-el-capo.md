---
title: "La IA bajo el capó: por qué parece que piensa y por qué no es así"
description: "Tokens, analogías y una sana desconfianza hacia cualquier cosa que parece funcionar a la primera, antes de hablar de la IA en el blog, profundizamos un poco sobre qué es."
published_at: 2026-10-21
author: prinick96
categories:
  - engineering
---

Primero que nada, este es el primer post que hago en este blog, soy un programador más del sector, curtido con años de experiencia y escribo código mucho más elocuente que el tipo de lectura que encontrarás aquí, vamos a tratar temas serios, pero seré muy informal, no esperes la gramática de una persona que se dedica a esto de la "comunicación", soy un bicho raro que programa desde los 10 años, así que para mi es más fácil pensar un algortimo X en un lenguaje Y, que desarrollar mi idea en un post.

Paso de decirle a Chatgpt que me reescriba el contenido para dejarlo bonito, aquí voy escribiendo tal como voy pensando, puede que me coma algún acento, o peque con la cantidad de comas, pero con que me entiendas me basta! escribiré rápido y sin revisar demasiado, si hay gente que no revisa el código que escribe la IA cuando hace Vibecoding, pues yo no pienso releer cada oración que escriba en este blog para acomodar la gramática.

---

Dicho esto, **vamos a partir de que al menos una vez en tu vida has interactuado con ChatGPT o con Claude**, quizá no para hacer Vibecoding o pedirle que haga algo por tí, pero si para preguntarle cosas y ver cómo te contesta con una seguridad que te hace pensar que estás hablando con "algo" inteligente.

Imagina que le pides a tu IA de confianza que simule una batalla en un juego, algo como Baldurs Gate:

El enemigo tiene 12k de puntos de vida y tu PJ tiene las siguientes reglas:

- En un turno ataca con espada y en el siguiente con magia
- Cada 3 turnos recuperas maná
- Cuando su salud baja del 30%, puedes lanzar un ulti (un ataque especial)

Ahora tienes dos maneras de pedirle a la IA que haga esa simulación:

## Opción A: Pedirle que cree un programa

La IA escribe el código que contiene todas las reglas del combate, después, tu PC ejecuta ese programa y calcula automáticamente qué ocurre en cada turno y así tienes la simulación completa.

El programa llevará la cuenta de la vida, los ataques, la maná y las ultis.

## Opción B: Pedirle que calcule toda la batalla mentalmente

Le dices a ChatGPT

```
Simula los próximos 1.000 turnos, uno por uno, sin utilizar ningún programa.
```

PD: `sin utilizar ningún programa` es clave porque quizá se hace uno en python y lo corre, pero la idea aquí no es el resultado si no, el mecanismo que hay por dentro.

De esa manera la IA tiene que recordar constantemente cuánta vida queda, qué ataque toca según el turno, cuándo se recupera la maná y cuándo lanzar el ulti.

## Qué demostramos con esto?

Que existen dos capacidades distintas, la primera, encontrar una solución, la segunda, ejecutar correctamente todos los pasos.

La IA tiene que aplicar esas reglas una y otra vez sin olvidarse nada ni cometer errores, una IA puede ser excelente en la primera capacidad y bastante menos fiable en la segunda, y esto sucede en TODO, sobre todo cuando le lanzas el prompt de `Cloname la app de Uber eats para android e ios`, vamos cuando Vibecodeas a gran escala.

Hay algo que se llama [METR](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/), ellos estudian precisamente cómo cambia el éxito de los agentes según la longitud de las tareas, su trabajo no reduce el problema a "sabe programar" o "no sabe", también importa cuánto trabajo tienen que encadenar.

A mi particularmente me interesa más esa diferencia que decidir si el chat tiene una luz de conciencia adentro, quiero entender qué hace, por qué a veces sale algo espectacular y por qué otras veces me entrega una cagada inventada con tanto autoconvencimiento, que si yo desconozco del tema, me lo trago completo porque pienso que es así.

Vamos a levantar el capó de la IA y tratar de entender un poco cómo funciona por dentro.

# Tu prompt entra en pedacitos

Para empezar, el modelo no recibe exactamente las palabras que leemos todos, porque el **no las entiende**. Un [tokenizador](https://github.com/openai/tiktoken) transforma el texto en una secuencia de identificadores, estos son los famoso `tokens` y pueden representar palabras completas, trozos de palabras, signos o combinaciones que incluyen espacios, la división depende del tokenizador concreto y no tenemos una tabla "universal" donde "palabra" tenga siempre el mismo número.

![prompt en pedacitos](https://i.8upload.com/image/f6cf509f2fbe2b2a/imagen-de-chatgpt-21-oct-2026-12-53-35-1.png)

> De hecho en este repo utilizamos la librería `gpt-tokenizer` para hacer la broma de "tokens gastados" por leer el artículo, puedes revisar un poco cómo funciona esa librería en npm.

Imagina que escribes a chatgpt `el turbo hace un ruido raro`, porque tienes un problema con el coche, tú ves una frase formada por seis palabras pero la IA no trabaja directamente con esas palabras, las divide y le asigna un número identificador a cada una, por ejemplo:

`turbo`-> 5821
`hace` -> 9142
`un`-> 305
`ruido` -> 706

Después de tenerlos como números, los trasnforma en una lista de números, y aquí viene la parte más interesante! el número que identifica a un token por ejemplo 5821 para `turbo` por inventar algo, no es suficiente para que el modelo sepa cómo utiliza una palabra, para eso la IA convierte cada identificador en un **vector**, que es simplemente un array de números, por ejemplo:

`turbo` -> 5821 -> `[0.21, -0.84, 0.53, 0.17...]` esto puede tener miles de valores.

## Para qué sirve un vector?

Estos vectores permiten a la red neuronal trabajar con relaciones y patrones aprendidos durante el entrenamiento, por ejemplo la palabra `motor` puede aparecer en contextos relacionados con mecánica, coches, películas de coches, energía, maquinaria, etc... y ese significado contextual está distribuido entre muchos números y sus relaciones.

Además la IA tiene en cuenta la posición de esos tokens y transforma sus representaciones según las palabras que los rodean, por eso podría distinguir entre:

- El motor del coche se ha jodido
- El motor de búsqueda de mi sistema no encuentra resultados

Es la misma palabra pero está en contextos distintos, ese contexto, lo transmiten las palabras que rodean a `motor` en este caso, vamos, como hacemos todos, le damos significado según la oración, pero no necesitamos pensar, es mecánico, el modelo hace lo mismo, no piensa, es mecánico.

Los que saben han hecho un paper [por aquí](https://arxiv.org/html/1706.03762v7)

## Los parámetros

Seguro has escuchado alguna vez que hablan de que las IA's locales vs las de cloud tiene X cantidad de miles de millones de parámetros, bueno, esas cosas son básicamente valores numéricos, llamados a veces **pesos**, que la IA ha ajustado durante todo su entrenamiento.

Piensa en alguien que aprendió a tocar un instrumento, después de años de práctica esa persona sabe interpretar canciones, reconoce melodías y puede improvisar, pero a donde se guardó todo ese conocimiento? no existe en el cerebro una casilla con la lista de todas las canciones y otra con todas las instrucciones exactas para mover cada dedo cuando toca el instrumento, aprendió por patrones y a través de repetir una y otra vez.

Con la IA ocurre algo comparable, pero su funcionamiento es matemático y no funciona igual que un cerebro humano, durante su entrenamiento esos **parámetros** se ajustan para que el modelo aprenda por patrones, si al entrernarlo le mostramos la foto de una fresa y le decimos que es una banana, cuando alguien le diga, ponle una banana al mono, la foto tendrá a un mono con una fresa, porque entendió que una fresa es en ese caso, una fruta amarilla alargada.

Entonces, un parámetro no es un dato almacenado en una base de datos interna del modelo o algo así, esos **pesos** forman parte de una función aprendida, y una función no te ofrece algo automáticamente equivalente a hacer un `SELECT` en una DB para buscar el conocimiento, si quieres indagar un poco más sobre esto puedes checkar [este artículo](https://arxiv.org/abs/2005.11401)

## El mecanismo de atención

Imagina que le decimos a chatgpt `El mecánico quitó el turbo del coche porque estaba dañado`, y después le preguntas, `qué estaba dañado? el coche o el turbo?`, lo **más probable** es que te conteste `el turbo`.

### Cómo hace para llegar a esa conclusión?

Una IA no lee esas palabras de forma completamentea aislada, analiza cómo se relacionan entre sí, por ejemplo:

- `Mecánico`: indica que estamos hablando de reparaciones
- `Turbo`: es una pieza que puede averiarse
- `Coche`: es el objeto que contiene el turbo
- `Quitó`: es la acción que indica que se ha retirado algo
- `Dañado`: describe la avería

La IA aprende que, en ese contexto, tiene más probabilidades de éxito interpretar que lo que estaba dañado era el turbo y no el coche.

Aunque hay algo importante: **la frase sigue siendo ambigua**. Podría referirse al coche, el modelo utiliza patrones aprendidos y el contexto para favorecer una interpretación sobre la otra, no para descubrir con certezza absoluta lo que queríamos decirle nosotros.

### Qué es exactamente la atención?

Imagina ahora que cada palabra de esa frase puede consultar información cruzada de otras palabras de la misma frase.

![atención en la IA](https://i.8upload.com/image/c49f55d27cc36196/imagen-de-chatgpt-21-oct-2026-12-53-37-3.png)

Cuando la IA procesa la parte "estaba dañado", necesita información sobre lo que ha aparecido antes, el mecanismo de atención le permite combinar info de diferentes posiciones de la frase, dando distinta importancia a cada una según el contexto.

**Pero atención no significa simplemente buscar palabras importantes**. Es un sistema matemático complejo que en la vida tu y yo vamos a entender porque yo solo soy ingeniero y tu solo entiendes vibras, ese sistema permite que la representación de cada **token** incorpore información de otros tokens.

### Atención multicabeza (multi-hjead attention)

En lugar de calcular una única forma de relacionar las palabras, el tokenizador calcula varias en paralelo

Además, hay muchas capas que transforman y refinan esas representaciones, así que no hay un único "cerebro" decidiendo qué palabra importa, hay muchas operaciones matemáticas que trabajan conjuntamente.

![multi-hjead attention](https://i.8upload.com/image/6340e48557e9eae7/imagen-de-chatgpt-21-oct-2026-12-53-38-4.png)

### Predicción de tokens

Cuando chatgpt te escribe una respuesta, normalmente no genera todo de golpe, aunque la interfaz gráfica te vaya mostrando todo como streaming y pienses que simplemente es que así va viajando la info, pues, es una buena ida de entender que realmente "por dentro" así es como sucede, va **produciendo token por token** y pues cada token puede ser una palabra, parte de una palabra o un signo de puntuación.

Por ejemplo si le escribes

```
El mecánico arregló el...
```

La IA calcula las probabilidades para los posibles siguientes tokens, e internamente tendría algo como:

- `coche`: 55%
- `motor`: 25%
- `turbo`: 15%
- `problema`: 5%

si elige `coche` luego haría exactamente lo mismo para la siguiente palabra, y así sucesivamente hasta completar la respuesta, esto se llama **generación autorregresiva**

### Entonces una IA solo predice token por token?

**Sí**, y es por pura probabilidad, probabilidades que obtiene de complejas operaciones matemáticas, entonces, no piensa. No se ofende si la insultas, no se siente bien si le agradeces, es todo "artificial", no es inteligente, es todo solo fruto de la probabilidad.

No digo que sea simple, digo que es la base de cómo funciona, mientras mejor y más acertado sean esos porcentajes, mejores resultados dará, pero la base es la misma.

## Las fantásticas alucinaciones

Creo que ya entendiendo un poco todo lo anterior, nos da para más o menos intuir por qué un modelo puede alucinar y por qué siempre requerirá supervisión humana, es más complejo porque hay otros factores allí como el tamaño del contexto, el tiempo de retención de dicho contexto, y más cosas pero la base se sigue sosteniendo por lo mismo.

Las alucinaciones suceden no porque la IA funcione mal, si no porque están relacionadas con cómo aprende y cómo se evalúa.

### Cómo puede una IA inventarse algo que parece real

Vamos al código, imaginemos que estamos programando y estamos en un chat o con el agente y en alguna parte del código ve algo como:

```go
clienteCache.InvalidateEverythingSafely()
```

Anque seas un vibecoder y no sepas programar, fíjate en el nombre `invalidateEverythingSafely()`, esto es lo suficientemente elocuente para que sepas que significa algo como "invalidar todo de forma segura", es el nombre de una función que podría existir en una librería externa o interna del proyecto, pero **tu te la inventaste**, y luego le preguntas a chatgpt en otro punto de la conversación

```
cómo puedo borra toda la caché de esta librería de Go?
```

y chatgpt te responde

```go
clienteCache.InvalidateEverythingSafely()
```

el problema es que esa función puede no existir, pero por qué te la recomienda entonces? (además de que no tiene contexto porque se que van a decir pero pasale todo el contexto del proyecto entero, para que revise todo el código), porque durante su entrenamiento ha visto muchos ejemplos de código con nombres parecidos:

```go
cache.Clear()
cache.Invalidate()
cache.ResetCache()
```

Ha aprendido cómo suelen llamarse las funciones y cómo estructura el código

> me deprime un poco imaginar que la culpa de que a veces programe tan mal puede ser porque se entrenó con mucho código, y tristemente, la mayoría del código que hemos producido los programadores en la vida es una real porquería, en algun punto de nuestra vida siendo juniors o aprendiendo hemos programado algo como el culo y está por ahi, es decir, lo que mas abunda es basura

Por eso puede generar una función que encaja perfectamente con el estilo de Go, aunque no exista, la idea fundamental es que una respuesta parezca correcta no significa que sea verdadera.

### Por qué el entrenamiento permite que ocurran estas cosas

Recuerda lo que vimos antes: los modelos de lenguaje aprenden, en gran parte, mediante la predicción de tokens

Imagina que durante el entrenamiento aparece esta frase:

```
La capital de Francia es París.
```

El modelo aprende patrones que le ayudan a predecir `París` después de `La capital de Francia es`, pero el objetivo habitual del preentrenamiento no consiste en consultar una base de datos de hechos verificados para comprobar cada afirmación, para saber si es real o no, se entrena para predecir texto de sus ejemplos.

Esto significa que puede aprender tanto **info correcta como incorrecta**, ficciones o afirmaciones falsas presentes en esos datos, y en ocasiones, puede combinar información aprendida para producir una afirmación nueva que suena convincente, pero que es incorrecta.

Leete un poco [este artículo](https://openai.com/es-ES/index/why-language-models-hallucinate/)

**Aprender a generar texto coherente y aprender a distinguir siempre la verdad son dos problemas diferentes!**

### Por qué le compensa inventar

Pues supongamos que una IA participa en un concurso de preguntas sobre videojuegos, las reglas son:

- Respuesta correcta: +1
- Respuesta incorrecta: 0
- Decir "no sé": 0

Si la IA no está segura, qué le conviene hacer para maximizar su puntuación? ya que ese es el objetivo, pues **arriesgarse**, porque no pierde nada por equivocarse.

Esto es porque la forma en la que evaluamos la IA, puede incentivar qué responda incluso cuando no está segura, eso no significa que Chatgpt esté calculando conscientemente cómo ganar un concurso cada vez que responde. Es una analogía para entender cómo ciertos objetivos de entrenamiento y evaluación pueden favorecer respuestas arriesgadas.

### Por qué no puede deducir cualquier información

Para entender esto podemos distinguir dos tipos de información

| Información                                     | ¿Puede deducirse?                            |
| ----------------------------------------------- | -------------------------------------------- |
| Cuánto es 25 × 4                                | Sí, mediante matemáticas                     |
| Qué significa una palabra                       | A menudo, mediante conocimiento y contexto   |
| Cómo suele llamarse una función de programación | Puede proponer nombres plausibles            |
| El nombre exacto de una función de una API      | Necesita conocimiento fiable o documentación |
| Una contraseña privada desconocida              | No, si no dispone de esa información         |

La diferencia es que algunas respuestas pueden calcularse o inferirse a partir de reglas, mientras que otras dependen de hechos concretos que no pueden adivinarse con fiabilidad.

### Cómo debería actuar una IA para evitar las alucinaciones?

Volvamos a la función inventada

```go
clienteCache.InvalidateEverythingSafely()
```

Imagina dos posibles respuestas de una IA.

#### Respuesta poco fiable

```
Para limpiar la caché utiliza clienteCache.InvalidateEverythingSafely(). Es el método oficial.
```

Afirma que existe una función sin haberlo comprobado

#### Respuesta más fiable

```
No tengo confirmado cuál es el método para borrar la caché de esa biblioteca. Necesitaría saber qué SDK y versión utilizas para consultar su documentación.
```

Reconoce la incertidumbre y propone cómo verificar el dato.

La segunda respuesta quizá sea la menos impresionante por que preconcibe que sabe todo y que encima sabe más que tú, pero es mucho más útil cuando necesitas información precisa, información real. Eso sí, consultar documentación tampoco garantiza acertar siempre, una IA también puede interpretar mal una fuente o utilizar documentación desactualizada...

### Significa esto que una IA no sabe nada realmente?

**No**, una IA puede haber aprendido hechos reales durante su entrenamiento, por ejemplo, puede responder correctamente a miles de preguntas de historia, matemáticas, ciencia o programación sin consultar Internet, como las primeras versiones de chatgpt.

Pero no todo lo que genera tiene la misma fiabilidad, hay una diferencia entre:

- Recuperar o utilizar conocimiento aprendido
- Razonar a partir de información disponible
- Generar una respuesta plausible cuando falta información

El problema aparece cuando la IA hace lo tercero, pero su respuesta parece tan segura como si estuviera haciendo lo primero, y si tu no sabes del tema, te lo tragas todo (vibecodear se trata de esto básicamente xd, da igual cómo y con qué herramientas lo adornes), te pueden colar un Toyota por fuera con un motor pudretech de Peugeot y si no sabes de coche, en unos km te quedas sin motor.

Y eso es especialmente peligroso porque una alucinación puede estar muy bien escrita, ser detallada y utilizar términos técnicos correctos, la parte visual funcionar exactamente como le dices, pero está mal detrás, en otro post hablaremos sobre vibecoding de forma seria, cuando está bien y cuando no está bien usarlo.

![ia procesando](https://i.8upload.com/image/1539fa1a7cade530/imagen-de-chatgpt-21-oct-2026-12-53-36-2.png)

# Entonces, piensa o no?

Que una IA pueda razonar, resolver problemas o mantener una conversación no significa necesariamente que piense.

**Pensar** para mi implica comprender realmente lo que se está haciendo, tener conciencia o experimentar pensamientos propios y es por ello que sostengo que una IA no piensa, si no que procesa información y genera respuestas mediante cálculos matemáticos y pura probabilidad.

Qué pasa con el concepto "AGI"? pues ha sido mucho amarillismo, de hecho la propia OpenAI define AGI como "sistemas altamente autónomos que superen a las personas en la mayoría del trabajo económicamente valioso." [checka aquí](https://openai.com/es-ES/charter/)

Para mi es una **herramienta**, para proponer implementaciones, explorar alternativas o buscar casos de borde, etc.

Los programadores siempre hemos tenido herramientas, desde siempre, alguna vez has programado con PHP y Laravel? conoces Artisan? eso antes era como una IA, ya escribía código por mi pero era determinista y siempre nos arrojaba código elocuente, cuando empezaron a salir los IDE's con autocompletado, snippets y más, siempre han sido herraminetas, la IA es brutal como herramienta, yo recuerdo que siempre había querido una forma de plasmar mis pensamientos en código sin necesidad de escibirlos porque mi cabeza siempre ha ido más rápido que mis manos, y ahora puedo dictar literalmente qué quiero con un nivel de abstracción más alto a una pantalla y empezar a ver cómo se escribe el código que pensé (mas o menos xd).
