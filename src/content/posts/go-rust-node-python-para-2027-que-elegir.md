---
title: "Go, Rust, Node y Python para 2027: qué elegir"
description: "Go, Rust, Node y Python, pruebas de rendimiento, concurrencia, tipos, ecosistema y coste real, cómo elegir un backend sin confundir un benchmark con los problemas de tu aplicación."
published_at: 2026-11-03
author: prinick96
categories:
  - engineering
  - development
---

Antes de empezar, este post es como los de antes, de antes de que la IA se pusiera de moda, de antes de que la gente empezara a decir que "el lenguaje no importa porque lo programa la IA", sin embargo, está a corde a los tiempos actuales y mi opinión tiene en cuenta que desde hoy, desarrollarás software asistido por IA pero sin recomendarte o reducir todo a "utiliza X Skill", de hecho eso no aparecerá por aquí.

Imagina que tienes un endpoint que tarda muchisimo y alguien propone reescribir el backend entero en Rust (no necesariamente porque esté de moda) y bueno, otro responde que Go es más productivo, un tercero recuerda que con TypeScript podríamos compartir tipos con el frontend y un cuarto dice que Python tiene más librerías.

Nadie ha abierto el profiler para analizar de verdad el problema.

Pero ya tenemos cuatro candidatos, una discusión de arquitectura y trabajo para los próximos meses (horas en el peor de los casos, sí, sabes a lo que me refiero xd), la consulta que hace un recorrido completo de la tabla sigue ahi, esperando a que termine el debate para devolver los mismos registros.

Esta es una forma bastante cara de NO investigar un problema.

A mí estas discusiones me gustan cuando sirven para decidir algo, pero cuando acabamos compitiendo por ver quién ha elegido el lenguaje más serio, pues ya me dirás para qué nos sirve eso.

En este blog uso Go hasta para [implementar una regresión lineal](https://iadev.blog/posts/regresion-lineal-go-o-harness-de-agentes/) en vez de Python, así que tampoco voy a hacer como que me dan todos igual, a mi me gusta Go, me gusta escribirlo y estoy cómodo con él para lo que quiero hacer, pero de ahí a decir que los demás se equivocan por usar otra cosa, pues no.

Si vas a empezar un proyecto en 2027, prefiero hablar de qué vas a hacer, dónde lo vas a desplegar y quién va a tener que mantenerlo después (sí, aunque utilicemos IA para ello).

Y antes de seguir, dejaré claro que **Node.js es un entorno de ejecución, no un lenguaje**, aquí lo comparo como una opción de backend para JavaScript/TypeScript.

## No estamos comparando cuatro formas de escribir lo mismo

Aunque puedas escribir exactamente la misma API con cualquiera, las decisiones de diseño que hay detrás no son idénticas.

![elige-el-problema-no-el-logo](https://img.iadev.blog/posts/re-a-1.png)

Go nació con bastante atención puesta en problemas de ingeniería: compilar, tener herramientas, manejar concurrencia y mantener proyectos grandes. Que sea sencillo viene de ahí, no es algo que haya salido por casualidad, lo explican sus creadores en el [FAQ del lenguaje](https://go.dev/doc/faq).

Rust va más por controlar los recursos y evitar errores con la memoria, para eso tiene unas reglas sobre quién es dueño de cada dato que revisa el compilador, sin necesitar un recolector de basura que gestione la memoria. El [ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html) es una parte bastante importante de cómo funciona.

Eso no convierte a Go en un lenguaje exclusivamente para APIs ni a Rust en algo reservado a escribir sistemas operativos, así como tampoco nos obliga a utilizar Python para cualquier cosa que lleve "IA" en el nombre.

Yo primero miraría qué necesito sí o sí y qué me gusta simplemente porque me gusta, si necesito una librería, tengo un límite de memoria o el equipo ya trabaja bien con un stack, eso pesa infinitamente más que usar el lenguaje con menos milisegundos de respuesta en un benchmark que no tiene nada que ver con mi aplicación.

## Go: es simple

Para una API, una herramienta de infraestructura o una aplicación de terminal, casi siempre miraría Go primero, no porque no haya más opciones, simplemente es por donde empezaría si no tengo una razón clara para aprovechar lo que ofrece otro lenguaje.

Me gusta que el código sea directo, que tengamos herramientas comunes y que la librería estándar ya te quite bastante trabajo, desde HTTP y JSON hasta los tests unitarios ya están integrados sin librerías externas ,todo lo que cuentan sobre [Go para servicios y herramientas de infraestructura](https://go.dev/solutions/cloud) encaja bastante con lo que yo suelo buscar.

También me gusta volver a una función después de un tiempo y poder seguir lo que pasa con los datos sin tener que acordarme de todas las capas de abstracción (y si la IA suele escribir por tí, esto resulta especialmente útil), que se repite código? Sí, sobre todo al manejar errores, qu hay más líneas de las que me gustaría? Pues a veces también, y puede quedar menos elegante, pero si veo claramente qué está pasando y qué ocurre cuando algo falla, es perfecto.

### Concurrencia cómoda, no recursos infinitos

Con las goroutines puedes organizar tareas concurrentes con poco código y tienes los channels y otras herramientas de sincronización para coordinarlas, ahora, **concurrencia y paralelismo no son lo mismo**, tener varias cosas en marcha no significa que se estén ejecutando todas a la vez, esto también lo explican en [Effective Go](https://go.dev/doc/effective_go#concurrency).

Si tienes varias operaciones esperando a la red, puedes aprovechar esas esperas para avanzar con otras cosas pero necesitas capacidad para repartir trabajo si esas cosas están hacienco cálculos.

Y a su vez, que puedas lanzar muchas goroutines no significa que puedas lanzar todas las que quieras.

Imagina que estás importando miles de registros y decides lanzar una goroutine por registro, queda "bien" sobre todo cuando pruebas en local, hasta que despliegas, lo usan concurrentemente varios usuarios y todas quieren una conexión a la misma base de datos xD. Yo ahí miraría cuántas operaciones aguanta la base de datos sin empezar a ir mal, no lo poco que me cuesta escribir más goroutines.

### Tener un binario ayuda, pero todavía hay cosas que desplegar

Poder tener un ejecutable viene bien para desplegar, con Go su runtime va dentro del binario y no tienes que instalar Go en la máquina donde lo vas a ejecutar, pero tampoco puedes copiar cualquier binario a cualquier servidor y ya está, tienes que tener en cuenta el sistema operativo, la arquitectura y las dependencias de tu aplicación, si usas [cgo](https://pkg.go.dev/cmd/cgo), también entran librerías nativas y cosas que necesitas para compilar y enlazar.

Y luego están la configuración, los certificados, las migraciones y los servicios externos, que siguen haciendo falta. Puedes simplificar bastante el despliegue, pero que el ejecutable sea un solo archivo no hace desaparecer todo lo demás.

### El recolector de basura también consume

El recolector de basura (Garbage Collector o GC) es un mecanismo que tienen algunos lenguajes de programación para liberar automáticamente la memoria que tu programa ya no necesita, por ejemplo, imagina que en tu programa:

- Reservas memoria: creas un usuario llamado Pepe (no en una DB si no en tu mismo programa).
- Utilizas esa memoria: imprimes su nombre.
- Dejas de necesitarla: cuando termina la función, ya no necesitas ese usuario.
- Entra el Garbage Collector: detecta que el objeto ya no es accesible y puede recuperar la memoria que ocupaba.

Y Go tiene un recolector de basura, pero eso no significa que puedas escribir cualquier burrada y olvidarte del tema, el recolector también consume recursos.

Tampoco tiene mucho sentido hablar de cómo rinde usando siempre los mismos datos antiguos. Por ejemplo, en [Go 1.26, Green Tea pasó a estar activado por defecto](https://go.dev/doc/go1.26), con mejoras en el trabajo del recolector.

Eso sí, que el GC de Go consuma menos no significa que toda tu aplicación vaya a mejorar en la misma proporción simplemente con usar la nueva versión o activar Green Tea.

## Rust: el compilador te revisa muchas cosas, pero no lo sabe todo

Lo que me parece interesante de Rust es que tienes que dejar claro quién controla un valor y cómo se puede acceder a él, y el ownership comprueba esas reglas antes de ejecutar el programa. Cuando empecé a aprenderlo fue literalmente como aprender otra cosa diferente, me pasó algo parecido la primera vez que programé en assembler, tienes que pensar de otra manera con respecto a los lenguajes tradicionales, incluso es muy muy distinto de trabajar con otros lenguajes de bajo nivel serios como C/C++.

Con las referencias, en el caso habitual, puedes tener varios "préstamos" compartidos o uno mutable, respetando cuándo son válidos, esto te sonará a chino y es dificil de explicar sin ejemplos concretos, asi que checka el [libro oficial](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html) ahi explica todo esto bastante mejor.

Otra cosa es que el código seguro de Rust evita las _data races_, que son ciertos accesos a memoria que se pisan al ocurrir a la vez sin sincronización, **pero sigues pudiendo tener otras condiciones de carrera, deadlocks y errores de lógica**, la propia documentación [lo deja claro](https://doc.rust-lang.org/nomicon/races.html).

Dos peticiones pueden intentar reservar la última entrada de un evento, dos procesos pueden tramitar dos veces la misma operación y un usuario puede acabar leyendo un documento de otro porque has comprobado mal los permisos.

El compilador no sabe cómo tiene que funcionar tu aplicación, las transacciones, cómo coordinas las cosas, quién puede acceder a qué y cómo se comporta el sistema te sigue tocando a ti, Rust no te lo va a resolver solo por ser Rust.

Y aprender Rust porque te interesa está perfectamente bien, pero eso no es lo mismo que tener una razón para migrar un servicio, si lo vas a reescribir, tendrás que explicar qué esperas mejorar y cómo vas a comprobar que ha mejorado, rehacer un sistema entero porque alguien ha decidido que Rust es más moderno, más seguro o más rápido me parece bastante absurdo, sobre todo hoy día que parece que nadie tiene criterio propio y lo único que hace es copiar todo lo que otros hacen, como una tanda de aplicaciones famosas se están reimplementando en Rust no significa que el backend para tu formulario de contacto también vaya a ir mejor por reescribirlo en Rust.

Yo a Rust lo tendría muy en cuenta sobre todo para componentes de sistemas operativos, librerías nativas o servicios donde necesites controlar mucho la memoria y ajustar bastante los tiempos de respuesta. Y sobre todo si el equipo **ya domina Rust**. Para una API normal? Pues también puede tener sentido, no tienes que inventarte una necesidad de tiempo real para usar una herramienta con la que ya sabes trabajar.

Lo que no haría es dar por hecho que meterlo sale gratis porque el binario vaya a ser más eficiente, también cuenta cuánto lo conoce el equipo que va a mantener el proyecto, qué dependencias necesitas y el trabajo de encajarlo con lo que ya tienes.

## Node con TypeScript: si ya trabajas bien con él, eso cuenta

Si el equipo ya trabaja bien con JavaScript y TypeScript, usarlo también en el backend puede tener bastante sentido, me ha pasado en el trabajo muchas veces.

Yendo a lo técnico, Node organiza buena parte del trabajo con un bucle de eventos y operaciones asíncronas, lo que llamamos el **Event Loop**. Cuando una operación está esperando entrada o salida, puede ir atendiendo otras cosas, pero si te pones a ejecutar código síncrono pesado en ese bucle, haces esperar a los demás. Lo explican en la [documentación de Node](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop).

Esto especialmente merece profunizar más que simplemente decir "Node tiene un hilo y por tanto no escala".

También tienes los [`worker_threads` para ejecutar JavaScript en paralelo](https://nodejs.org/api/worker_threads.html), que vienen especialmente bien para trabajo que tira mucho de CPU, otra cosa es que te convenga crear un worker por petición, porque crearlos, coordinarlos y pasarles datos también cuesta. La opción está ahí, pero hay que pensar cómo usarla.

Yo miraría qué está haciendo el servicio. Una API que consulta datos y llama a otros sistemas no hace el mismo trabajo que un proceso que transforma archivos grandes, por mucho que a los dos los llamemos "backend/micro servicio".

## Python: todo lo que ya tienes hecho también importa

Con Python hay una pregunta que me interesa bastante más de lo que suele salir en las comparativas de velocidad y esa es **¿cuánto trabajo tienes ya resuelto?** Algo parecido a lo que te planteas con Ruby, por ejemplo.

Para analizar datos, experimentar o hacer cálculo científico, yo empezaría mirando las librerías que hay, no necesito que Python gane todos los benchmarks, necesito saber qué puedo aprovechar sin tener que hacerlo yo otra vez.

[NumPy](https://numpy.org/doc/stable/user/whatisnumpy.html), por ejemplo, hace muchas operaciones con código compilado, es decir, ya se procesa a otro nivel y no "arrastra" python para esto, si comparas un bucle de Python con uno de Go, no puedes tomar esa diferencia y asumir que será la misma con una operación vectorizada. Una cosa es llamar a una operación desde Python y otra que el intérprete tenga que ejecutar cada paso.

Aquí hacemos algoritmos en Go porque queremos entenderlos y porque a mí me gusta Go, para aprender tiene todo el sentido. Pero de ahí a sustituir las librerías científicas por una carpeta de utilidades que me he hecho yo, pues eso no tendría sentido.

No voy a mantener mis propias librerías de cálculo solo para demostrar lo mucho que me gusta Go.

### Para llamar a un LLM no tienes que cambiar de lenguaje

Una cosa es trabajar con modelos y datos, y otra llamar a un servicio por HTTP para que te devuelva una respuesta, si estás conectando tu backend con un proveedor de LLM como OpenAI, eso no es nada diferente de conectarte a una API que te dice el clima, no necesitas cambiar de lenguaje para eso, lo que necesitas es una integración por red.

Si necesitas herramientas concretas para entrenar, evaluar o transformar datos, las librerías de Python pueden ser una buena razón para elegirlo, y usualmente en ese caso no estarías haciendo un "backend". Pero si tu backend prepara una petición y recibe texto de un proveedor, yo empezaría tratándolo como lo que es: una integración por red.

Ahí miraría los tiempos de espera, los límites del proveedor, los reintentos, cómo cancelar y qué hacer con los errores, no empezaría migrando el servicio porque alguien haya decidido que ponerle un chat a una aplicación la convierte en trabajo para un científico de datos.

## El tipado ayuda, pero no son una garantía

Lo de poner un punto de comparación en "seguridad de tipos" entre los 4 lenguajes como si Go, Rust, TypeScript y Python comprobaran exactamente lo mismo no me dice demasiado.

En Python, por ejemplo, las anotaciones sirven para herramientas de análisis, pero [el runtime no las impone por sí mismo](https://docs.python.org/3/library/typing.html). Y en TypeScript ya sabemos que ejecutar el código y comprobar los tipos son cosas distintas, lo que me interesa es qué errores detecta cada uno y qué estamos comprobando de verdad en nuestro proyecto.

![el-compilador-no-conoce-tu-negocio](https://img.iadev.blog/posts/re-a-3.png)

Yo enfoco el tipado por ejemplo en un backend de Node.js con Typescript para cumplir estrictamente con arquitectura, SOLID, y demás buenas prácticas, sobre todo para que el linter me ayude a detectar errores de tipo y me obligue a declarar las interfaces que voy a usar, pero no me da una garantía de que el sistema sea seguro por sí mismo, si usas Typescript y luego a todo le pones "any" o "unknown" pues ya no hay seguridad de tipos, y si tu backend tiene que recibir datos de un cliente externo, el tipado no te va a proteger de que te llegue un JSON con campos que no esperabas.

También puedes tener un número perfectamente válido que sea un precio negativo que tu aplicación no debería aceptar, un identificador bien formado puede ser de otro usuario, y una fecha válida puede saltarse una regla de cancelación.

Podemos usar tipos específicos, constructores y validaciones para que sea más difícil acabar con datos o estados que no queremos, eso me parece bien, pero alguien tiene que decidir qué se acepta, dónde se comprueba y qué hacemos cuando llegan datos de fuera.

## Diez veces más rápido… ¿pero qué parte?

Aquí ya dejaría los gustos a un lado y empezaría a medir.

Yo no elegiría el backend de una aplicación entera por un benchmark, pero tampoco diría que el lenguaje da igual siempre, las dos cosas te ahorran tener que mirar qué está pasando en tu aplicación, que es justo lo que hace falta.

Vamos con un ejemplo **inventado**, que no son mediciones de estos lenguajes, supongamos que tenemos una petición con dos partes que se ejecutan una después de la otra:

```text
Base de datos y dependencias externas: 570ms
Código de la aplicación:               30ms
Tiempo total:                         600ms
```

Reescribimos el código de la aplicación y conseguimos que vaya diez veces más rápido, todo lo demás sigue igual:

```text
Base de datos y dependencias externas: 570ms
Código de la aplicación:                3ms
Tiempo total:                         573ms
```

La parte reescrita es diez veces más rápida, pero **la petición completa tarda un 4,5% menos.**

Incluso eliminando mágicamente esos 30ms, el límite de reducción sería un 5% bajo estas condiciones, puedes escribir el handler en ensamblador si te da la gana para que seas incluso más específico que con Rust pero los otros 570ms que has decidido no investigar siguen ahí.

![10x-en-una-parte-no-son-10x-en-todo](https://img.iadev.blog/posts/re-a-2png.png)

Significa que reescribir no sirve para nada? No, significa que hay que saber qué quieres mejorar, y ojo, en este ejemplo las dos partes van una detrás de otra y no cambia nada más. Con carga, las colas y la saturación pueden hacer que la cosa se comporte de otra manera, así que esta cuenta no te ahorra hacer una prueba de verdad.

### No me enseñes solo la petición que mejor ha salido

Yo probaría con una carga que se parezca a la que vamos a tener y haciendo el mismo trabajo, miraría cuánto tardan las peticiones, cuántas operaciones puede mantener el servicio, cuánta memoria y CPU consume y cuántos errores da también, vería p95 y p99 para no quedarme solo con lo que pasa en una petición típica.

Porque comparar un servicio que valida datos, comprueba permisos y guarda información con otro que devuelve un JSON fijo, pues no, no tiene sentido alguno, si quitas la autenticación para ganar el benchmark, has cambiado lo que hace la aplicación, no la has optimizado.

Antes de migrar miraría las consultas, las llamadas que estamos repitiendo, cuántos datos movemos y si hay trabajo que ni siquiera hace falta hacer.

Ahora, si de verdad el límite está en la CPU o en la memoria, claro que hay que mirarlo en serio, bajar lo que consume cada operación puede compensar bastante trabajo, pero eso de que "con este lenguaje necesitas la mitad de servidores", primero vamos a probarlo con lo nuestro y luego hablamos, cuando te pidan una justificación de por qué escribir algo en Rust en vez de Node, Go, PHP o lo que sea no contestes "Rust es más eficiente en memoria y más rápido", porque retrata que lo único que sabes hacer es repetir lo que todos dicen en internet.

Lo que vamos a ahorrar en la nube hay que calcularlo, no creérselo y ya.

## Tres casos reales

Cuando leo que una empresa ha cambiado de lenguaje, me interesa saber qué problema tenía y cómo comprobó que el cambio había servido, si me quedo solo con el logo y el lenguaje que eligieron, puedo usar el caso para defender casi lo que me dé la gana.

### Discord: tenían un problema concreto y lo resolvieron con Rust

En febrero de 2020, Discord contó cómo había pasado su servicio _Read States_ de Go a Rust. Habían encontrado picos de latencia relacionados con el recolector y con cómo tenían montada la caché, con la nueva implementación quitaron esos picos y, después de hacer más optimizaciones, también mejoraron otras métricas, esto lo cuentan en [su post de ingeniería](https://discord.com/blog/why-discord-is-switching-from-go-to-rust).

Eso es lo que me interesa del caso, ellos sabían qué necesitaban, miraron qué fallaba, probaron otra opción y comprobaron qué había pasado, no lo hicieron porque Rust era más rápido y ya.

De ahí no sale que reescribieran todos los servicios de Discord ni que cualquier programa en Go vaya a tener ese problema.

### TypeScript: con Go también puedes hacer trabajo pesado

En marzo de 2025, Microsoft anunció que estaba haciendo un port nativo del compilador de TypeScript en Go, en las pruebas que publicaron en [el anuncio original](https://devblogs.microsoft.com/typescript/typescript-native-port/), mostraron mejoras de unas diez veces.

A mí me interesa bastante [por qué eligieron Go](https://github.com/microsoft/typescript-go/discussions/411), pues les encajaba con la estructura que ya tenían, con el trabajo con grafos y con cómo necesitaban gestionar la memoria, el coste del recolector no les suponía el mismo problema que puede suponer en otros sistemas.

Estaban buscando cómo pasar ese compilador a una implementación nativa, no qué lenguaje ganaba más puntos en una tabla genérica.

Y por aclararlo, que el compilador esté escrito en Go no hace que tu aplicación TypeScript se convierta en un binario Go, una cosa es la herramienta que procesa tu código y otra lo que estás construyendo con ella.

### Cloudflare: también cambiaron cómo estaba montado el sistema

Cloudflare presentó Pingora en 2022, un proxy escrito en Rust para sustituir lo que tenían con NGINX. En [su explicación técnica](https://blog.cloudflare.com/how-we-built-pingora-the-proxy-that-connects-cloudflare-to-the-internet/) hablan de mejoras en el consumo de recursos, pero también de cambios en cómo ejecutaban el trabajo y reutilizaban las conexiones.

No fue cambiar palabras clave y volver a desplegar lo mismo.

Si cambias el lenguaje, las estructuras de datos y cómo organizas el trabajo, lo que sale depende de todo eso, yo no leería el caso como "Rust te ahorra esto", lo leería como "lo montaron así, para ese trabajo, y consiguieron estas mejoras".

## Lo que cuesta no es solo lo que pagas por el servidor

Aquí solemos mezclar dos cosas, elegir con qué empezar un proyecto y decidir si merece la pena cambiar uno que ya existe.

Si empiezas de cero, estás viendo qué camino seguir, si ya tienes algo funcionando, hay comportamientos que se han ido añadiendo, integraciones y gente que lo usa, no es la misma situación, y lo que tienes que comprobar antes de cambiar tampoco es lo mismo.

Yo metería en la cuenta el desarrollo, la infraestructura, el mantenimiento y lo que puede salir mal, ahorrar recursos está bien, pero aprender el stack, cambiar el despliegue, conseguir que todo siga haciendo lo mismo y revisar que no hemos roto lo que funcionaba también cuesta.

No me vale comparar el precio de dos máquinas y ya, a lo mejor lo que ahorras en infraestructura no compensa todo el tiempo de migración, o a lo mejor trabajas a una escala donde el ahorro sí paga de sobra ese esfuerzo, pero hay que mirar las dos cosas antes de decir que sale más barato.

Y cuando reescribes algo no basta con rehacer las funciones de las que te acuerdas, también están esas excepciones que parecen una tontería hasta que descubres que una integración antigua depende de ellas, yo miraría cuáles están ahí porque sí y cuáles siguen haciendo falta antes de quitarlas.

## Que un lenguaje guste, aprenderlo y encontrar trabajo son cosas distintas

En la encuesta de Stack Overflow de 2025, Rust salió como el lenguaje más admirado, con un 72%. Eso quiere decir que, de quienes lo habían usado, ese porcentaje quería seguir usándolo, mo que el 72% de todos los devs programara en Rust, que no es lo mismo, hay que mirar [qué está midiendo la encuesta](https://survey.stackoverflow.co/2025/technology), no solo el número.

Está bien para saber si la gente está contenta usándolo, porque eso tiene otras implicaciones a futuro, pero si voy a aprender algo para buscar trabajo, miraría qué ofertas están a mi alcance, qué experiencia piden, qué condiciones tienen y qué tipo de producto voy a hacer.

Tampoco daría por hecho que un sueldo alto viene del lenguaje que aparece en la oferta, habrá que mirar el sector, la responsabilidad y la experiencia, aprender Go no hace que te suban el sueldo automáticamente, y aprender Rust tampoco te coloca directamente en un puesto de sistemas.

Yo empezaría con algo pequeño que puedas terminar: una CLI en Go, un procesador de archivos en Rust, una API en TypeScript o una automatización de datos en Python, algo que puedas ejecutar, probar y tocar sin aprender a la vez un lenguaje, un framework y cómo montar una arquitectura distribuida.

Porque luego a ver cuál de las tres cosas es la que te está dando problemas.

## Da igual el lenguaje, lo programa la IA

Ok pero seguimos sin resolver la pregunta, porque alguien tendrá que entender lo que salga.

Imagina que un agente te genera el código, arranca y pasa los tests que tienes, bien, ahora toca mirar cómo maneja los errores, qué pasa si cancelas una tarea y si las dependencias que metió tienen sentido (para esto debes conocer el ecosistema que rodea el lenguaje, y para ello debes empaparte en él), si nadie del equipo conoce lo suficiente el lenguaje, cómo cño sabemos si lo que ha hecho la IA está bien? estaríamos vibecodeando.

No digo que tengas que aprenderte toda la documentación antes de usar nada, digo que conseguir que te genere código y saber hacerte cargo de ese código después son cosas distintas.

Para aprender, usaría esa ayuda con ejemplos pequeños, los compararía con la documentación y tocaría cosas para ver qué pasa, para elegir con qué montar un producto, seguiría mirando quién va a poder revisar el código, encontrar los fallos y mantenerlo.

Que el agente escriba en cuatro lenguajes tampoco significa que tu aplicación tenga que usar los cuatro y si el equipo no conoce una tecnología, tampoco pasa a conocerla porque el agente sí pueda escribir código con ella.

No es solo si podemos sacar el código, es si vamos a saber qué hacer cuando empiece a comportarse de una manera que no esperábamos.

## Puedes mezclarlos sin montar cuatro microservicios

También puedes usar varios, una API en Go podría coordinar el trabajo, aprovechar Python para una parte de análisis y hacer un componente concreto en Rust, justamente esto me ha tocado hacerlo en un proyecto reciente.

Yo no monté eso sin comprobar antes para qué me servía, si vas a separar una parte, mira si lo que ganas compensa tener que mantener más herramientas, otra integración y más dependencias.

Si metes una librería nativa, tienes que ver cómo se entiende con el resto, si montas otro servicio, tienes que comunicarlo y encargarte también de que funcione. no cuestan lo mismo, pero ninguna de las dos cosas viene sin trabajo extra.

Usar dos lenguajes no te obliga a tener dos servicios, y tener dos servicios tampoco es una razón para escribir cada uno en un lenguaje.

Para un equipo pequeño prefiero algo que se entienda a repartir cada carpeta entre el lenguaje que supuestamente es el mejor para eso, no necesito montar lo mismo que una multinacional en un repo que mantenemos dos personas.

## Entonces, ¿qué elegiría yo?

Yo empezaría mirando esto, no es una clasificación de cuál puede hacer más cosas ni pasa nada por elegir algo que no coincida con la tabla:

| Lo que necesito hacer                                                   | Por dónde empezaría | Qué me haría elegir otra cosa                                                                                                                                                                |
| ----------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| APIs, infraestructura y herramientas de terminal                        | Go                  | Lo que conoce el equipo, una librería que necesitemos o algo concreto que deba cumplir el proyecto, también podría ser por el stack de cliente, donde y cómo despliegan ellos es importante. |
| Controlar mucho la memoria y hacer componentes con requisitos exigentes | Rust                | Qué errores te evita y si compensa el trabajo de usarlo e integrarlo, porque Rust es difícil.                                                                                                |
| Un producto web con un equipo que ya domina TypeScript                  | Node con TypeScript | Cuánto trabajo de CPU hay, qué necesitamos para desplegarlo y mantenerlo funcionando, y cómo validamos los datos de fuera.                                                                   |
| Análisis de datos y trabajo con librerías científicas                   | Python              | Dónde se hacen los cálculos, qué dependencias tenemos y cómo lo llevamos a producción.                                                                                                       |
| Una aplicación que ya hace lo que necesitamos                           | Lo que ya usamos    | Un problema que podamos demostrar y que merezca la pena resolver cambiando de stack.                                                                                                         |

La última fila me parece importante: **quedarte con lo que tienes también es una decisión técnica**, no hace falta fingir que tu stack es perfecto, basta con que cambiarlo todavía no compense.

Para un proyecto nuevo, probaría a construir una parte de verdad con la opción que más me encaje: recibir datos, validarlos, guardarlos, manejar errores y desplegar, no hacer cuatro "hola, mundo" que no se parecen en nada a lo que vamos a mantener después, esto es un **excelente caso de uso para hacer Vibecode**, ya que podríamos decirle a la IA que nos haga la misma implementación en todos los lenguajes que queremos comparar, claramente faltará afinar detalles pero si mantenemos el ejemplo sencillo y simple de leer y entender, podemos sacar mucha información de ahi, **luego lo tiramos a la basura y lo empezamos a hacer bien**.

Si estamos hablando de migrar, primero vería qué queremos conseguir, qué problema queremos quitarnos, con qué carga y qué cosas no pueden empeorar por el camino, si todavía no sé decir eso, tampoco sé si tiene sentido reescribirlo.

Y si lo que pasa es que quiero aprender o me apetece probar algo, pues lo digo y ya está, prefiero eso a decir que necesitamos escalar cuando en realidad lo que tengo son ganas de usar otro lenguaje.

## El compilador no sustituye al criterio

No es casualidad que los que suelen decir, hazlo en Rust porque es más rápido, son los mismos que dicen que no leen el código que genera la IA porque no tiene sentido (y por tanto autovalidan hacer todo en Rust porque no van a revisar nada).

Yo voy a seguir usando Go donde me venga bien, porque me gusta trabajar con él y porque miraré si me sirve para lo que necesito. No hace falta que gane esta comparativa.

La pregunta que intentaría responder no es **¿qué lenguaje gana en 2027?**, sino **¿qué me permite construir y mantener esto con los requisitos que tengo?**.

Y ahí toca medir si hablamos de rendimiento, saber qué errores evita cada herramienta y cuáles no si hablamos de seguridad, y acordarse de quien va a tener que tocar el código cuando se nos pase la emoción de usar algo nuevo.

Sí, puedes pedirle a una IA que compare los cuatro, pero escribir "actúa como arquitecto sénior y elige el mejor stack" no le da los datos de tu aplicación que tú todavía no te has parado a mirar.

Antes de pedirle que lo reescriba todo, abre el profiler, mira las trazas y revisa esa consulta, a lo mejor el lenguaje ya te servía y lo único que faltaba era un índice en la db ;)
