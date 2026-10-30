---
title: "De Prompt Engineer a AI Engineer: la evolución del humo"
description: "Antes escribías prompts, ahora tienes un harness, cinco agentes y un título de ingeniero. Lo único que sigue faltando es saber desarrollar software."
published_at: 2026-10-30
author: prinick96
pinned: true
categories:
  - humo
  - colateral-damage
  - development
---

Llevo un tiempo viendo publicaciones en LinkedIn que se repiten una y otra vez, nadie habla de más nada: los programadores estamos muertos, las PR están obsoletas, la arquitectura es una pérdida de tiempo, leer el código que produce la IA es innecesario, los humanos somos el cuello de botella de la IA, los QA ya no son necesarios porque la misma IA puede verificar lo que ella misma hace, y ahora cualquier persona puede hacer lo que un profesional con años de experiencia desde un chat.

De hecho, probablemente el próximo sistema bancario que utilices lo haya vibecodeado alguien que hace dos semanas descubrió qué es una variable, pero ya se presenta como _AI Engineer_, la "cúspide" actual de lo que comenzó como _Prompt Engineer_, se acuerdan?

Voy a dejar clara mi postura desde el principio: **el vibe coding, entendido como delegar la construcción del software sin comprender ni controlar lo que se genera, me parece catastrófico e irresponsable para hacer cosas serias**. Para experimentar, aprender, crear herramientas personales o validar ideas, me parece espectacular, que te sientas autovalidado con la IA no significa que sea válido lo que produces con ella.

Y no, no odio la IA, ni tengo una postura Anti-IA. La utilizo todos los días para desarrollar software de verdad, este mismo blog está programado utilizando IA, pero lee de nuevo, **programado**. Precisamente por eso me preocupa que estemos confundiendo **escribir código**, **desarrollar software** y **conseguir que algo parezca funcionar en una demo**.

Son tres cosas bastante diferentes.

## El problema empieza cuando confundimos "funciona" con "está bien hecho"

El término _vibe coding_ lo popularizó Andrej Karpathy en febrero de 2025, su descripción era bastante concreta: dejarse llevar, aceptar cambios sin leer los _diffs_, pegar errores al modelo y continuar hasta que todo simplemente funcione, y lo contaba, precisamente, hablando de proyectos experimentales de fin de semana, no de poner datos bancarios de terceros a disposición de un agente con acceso a entornos de producción, [aquí está la publicación original](https://x.com/karpathy/status/1886192184808149383).

Después llegó LinkedIn, el Instagram del corpo, donde todos son el profesional hiper productivo ideal, Linkedin hizo su magia y convirtió una anécdota en una metodología de ingeniería.

```text
> Hazme un SaaS de gestión empresarial.
> Que tenga usuarios, pagos, un dashboard y una IA.
> Hazlo escalable, seguro y con buenas prácticas, no comentas errores y verifica que no existan bugs.

✓ 142.789 archivos creados
✓ 666 tests añadidos
✓ Tu aplicación está lista para producción
```

Lista según quién? Qué requisitos cumple? Qué pasa si dos users actualizan el mismo registro a la vez? Dónde están los límites de auth? Cómo se recupera un fallo durante una migración de datos? Quién ha decidido cómo se gestionan las transacciones, los permisos, las colas o las dependencias externas?

Ah, ya, pusimos "escalable y seguro" en el prompt, un arte, es algo que no se te puede ocurrir si no pasaste por la carrera de Ingeniería en IA.

La cuestión no es que la IA sea incapaz de producir buen código, de hecho lo puede hacer, y mucho. El problema es que **una aplicación no es la suma de archivos que consiguen compilar**, es un conjunto de decisiones que tienen consecuencias cuando llegan usuarios reales, datos reales y errores que nadie había previsto.

Y sí, hasta [Epic Games ha hablado abiertamente de "vibecoding" para desarrollar Unreal Engine](https://www.europapress.es/portaltic/videojuegos/noticia-epic-games-confirma-usa-ia-vibe-coding-desarrollar-codigo-caracteristicas-unreal-engine-20261029123142.html), pero fíjate en el detalle: sus responsables explican que los ingenieros siguen dirigiendo las herramientas para conseguir una arquitectura concreta, con supervisión de requisitos de rendimiento y escalabilidad.

Si eso es lo que llamamos _vibe coding_, hemos modificado el término original hasta incluir cualquier desarrollo asistido por IA, aquí la diferencia no es quién pulsa las teclas, es quién entiende y controla lo que se está construyendo.

![demo-no-es-produccion](https://i.8upload.com/image/b74916f49cdbc1a1/01-demo-no-es-produccion.png)

## No-code: adelante. De verdad

No te emociones, quiero separar dos cosas que se están metiendo en el mismo saco: el _no-code_ y el _vibe coding_ sin supervisión.

Me parece excelente que alguien que no sabe programar pueda construirse herramientas, una persona con una tienda de barrio que necesita una web con su horario, su dirección, sus servicios y un formulario de contacto **no debería necesitar contratar a un equipo de ingenieros** de una consultora que le cobrará 60.000€ por un desarrollo que puede hacer cualquier junior en unos cuantos días.

Si mañana una peluquería puede hacerse su página hablando con una IA, me parece un avance, si una asociación puede crear una pequeña herramienta interna, también, si alguien quiere automatizar el inventario de su negocio o montarse una aplicación que solo va a utilizar él, en vez de pagar por una suscripción de un SaaS, fantástico.

Y, esto tampoco es que lo hayamos inventado ayer con la IA. WordPress, Joomla, Drupal, los constructores visuales y mil herramientas de automatización llevan años reduciendo esa barrera técnica, lo que hace la IA es reducirla todavía más: ya no tienes que aprender dónde está cada opción de un panel; puedes explicar lo que necesitas en lenguaje natural.

**Eso democratiza la creación de software. Y es bueno.**

Pero hay una frontera que no desaparece porque hayamos quitado botones de una interfaz, una web informativa no tiene las mismas necesidades que un sistema que guarda historiales médicos, procesa pagos, administra empleados o decide qué usuario puede ver los datos de otro, incluso el formulario de la peluquería tendrá que gestionar correctamente los datos personales si los guarda.

Mi crítica no es contra quien utiliza estas herramientas para resolver sus problemas, es contra la idea de que, porque alguien pueda crear una interfaz, automáticamente pueda garantizar la ingeniería que hay detrás...

Y también contra el discurso de que esos pequeños encargos eran un gran mercado para todos los desarrolladores, puede que una parte de ese trabajo cambie o desaparezca, no lo niego, pero mi valor profesional no consiste en cobrarle a una tienda por ponerle un horario en una página HTML.

> De hecho, yo personalmente, soy de esos devs que odian tocar un Wordpress y todos estos sitemas que te fabrican y venden las agencias de marketing, me he alejado de esa área "fácil", digo todo esto sin ánimos de despreciar el trabajo de nadie, simplemente es un área que siempre ha estado ahí y no profundiza en términos técnicos, por eso no ha sido de mi interés, y claramente hace años pasé por allí, pero me gustó más la parte de desarrollar de cero una web que montarmela con Wordpress instalando plugins y tal, y bueno, lo demás se cuenta solo.

Si tienes un bar y te apetece crearte una página web muy brutal sobre tu bar, donde mientras scrolleas ves como el grifo hace caer la cerveza hasta el vaso, con efectos 3D etc, pues ya lo puedes hacer contratando una suscripción de IA y tirando hacia adelante con ella, y eso es increíble, las agencias que hacían este tipo de cosas son las que tendrán que evolucionar para competir de otras maneras.

## El vibe coding es una herramienta espectacular para hacer prototipos

Aquí voy a defenderlo, porque lo he utilizado para esto y funciona muy bien.

![prototipar-aprender-disenar](https://i.8upload.com/image/68b621a95565b883/02-prototipar-aprender-disenar.png)

Cuando desarrollamos un producto nuevo, muchas veces ni siquiera sabemos exactamente qué estamos construyendo, tenemos una idea, reuniones con el cliente, requisitos a medio definir, conversaciones con diseño, flujos de UX que cambian y ese maravilloso momento en el que alguien descubre en la quinta reunión algo que habría sido útil saber en la primera.

Antes podíamos pasar semanas discutiendo pantallas y comportamientos que existían solamente en documentos, _wireframes_ y nuestra imaginación. Hoy puedo generar un prototipo navegable en relativamente poco tiempo, enseñarlo, tocarlo, romperlo y descubrir lo que realmente queríamos hacer.

Eso tiene muchísimo valor, no porque el prototipo sea ya el producto, sino porque **me permite tomar mejores decisiones antes de empezar a construir el producto**.

Puedo descubrir que el flujo de registro no tiene sentido, que una funcionalidad necesita otro modelo de datos o que la idea inicial del cliente cambia completamente en cuanto la ve funcionando y prefiero tirar a la basura un prototipo que costó unas horas que descubrir, tres meses después, que hemos diseñado el dominio del producto alrededor de una suposición equivocada.

Mi proceso ideal es bastante simple: usar la IA para explorar y prototipar, decidir qué merece la pena construir, diseñar el sistema de verdad y después, utilizar de nuevo la IA para acelerar su implementación.

**El prototipo debe ser una materialización del producto, para probar la idea, no para seguirlo evolucionando hasta que creamos que está listo para producción sin saber que hay detrás.**

Que algo sea desechable es una decisión técnica perfectamente legítima, que sea desechable y lo vendas como infraestructura crítica, no.

## Yo programo con IA. Lo que no hago es delegarle mi criterio

Esto lo desarrollaré en otro artículo, donde explicaré mi _setup_ y cómo trabajo con IA a diario, pero quiero adelantar un poco lo esencial.

Yo sigo desarrollando software de una manera bastante tradicional: pienso el producto, delimito iteraciones, defino los casos de uso, decido la arquitectura y luego implemento. La diferencia es que ahora tengo un asistente que investiga, propone alternativas, escribe código y hace refactorizaciones a una velocidad a la que mis manos nunca llegaron antes.

[![xnova-rev-wikipedia](https://upload.wikimedia.org/wikipedia/commons/e/e4/Xnovarevolution1.jpg?uselang=es)](https://commons.wikimedia.org/wiki/File:Xnovarevolution1.jpg?uselang=es)

Yo aprendí a programar aprox a los 10 años, una de las primeras cosas que hice a eso de los 13/14 años fue entrar en el desarrollo de un clon de OGame en el que estuve participando por unos años, no se si quién esté leyendo esto conozca los Xnova, que básicamente eran clones open source de este juego, yo desarrollé un fork que llamé [xnova revolution](https://www.xnovarevolution.net/) y si trasteas por internet encontrarás el código en algún [SVN](https://sourceforge.net/projects/xnovarevolution/), incluso en Softonic xD ni siquiera usaba Git porque no sabía lo que era, era un niño aprendiendo a programar, y programaba en un super monolito de PHP, HTML, CSS, JS y SQL y esos fueron mis primeros pasos reales para ir adentrándome en la programación de forma real y desde ese entonces siempre he tenido la sensación de que mis manos iban más despacio que mi cabeza, ahora con la IA puedo hablar con el editor una solución que estoy imaginando y empezar a verla materializarse mientras seguimos discutiendo los detalles.

Eso es brutal, para mí, la IA es una de las mejores herramientas que han llegado al desarrollo de software y quizá la próxima evolución sea conectarnos alguna cosa a la cabeza y que los pensamientos fluyan directamente, porque ahora siento que se me seca la garganta y que mi cabeza va más rápido de lo que puedo hablar.

> La IA es un potenciador, si eres competente en algo, te haces super competente, si eres incompetente, te haces super incompetente.

### Cómo programo con IA?

Imaginemos que necesito implementar una autenticación de cero, la diferencia entre mi forma de trabajar y la de una criatura que haga vibecoding no es el modelo, ni la cantidad de agentes, ni el harness, es **quién decide cómo debe funcionar el sistema**.

El prompt no sería:

```text
Hazme un login con buenas prácticas.
```

Antes tendría que decidir muchas cosas:

- Cómo representamos los usuarios y las sesiones
- Cómo se almacenan y verifican las credenciales
- Qué mecanismo de autenticación encaja con el cliente
- Caducidad y revocación de sesiones
- Límites de intentos
- Recuperación de cuentas
- Permisos
- Auditoría;
- Tratamiento de errores
- Qué datos nunca deben aparecer en un log.
- Y un largo etc..

Después definiría cómo encaja esa funcionalidad en **mi arquitectura**, no en la arquitectura que el modelo improvise en ese momento.

Por ejemplo, si he elegido una arquitectura hexagonal, separaría dominio, casos de uso, contratos y adaptadores. El caso de uso no tendría que saber si persistimos mediante PostgreSQL, MongoDB u otro motor o una implementación de mocks para los tests, recibiría las dependencias a través de interfaces y las implementaciones concretas se conectarían en la composición de la aplicación.

En Go podría pedirle algo como esto, una vez definidos los tipos de dominio y el resto de contratos:

```go
type SessionRepository interface {
    Save(ctx context.Context, session Session) error
}

type LoginUseCase struct {
    users    UserRepository
    sessions SessionRepository
}

func NewLoginUseCase(
    users UserRepository,
    sessions SessionRepository,
) *LoginUseCase {
    return &LoginUseCase{
        users: users,
        sessions: sessions,
    }
}
```

No le estoy pidiendo que invente una solución, le estoy diciendo cómo se llama el caso de uso, qué responsabilidad tiene, qué contratos recibe, dónde debe vivir y qué restricciones debe respetar, luego puedo pedirle sugerencias de nombres, discutir si un contrato está mal planteado y cambiar de opinión **pero la decisión de diseño sigue siendo mía**.

Que algunas decisiones mías pueden estar equivocadas? Claro, sigo siendo humano, lo importante es **poder explicar por qué has tomado una decisión y qué harás cuando deje de ser la correcta**.

Por eso tampoco necesito necesariamente el modelo más gigantesco del mercado para cada tarea, si ya he resuelto el diseño y necesito que una herramienta implemente una instrucción concreta, un modelo más pequeño que siga bien las indicaciones es más que suficiente, para investigar un problema complejo, explorar alternativas o detectar puntos ciegos quizá use en algún momento puntual otro más capaz, elegir la herramienta también forma parte del trabajo, personalmente creo que el futuro estará en desarrollar asistido por modelos chinos de IA corriendo en local.

> La IA escribe conmigo, **no piensa por mí en el sentido de asumir mi responsabilidad técnica**, y yo no cambio al placer de diseñar una solución por revisar eternamente lo que decidió un agente.

## La peor parte del trabajo era revisar código ajeno

Hay algo que me resulta especialmente irónico de esta nueva era: hemos encontrado la forma de automatizar una de las partes más creativas de nuestro trabajo para quedarnos con una de las más fastidiosas.

Pregúntale a cualquier desarrollador qué prefiere: diseñar una solución e implementarla o abrir una PR de miles de líneas generado por alguien que no puede explicarte qué intentaba hacer.

Cuando revisas código de otra persona ya necesitas reconstruir su razonamiento, cuando lo genera una IA sin dirección suficiente, a veces te encuentras una colección de condiciones redundantes, capas innecesarias, duplicaciones y mucho **boilerplate** que no aporta absolutamente nada, y esa mierda es estresante.

Y sí: **funciona**, hasta que te toca cambiarlo.

En [otro artículo de este blog](https://iadev.blog/posts/la-ia-arreglo-un-bug-y-me-regalo-200000-lineas-de-deuda-tecnica/) conté cómo una IA encontró un bug real en una dependencia de mi backend Go y llegó a solucionarlo... copiando prácticamente una dependencia entera al proyecto fue una decisión de mantenimiento desastrosa.

Eso resume bastante bien la diferencia, la IA había conseguido el objetivo local: **arreglar el fallo**. Pero alguien tenía que hacerse la pregunta que faltaba: **¿es esta la forma correcta de mantener el sistema a partir de ahora?** y sí, no faltará el que diga "pues ponemos a otra IA que se lo pregunte" XD

Una encuesta de [Stack Overflow de 2025](https://survey.stackoverflow.co/2025/ai), encontró que el 66% de los encuestados señalaba como frustración las soluciones de IA que estaban casi bien, pero no del todo, otro 45% mencionó el tiempo adicional que exigía depurar código generado por IA, no significa que la IA siempre ralentice: significa que el coste de comprobar y corregir es parte del trabajo.

En otro [ensayo aleatorizado de METR publicado en 2025](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), 16 devs seniors tardaron un 19% más en terminar tareas reales en repositorios que conocían cuando se les permitía usar las herramientas de IA de aquel momento, lo curioso es que ellos creían haber ido más rápido, como efecto placebo, luego en [febrero de 2026, METR explicó](https://metr.org/blog/2026-02-24-uplift-update/) que los agentes más recientes probablemente aportaban mayores mejoras, aunque su nuevo estudio tenía sesgos que impedían cuantificarlas con fiabilidad todavía.

Con esto no digo que "la IA te hace más lento", es que **sentir que produces mucho no demuestra que hayas terminado antes ni que el resultado sea mejor**.

Y producir 500 líneas en diez segundos no es un win win si luego hacen falta dos días para entender por qué existen esas 500 lineas...

> Entonces, si no quieres quejarte de que te toca leer PR inhumanas, no dejes que hagan todo por ti y esfuerzate en pensar un poco, así cuando llegue el resultado final, sabes exactamente que hay y no existirá esa sensación de "desconfianza", debes ser responsable, que si algo sale mal la culpa será tuya, no puedes echarle la culpa a la IA.

## Daños colaterales: los bugs ya no esperan a que aprendas qué es una DB

Hasta aquí podríamos discutir de estilo, deuda técnica y productividad, pero vayamos a la parte donde alguien más paga por nuestros experimentos.

### 1. Código válido no significa código seguro

En su [informe de seguridad de código generado por IA de 2025](https://www.veracode.com/blog/genai-code-security-report/), Veracode probó más de cien modelos con un conjunto controlado de tareas en varios lenguajes y **el 45% de las generaciones falló las comprobaciones de seguridad**, no significa que el 45% de todas las aplicaciones creadas con IA sean vulnerables, significa que, en ese banco de pruebas, conseguir código que es sintácticamente correcto no garantizó evitar fallos conocidos.

Otra [investigación académica sobre _vibe coding_](https://arxiv.org/abs/2512.03262) evaluó agentes en 200 tareas seleccionadas precisamente por su relación con vulnerabilidades, una de las configuraccinoes consiguió un 61% de soluciones funcionalmente correctas, pero solo un 10,5% seguras, **es una prueba de estrés con tareas de riesgo, no una estimación de la tasa de vulnerabilidades de todas las apps del mundo**, y precisamente por eso es interesante: cuando la seguridad importa, que el test funcional pase no es suficiente.

Además, un [estudio de 2026 sobre aplicaciones reales creadas vibecodeando](https://arxiv.org/abs/2606.23130) identificó patrones recurrentes de problemas como secrets expuestos, validación insuficiente y lógica provisional que llegaba a aplicaciones desplegadas, otra vez, esto tampoco demuestra que todo software generado sea inseguro, pero sí que estos defectos no son solo una imaginación colectiva.

Los fallos de autorización, la exposición de secrets, las insuficientes validaciones de inputs y las malas decisiones sobre permisos no aparecen mágicamente resueltos porque hayas añadido al prompt "sigue los mandamientos de OWASP".

### 2. Hay aplicaciones reales dejando datos reales a la vista

En mayo de 2026, [WIRED publicó una investigación](https://www.wired.com/story/thousands-of-vibe-coded-apps-expose-corporate-and-personal-data-on-the-open-web/) sobre apps construidas con vibecoding, los investigadores de RedAccess identificaron **más de 5.000 aplicaciones de su muestra con controles de acceso prácticamente inexistentes**; cerca de 2.000 parecían exponer información privada, WIRED verificó por su cuenta varios de los casos.

Hablamos de información corporativa, datos de clientes y conversaciones con ellos, no de que un botón esté unos píxeles desalineado.

Esos estudios no nos permiten decir que el 40% de _todas_ las aplicaciones de vibe coding filtren datos, ni demuestra que cada fallo lo introdujera directamente un modelo, pero sí demuestra que eliminar la barrera de publicación sin añadir una barrera equivalente de verificación puede tener consecuencias para terceros.

Lo que para ti era una demo puede ser la filtración de datos de una persona que ni siquiera sabía que estabas practicando.

### 3. Un agente puede tocar la base de datos y más cositas

En julio de 2025, durante un experimento de Jason Lemkin con Replit, un agente eliminó una base de datos utilizada en el proyecto a pesar de que le habían indicado detener los cambios, el incidente, [reconocido y explicado públicamente por la dirección de Replit](https://www.fastcompany.com/91372483/replit-ceo-what-really-happened-when-ai-agent-wiped-jason-lemkins-database-exclusive), afectó a registros de más de mil contactos empresariales, no fue un caso demostrado de miles de clientes de pago perdiendo sus datos; fue un experimento muy visible que mostró por qué los permisos, las copias de seguridad y el aislamiento importan.

Un agente con herramientas no es una persona que teclea, puede ejecutar comandos, consultar bases de datos, modificar ficheros, encadenar acciones sin que estés aprobando cada paso y escalar todo eso, si le das credenciales de producción y permisos para destruirla, el problema no se arregla metiendo un agente más para vigilar al primero.

![limites-para-el-agente](https://i.8upload.com/image/59dae13768012fb5/03-limites-para-el-agente.png)

Por añadir otro matiz, [Lovable reconoció en abril de 2026](https://lovable.dev/blog/our-response-to-the-april-2026-incident) un fallo de **su propia plataforma** que volvió a hacer accesibles historiales de chat y código de determinados proyectos públicos a otros usuarios autenticados, no fue necesariamente una vulnerabilidad escrita por un vibecoder: fue una regresión en la plataforma. Lo menciono porque incluso las herramientas que nos venden la experiencia de "crear software sin complicaciones" necesitan la misma ingeniería, revisión y respuesta a incidentes que cualquier otro producto del mercado.

## Y si el modelo cambia, también cambia tu equipo de ingeniería

Otra mala idea que veo mucho es que podemos fiarle en su totalidad el código a un modelo porque ayer resolvió nuestros prompts correctamente y lo comprobamos, pero, los modelos y los servicios que los sirven cambian. En [_How Is ChatGPT’s Behavior Changing over Time?_](https://hdsr.mitpress.mit.edu/pub/y95zitmz/release/2), publicado en _Harvard Data Science Review_ en 2024, Chen, Zaharia y Zou compararon versiones de GPT-3.5 y GPT-4 de marzo y junio de 2023, encontraron cambios importantes de comportamiento: mejoras en unas tareas, empeoramientos en otras y diferencias en el seguimiento de instrucciones.

A eso se suele llamar _LLM drift_. **No significa que todos los modelos sean cada día peores**, simplemente significa que no deberías asumir que un servicio probabilístico conservará para siempre el mismo comportamiento solo porque su nombre comercial sea el mismo.

Y tampoco es una teoría conspirativa que los LLM puedan inventar respuestas, [OpenAI explicó en 2025](https://openai.com/index/why-language-models-hallucinate/) que ciertos métodos habituales de evaluación recompensan adivinar en lugar de reconocer incertidumbre, esto lo expliqué en otro [post](http://localhost:4321/posts/la-ia-bajo-el-capo/).

Si dependes de modelos para ahcer cambios continuamente, necesitas mantener versiones a medida de lo posible, probar regresiones, evaluar resultados y mantener las mismas garantías de producto, no es suficiente con que el agente diga "he revisado todo y está perfecto" porque su "comprensión" de perfecto puede ser diferente.

En la [encuesta de Stack Overflow de 2026](https://survey.stackoverflow.co/2026/ai/data/ai-trust), el 48% de los encuestados dijo confiar en la IA cuando podía verificar fácilmente su resultado, y solo un 6,6% confiaba en ella también para decisiones importantes de trabajo, creo que es una forma sensata de utilizarla.

## MCP, RAG, skills, harnesses y otras palabras para justificar el vibecoding

Aquí es donde LinkedIn se convierte en un circo de publicaciones diario.

Abres cualquier publicación y descubres que para crear un formulario necesitas un _multi-agent orchestration harness_, 27 _skills_, memoria persistente, un servidor MCP, un agente crítico, otro agente que revise al crítico y una arquitectura de recuperación aumentada por generación, todo esto para que un usuario introduzca su nombre y pulse "Enviar".

Vamos a aclarar algunas palabras, porque **no son inventos inútiles**. Lo que es una mierda es venderlas como sustituto de saber desarrollar:

- **LLM:** un modelo de lenguaje; no es, por sí solo, una aplicación completa ni un empleado con obligaciones profesionales.
- **Agente:** un sistema que utiliza un modelo para seleccionar acciones, apoyarse en herramientas, observar resultados y continuar hasta cumplir un objetivo o alcanzar un punto límite, según el diseño, puede tener varios estados, memoria, planificación, políticas y supervisión, no es simplemente "ChatGPT, pero con otro nombre".
- **RAG (_Retrieval-Augmented Generation_):** recuperar información de fuentes externas para aportarla al modelo como contexto.
- **MCP (_Model Context Protocol_):** un protocolo para conectar aplicaciones de IA con herramientas y fuentes de datos, piensalo como el "bus" que puede usar el agente.
- **Skills:** instrucciones, recursos y procedimientos reutilizables para tareas específicas, es simplemente texto en lenguaje natural, generalmente en ficheros .md
- **Harness:** la infraestructura que rodea al modelo para gestionar ejecución, contexto, herramientas, límites, pruebas y seguimiento.
- **Evals:** evaluaciones para medir comportamiento y calidad, son valiosas cuando miden riesgos reales.

Hay situaciones donde todo esto tiene sentido, si tienes un problema que exige búsquedas documentales, integraciones o automatización supervisada, adelante, claro que sí, mi problema es que se haya convertido en la respuesta predeterminada a cualquier cosa que antes resolvíamos con una función, un test y un poco de sentido común.

![harness-para-un-formulari](https://i.8upload.com/image/ee387c699317591d/04-harness-para-un-formulario.png)

Igual que en [mi artículo de regresión lineal en Go](https://iadev.blog/posts/regresion-lineal-go-o-harness-de-agentes/), a veces una solución de veinte líneas sigue siendo mejor que quemar miles de tokens construyendo el montón de agentes que finalmente la ejecutará.

## «AI Engineer» porque he visto dos tutoriales y conecté Claude a Snyk

También está el espectacular mercado de los títulos profesionales.

Ahora te encuentras perfiles de _AI Engineer_, _Agentic Systems Architect_ o _Multi-Agent Automation Expert_ cuyo historial técnico consiste en haber visto dos tutoriales, conectado un MCP y montado una automatización que envía correos (no todos, algunos son devs de verdad que supongo para ser contratados por aquellos que desconocen realmente cómo se desarrolla y están hypeados por la IA, buscan ese tipo de "perfiles").

Que quede claro: **la ingeniería de IA existe**, hay profesionales que diseñan, entrenan, evalúan, despliegan y operan sistemas de aprendizaje automático y productos basados en modelos, no estoy diciendo que el cargo sea inventado por definición, ni que solo pueda dedicarse a la ingeniería quien tenga un titulo universitario, hay autodidactas extraordinarios y también titulados que no deberían tener acceso ni al `README` de un proyecto, lo he visto.

Lo que critico es utilizar la palabra _ingeniero_ como si significara "sé dónde se pone la API key"

Yo estudié ingeniería informática, y lo valioso de esa formación no fue aprender una sintaxis para obtener un empleo mecanografiando, fue enfrentarme a matemáticas, algoritmos, estructuras de datos, lógica, sistemas, abstracción y problemas que no se solucionaban sin un conocimiento genuino de lo que estabas haciendo.

Las matemáticas, por ejemplo, no son una competición de quién multiplica más rápido, son una forma de razonar: formalizar un problema, identificar restricciones, dividirlo en problemas más pequeños, formular hipótesis, comprobarlas e iterar. Esa manera de pensar sirve cuando diseñas un algoritmo, una arquitectura, una base de datos o cuando intentas localizar un error que lleva tres semanas oculto, si eres un ingeniero en cualquier disciplina esto te sonará, no eres matemático pero día a día solucionas todos los problemas así, en el trabajo y en la vida diaria también.

Programar es una actividad profundamente creativa, necesitas imaginar un sistema que todavía no existe, decidir qué partes tendrá, anticipar cómo interactuarán y aceptar que algunas de tus hipótesis van a estar mal también.

Si delegas todo eso y tu única tarea es aceptar cambios y revisar errores, **no has aumentado tu criterio, has externalizado la parte que te permitía desarrollarlo**.

> La ingeniería es lo que haces con los resultados, no la foto del diagrama que publicaste en Linkedin.

## La IA nos quitará el trabajo?

Tampoco comparto la opinión de de que mañana desapareceremos todos los desarrolladores porque una IA ya sabe crear un Minecraft con un solo prompt.

No me siento amenazado profesionalmente por la IA, mi apuesta personal es que las tareas que consisten únicamente en traducir instrucciones evidentes a código perderán valor, en cambio, entender sistemas, hablar con personas, formular requisitos, diseñar soluciones, **asumir responsabilidad** y mantener productos seguirá siendo necesario.

La [Oficina de Estadísticas Laborales de EE. UU.](https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm) proyecta para **2025-2035 un crecimiento aproximado del 10% en el empleo de desarrolladores de software**.

Un [estudio de Stanford publicado en 2026](https://digitaleconomy.stanford.edu/publication/canaries-in-the-coal-mine-six-facts-about-the-recent-employment-effects-of-artificial-intelligence/) encontró algo que preocupa más, personas entre 22 y 25 años que trabajan en sectores donde la IA está entrando con fuerza lo están teniendo bastante más jodido para encontrar trabajo.

De hecho, su empleo estaba un **19% por debajo del de otras personas dentro del mismo rango de edad, en sectores menos afectados por la IA**, y lo curioso es que entre los trabajadores con más experiencia no se veía esa misma diferencia. Es decir, no estamos viendo que las empresas estén despidiendo a todos sus programadores para sustituirlos por Claude, lo que parece estar pasando es que **cada vez contratan a menos juniors**.

Y aquí tenemos un problema bastante importante:

**De dónde van a salir los próximos seniors si dejamos de contratar juniors?**

Un senior no se va a medir ahora por la cantidad de tokens gastados en toda su trayectoria, seguirá necesitando años tomando decisiones, equivocándose, depurando, manteniendo código ajeno (o de IA) y aprendiendo por qué una solución que parecía espectacular en su cabeza terminó siendo una estupidez.

Si automatizamos las tareas de entrada y cerramos esos puestos, tendremos que inventar nuevas maneras de formar a quienes después deberán supervisar esos sistemas, mentoría, revisiones de arquitectura, trabajo real de complejidad progresiva y aprendizaje técnico, ya veremos que pasa.

## Y mientras tanto, el mercado vende velocidad como si fuera calidad

Ahora también nos dicen que el _pull request_ está muriendo, que el cuello de botella ya no es escribir, sino revisar. En parte, tienen razón, si puedes generar cambios a una velocidad inhumana, la revisión ya no la puede hacer un humano.

Pero cambiar la PR por un dashboard donde otro modelo otorga una puntuación no soluciona por sí solo el problema, una PR, cuando se utiliza bien, no es solo un visor de diferencias en el código, es una conversación, una justificación del cambio, un registro de decisiones, comprobaciones y **responsabilidades**. Tiene limitaciones, y los sistemas de revisión deben evolucionar, pero el 92/100 de un agente no explica a un auditor quién autorizó una decisión que afecta los datos de los clientes que pagan las facturas de la empresa y tu sueldo.

## El cliente final del software

A tu cliente o a quién use el software no le importa si has utilizado Go, Rust, Java, un agente de Claude o si has escrito cada línea con una pluma de ganso porque quisiste hacer todo el proceso de forma artesanal, quiere que su producto funcione, que resuelva su problema y que no le cueste mantenerlo.

Hasta ahí estamos de acuerdo.

**Pero que al usuario final no le importe cómo has hecho el software no significa que no vaya a sufrir las consecuencias de cómo lo has hecho.**

Al usuario tampoco le importa cómo has diseñado las transacciones de tu base de datos, hasta que pierde una compra porque dos operaciones concurrentes han dejado los datos inconsistentes, tampoco le importa cómo has implementado la autenticación, hasta que descubre que otro usuario puede acceder a sus datos porque el mismo pudo acceder a los de otro, ni cómo has estructurado las dependencias, hasta que una actualización aparentemente insignificante rompe media aplicación el finde y debe esperar al lunes para que la consultora haga algo urgentemente.

Y entonces resulta que todas esas decisiones de ingeniería que supuestamente no importaban empiezan a importar muchísimo.

El problema de pensar que los programadores, solo escribimos código es que demuestra una visión bastante pobre de lo que significa desarrollar software, y estos comentarios a veces vienen de otros devs, **si después de años desarrollando software has llegado a la conclusión de que eras simplemente un mono escribiendo código, igual el problema no era la profesión**.

Programar nunca ha sido simplemente escribir código, cuanto más complejo es el problema, menos importante suele ser la velocidad a la que escribes las líneas, lo difícil es entender qué necesitas construir, cómo dividirlo, qué decisiones tomar, qué consecuencias tendrán en el futuro y cómo conseguir que otra persona pueda mantenerlo sin que tu estés.

## El desarrollador que quiero ser no es un corrector de prompts

No me interesa elegir entre los dos extremos que veo: el programador que se niega a utilizar IA por orgullo y el vibecoder que no entiende nada pero ha desplegado cuatro SaaS en un mes.

Tampoco creo que debamos romantizar escribir cada línea a mano, igual que tampoco creo que un carpintero sea peor profesional por utilizar herramientas eléctricas en lugar de cortar toda la madera con una sierra manual.

**La herramienta acelera la ejecución, pero la calidad del resultado sigue dependiendo de las decisiones que se toman durante el proceso.**

A mi me gusta seguir pensando, quiero diseñar, discutir alternativas, equivocarme y corregirlas, quiero utilizar la IA para investigar una biblioteca que desconozco, para implementar algo que ya he definido, para generar tests útiles, para localizar fallos y después de implementar una funcionalidad grande, descubro que existía una solución mejor, ahora puedo cambiarla sin pasarme una semana reescribiendo código a mano, **eso sí me parece una revolución.**

No porque la IA haya tenido una idea por mí, sino porque puedo llevar mucho más lejos mis propias ideas, con la IA hay quien cree que ya no necesita aprender nada y también está el que descubre que ahora puede aprender muchísimo más.

Así que construye tu web, tu automatización, tu prototipo, tu aplicación personal, aprende, experimenta, utiliza la IA para todo lo que te aporte valor, si luego quieres convertirlo en un producto real, maravilloso: **ahí empieza el trabajo serio**.

Porque al final, cuando todo falla de madrugada, cuando se filtran datos, cuando el sistema no escala o cuando una actualización rompe algo, nadie quiere al que va con _vibras_ para que resuelva.
