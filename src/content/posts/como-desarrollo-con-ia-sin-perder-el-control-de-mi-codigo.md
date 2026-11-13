---
title: "Cómo desarrollo con IA sin perder el control de mi propio código"
description: "Así utilizo IA para desarrollar, instrucciones, skills propias, memoria persistente, arquitectura, pruebas y herramientas visuales para saber qué estoy construyendo, sin tener que revisar PR con cambios inhumanos."
published_at: 2026-11-13
author: prinick96
categories:
  - engineering
  - ia-resources
---

Actualmente estoy desarrollando un side project bastante grande y complejo y el backend lo estoy escribiendo en Go, para ello utilizo IA durante buena parte del proceso, le pido que cree código, implemente interfaces, prepare pruebas, investigue problemas y cuando hace falta, que me construya herramientas para poder entender mejor lo que estamos haciendo.

Y sí, lo sé, después de varios posts criticando a los que vibecodean, esto puede parecer el comienzo de mi conversión en _Autonomous Senior AI Agent Orchestrator_.

Pero hay un detalle importante: **sigo siendo yo quien decide qué quiero construir y cómo quiero construirlo**. La IA me ayuda a llevar esas decisiones al código, a investigar alternativas y a detectar problemas, pero no le digo "hazme un backend" para volver dos horas después a comprobar si ha montado una buena arquitectura o una secta.

En este post voy a enseñar un poco cómo trabajo, qué herramientas uso, cómo mantengo el contexto entre conversaciones y varios pc que uso a diario, cómo organizo el proyecto y qué hago para poder seguir entendiendo un sistema en el que la IA también escribe código.

No es una fórmula mágica ni un benchmark donde voy a demostrar que soy un 427 % más productivo, esas declaraciones siempre son puro humo y esconden muchos problemas detrás, simplemente es mi forma de trabajar y como veremos, también tiene problemas que hay que aprender a gestionar.

> Actualmente estamos en pleno auge, por más que veas "gurús" en Internet diciendo que tienen la metodología correcta para trabajar con la IA, eso no existe, la IA está evolucionando, nuestra profesión también, y demasiado rápido, aún no hemos llegado al punto en donde podamos establecer un estándar claro que no cambie cada semana, todo lo que leerás aquí es lo que yo OPINO y he podido medir conmigo y con mi forma de trabajar, somos personas totalmente distintas y lo que me funciona a mi y busco yo, puede que no te funcione a ti, pero quizá te sirve para comenzar tu propio flujo.

## Primero: yo sigo programando

Cuando digo que desarrollo con IA, no quiero decir que le entregue el proyecto entero y espero a que tome todas las decisiones por mí.

Mi forma de trabajar se parece más a esto:

> Necesito un caso de uso para realizar esta operación, crea una interfaz para la dependencia que necesita, implementa el adaptador y utiliza inyección de dependencias para conectarlo, después prepara los tests que comprueben estos comportamientos.

A veces la instrucción es todavía más concreta: crear una clase, mover una responsabilidad a una interfaz, reorganizar una carpeta o corregir una solución que no me convence.

Otras veces le pido que investigue qué ofrece una librería antes de decidir qué construir, que me explique una alternativa o que revise un error, pero investigar una opción no significa que la opción queda automáticamente aprobada.

Yo decido qué quiero conseguir, voy revisando lo que propone y ajusto el resultado, si algo no me gusta, le digo que lo cambie y si aparece una solución mejor, la discutimos como si la IA fuera otro programador, si una implementación funciona pero deja una dependencia absurda o una complejidad innecesaria, no tengo por qué quedármela solo porque la IA haya quemado muchos tokens escribiéndola.

Y sí, la IA también puede aportar ideas útiles que yo no había considerado, precisamente por eso me interesa utilizarla, lo que no hago es confundir una propuesta con una decisión tomada.

**Utilizar la IA no me ha quitado la necesidad de saber desarrollar, me permite dedicar menos tiempo a escribir ciertas partes y más a decidir qué partes merece la pena escribir.**

## A veces le digo incluso cómo escribirlo

Por ejemplo, no le pido simplemente "implementa una función para guardar una cuenta", le puedo indicar que cree un caso de uso concreto, que reciba una interfaz por constructor, que llame a un método determinado y que el adaptador de Postgre/Mongo sea el responsable de la consulta, también le puedo indicar qué no quiero que haga y cómo deben propagarse los errores.

Algo así:

> Crea `RegistrarCuenta` en la capa de aplicación, debe recibir por constructor un repositorio con un método `Guardar`, el caso de uso llama a ese método con el contexto recibido y devuelve el error al consumidor, luego implementa el repositorio de PostgreSQL en infraestructura, conecta ambas dependencias al arrancar y añade pruebas para el comportamiento del caso de uso, no crees interfaces o validaciones adicionales sin una responsabilidad concreta.

El prompt lo puedo hacer todavía más detallado, nombres, orden de llamadas, responsabilidad de cada método o forma de organizar los archivos, tengo una skill donde en cada regla hay un ID como #0001 y le puedo decir específicamente aplica #0001, y si te parece que es escribir mucho, pues no, un atajo ⌘ + Q y activo el dictado, yo directamente le hablo y todo fluye más rápido.

## Y otras veces directamente lo hago yo, por qué no?

En la fase de revisión yo no me limito a decirle al agente "esto está mal, arréglalo" y quedarme mirando cómo gira una animación de carga, muchas veces borro lo que no me gusta y escribo directamente la solución porque a veces es más rápido que pedirselo y esperar que lo haga.

Si la unidad es pequeña y tengo clara la idea, puede ser más rápido escribir una clase o una función que intentar explicarle durante cinco mensajes por qué la implementación anterior no era lo que yo quería, y no, no tengo una medición universal que demuestre que editar a mano sea siempre más rápido, simplemente es una decisión que tomo según el cambio y el momento.

Otras veces sí le pido que itere, especialmente cuando un cambio afecta a muchos archivos, contratos, implementaciones o pruebas y ahí puedo definir la dirección y dejar que el agente recorra los consumidores, siempre revisando después qué ha tocado.

De hecho me gusta mucho Zed para esto, porque justamente hay una función que tiene el asistente donde te va mostrando en tiempo real qué archivo va viendo y escribiendo y allí puedes a veces atajar algún problema y redireccionarlo incluso antes de ver todo el diff.

![zed-follow-agent](https://img.iadev.blog/posts/Screenshot%20at%20Nov%2012%2016-37-03.png)

### Un ejemplo: escribir la idea y pedirle que continúe

Imaginemos una operación para consultar una cuenta, le pido a la IA una implementación y me entrega esto:

```go
func (uc *ObtenerCuenta) Execute(ctx context.Context, id string) (Cuenta, error) {
    cuenta, err := uc.repositorio.Buscar(ctx, id)
    if err != nil {
        return Cuenta{}, errors.New("no se pudo obtener la cuenta")
    }
    return cuenta, nil
}
```

La implementación devuelve un error genérico y pierde la causa original y yo necesito distinguir entre cuenta inexistente y un fallo técnico de PostgreSQL.

Si tengo clara la dirección, puedo reescribir yo el caso de uso para conservar los errores que llegan desde el repositorio:

```go
func (uc *ObtenerCuenta) Execute(ctx context.Context, id string) (Cuenta, error) {
    cuenta, err := uc.repositorio.Buscar(ctx, id)
    if err != nil {
        return Cuenta{}, err
    }

    return cuenta, nil
}
```

Esto no resuelve por sí solo toda la gestión de errores, es un ejemplo simple, el repositorio todavía tiene que producir errores adecuados y la capa HTTP debe convertirlos en respuestas coherentes, si el error contiene información sensible, el controlador no debería enviarlo tal cual al cliente (pero esto es algo que precisamente yo se, porque soy yo el que ha diseñado la solución).

Una vez escrita mi idea, le digo al agente:

> Modifiqué `ObtenerCuenta` para conservar el error que devuelve el repositorio. parte de esta implementación y revisa el contrato y sus consumidores, adapta el controlador para distinguir la ausencia de cuenta de un fallo técnico y actualiza los tests necesarios, no cambies el comportamiento de otras operaciones y antes de terminar, dime qué has modificado y qué has podido comprobar.

La diferencia es que le estoy dando **código concreto que expresa mi intención** y ya no necesito esperar que invente otra solución desde cero y que con suerte adivine lo que yo tenía en la cabeza.

Y claro escribir yo la función tampoco garantiza que sea correcta, hay que revisar los efectos y probarla, pero a veces escribir las líneas tu mismo es la forma más directa de explicar una idea a otro programador no? (tienes que ver a la IA como otro dev más) es como la frase de una imagen vale más que mil palabras.

### Renombrar un símbolo no necesita una conversación

Otro ejemplo más sencillo, la IA crea una variable o un método con un nombre que no me gusta y quiero cambiarlo, no necesito escribir un prompt para pedir que busque todas las referencias y reescriba los archivos, puede parecer estúpido o algo obvio pero es que he visto que hay devs que hacen eso, la flojera les gana y eso es lo que día a día los hará cada vez más mediocres.

Simplemente pongo el cursor sobre el símbolo en Zed, utilizo **Rename Symbol**, escribo el nombre nuevo y reviso los cambios que hace el editor, por que sí, estas cosas existían desde antes de la IA, se acuerdan de los snippets? de Emmet? no necesitamos IA para "escribir rápido".

Así que mi flujo mezcla continuamente tres cosas, **decidir y escribir yo, usar las herramientas del editor y delegar en la IA cuando aporta valor**, yo no necesito escribir un prompt si mi IDE ya resuelve la tarea en milisegundos.

## Un proyecto desde cero, pero no desde el caos

Para enseñar el flujo, esto es una pincelada sobre la arquitectura que tengo con Go, tenemos una API, PostgreSQL y varias funcionalidades de lógica de negocio, a medida que avanzamos, aparecen más casos de uso, más reglas, nuevos adaptadores, migraciones y tests.

La estructura que suelo seguir se parece a esta:

```text
backend/
├── core/
│   └── cuentas/
│       ├── domain/
│       │   ├── dependencies/
│       │   └── rules/
│       ├── application/
│       │   └── tests/
│       └── infra/
│           ├── in/
│           └── out/
├── platform/
│   ├── rest/
│   └── configuracion/
├── bootstrap/
├── database/
│   └── migrations/
├── docs/
└── scripts/
```

Los nombres de la funcionalidad son un ejemplo, la idea es organizar el núcleo por responsabilidad de negocio y mantener separados el dominio, los casos de uso y los detalles técnicos que necesitan para funcionar.

- **`domain/`** contiene los conceptos y reglas de negocio, junto con funciones puras pequeñas para dependencias cuando hacen falta.
- **`application/`** contiene los casos de uso que coordinan una operación, iniciar_sesion.go, registrar_usuario.go etc
- **`infra/in/` e `infra/out/`** contienen adaptadores de entrada y salida propios de una funcionalidad, conectan a Postgre, apis, etc
- **`platform/rest/`** concentra el transporte HTTP, rutas, controladores, requests, responses, etc
- **`bootstrap/`** se ocupa del arranque y de conectar las piezas de la aplicación.
- **`database/migrations/`** conserva las migraciones de la base de datos
- **`docs/` y `scripts/`** reúnen documentación y herramientas de desarrollo y verificación.

Esto no significa que cada funcionalidad deba tener todas esas carpetas obligatoriamente, si no necesita un adaptador, no lo creo para que el árbol quede simétrico.

### Una interfaz porque existe una necesidad

Supongamos que tengo un caso de uso que necesita guardar una cuenta, no quiero que la decisión de negocio dependa directamente del cliente de PostgreSQL, así que le puedo pedir a la IA algo como:

> Crea el caso de uso para registrar una cuenta, debe depender de una interfaz pequeña para persistirla, implementa el adaptador de PostgreSQL aparte y conecta ambas piezas en la composición de la aplicación haciendo inversión de dependencias.

La idea, simplificada, sería algo así:

```go
type IRepositorioCuentas interface {
    Guardar(ctx context.Context, cuenta Cuenta) error
}

type RegistrarCuenta struct {
    repositorio IRepositorioCuentas
}

func (uc *RegistrarCuenta) Execute(ctx context.Context, cuenta Cuenta) error {
    return uc.repositorio.Guardar(ctx, cuenta)
}
```

El caso de uso conoce el contrato que necesita, el adaptador sabe hablar con PostgreSQL, después, al arrancar, conecto una cosa con la otra y si quiero probar el caso de uso sin una base de datos real, puedo pedirle que me escriba un mock que cumpla con esa interfaz.

## El problema de repetirle a la IA cómo quieres trabajar

Cuando empiezas a trabajar así te encuentras de que en cada conversación acabas repitiendo las mismas cosas como "los casos de uso van aquí", "a lógica de negocio no va en el controlador", "no me añadas un wrapper si la librería ya hace eso", "los tests van en su carpeta correspondiente", "no me metas quince validaciones internas para un dato que acabamos de generar nosotros.", "no hagas sobre ingeniería" etc...

Puedes escribir todo eso en cada prompt y también puedes comprar un loro y enseñarle arquitectura hexagonal para que lo repita por ti.

Para eso utilizo instrucciones del proyecto y una **skill local**.

## AGENTS.md, las reglas de mi proyecto

En la raíz del repositorio tengo un `AGENTS.md` o si usas claude sería el `CLAUDE.md` con las reglas que quiero que el asistente tenga presentes al trabajar en el proyecto.

Por ejemplo:

- Cómo separo las responsabilidades.
- Dónde va cada tipo de código.
- Qué convenciones sigo en Go.
- Qué espero de las pruebas.
- Cómo mantener los contratos de la API.
- Qué operaciones requieren una decisión o autorización explícita.
- Qué cosas no debe asumir como terminadas solo porque otra parte ya funcione.

No hace falta que cada persona copie mis reglas, de hecho **NO LO RECOMIENDO**, por eso no te pondré aquí mi skill (no porque crea que es especial, para nada, es solo texto en un .md y ya está, eso no va a cambiar radicalmente el proyecto como te lo venden por internet) y tampoco que uses las skills de otro, porque así, termina ese agente programando como lo quiere otro y no cómo lo haces tú, las skills genéricas que funcionan para N proyectos terminarán generando comportamientos igual de genéricos.

Tener un archivo no garantiza que el asistente siempre lo siga, hay que comprobar que la herramienta lo cargue, revisar el resultado y corregir instrucciones ambiguas o desactualizadas porque el proyecto va evolucionando y con ello también debe ir evolucionando tu skill.

## La skill: dejar de explicar lo mismo en cada conversación

Además de las reglas generales, esta skill es específica para mi backend, y en concreto, para este backend.

Una skill, en este contexto, es un conjunto de instrucciones que el asistente puede consultar para realizar un tipo de trabajo, la mía le dice cómo quiero aplicar la arquitectura, cómo organizar los casos de uso, qué revisar antes de añadir una dependencia y cómo enfocar los tests.

Así, cuando digo "crea este caso de uso y añade la interfaz para su repositorio", no tengo que escribir cada vez un ensayo sobre dónde va la interfaz, dónde va el adaptador y qué dependencias puede tener cada capa, esto puede que sea un poco así cuando vas arrancando el proyecto pero son las primeras iteraciones.

La skill aporta esas convenciones, yo sigo proporcionando la tarea, el comportamiento y las decisiones concretas.

Y esto es importante, **la skill no contiene mi cerebro metido en un Markdown**, si le pido algo ambiguo, si la regla está mal escrita o si la IA la interpreta mal, puedo obtener una solución incorrecta con una estructura de carpetas impecable, pasa con más frecuencia de lo que creemos.

También intento que las instrucciones no se conviertan en un libro que el asistente tenga que leer entero cada vez que cambio un `if`, hay una entrada más breve y referencias por tema para consultar el detalle cuando corresponde así optimizo un poco el gasto de tokens y recibo respuestas antes.

## Projectmem, para cambiar de ordenador sin empezar de cero

Otra herramienta que utilizo es **Projectmem**, es una memoria del proyecto a la que el asistente puede acudir para recuperar decisiones, incidencias, intentos, soluciones y contexto relevante, digamos que es como una [LLM Wiki](posts/llm-wiki-en-vez-de-rag/)

Esto me viene especialmente bien porque no siempre trabajo desde el mismo pc, puedo estar desarrollando en el PC de escritorio, hacer un push del trabajo y después continuar desde el MacBook en otro momento.

La idea es que el contexto del proyecto que mantengo en sus archivos viaje con el código, no dependo de abrir siempre la misma conversación ni de que el asistente recuerde por arte de magia todo lo que hicimos la semana pasada, puedo iniciar un chat nuevo y hacer que consulte el contexto que necesita para continuar.

Eso sí, aquí hay un detalle que conviene comprobar en cualquier proyecto, **git solo sincroniza los archivos que realmente están versionados**, en mi configuración actual hay documentación y archivos de memoria que sí viajan en el repositorio, pero el registro completo de eventos `events.jsonl` está ignorado, porque no lo considero relevante para mi forma de trabajar con la IA, por lo tanto, un push y un pull no garantizan por sí solos que toda la memoria de eventos sea idéntica en ambos pc, pero para eso estoy yo.

Si quieres que un mecanismo de memoria funcione entre varios pc, revisa qué archivos necesita, cuáles están en Git y cuáles requieren otro mecanismo de sincronización, y revisa también que no estés subiendo secrets por favor, ni datos personales o información que no quieres compartir con quienes tengan acceso al repositorio porque aunque algun dia los borres recuerda que git tiene un historial.

### Qué quiero conservar en esa memoria

No necesito guardar cada línea de cada conversación como si fuera el log de un keylogger, me interesa conservar información que pueda ser útil después:

- Una decisión de arquitectura y por qué se tomó.
- Un problema encontrado y dónde estaba.
- Un intento que falló, para no repetirlo sin saberlo.
- La solución que se confirmó y con qué comprobación.
- Un detalle de entorno que pueda volver a romper una ejecución.
- Lo que sigue pendiente y las dependencias que no debemos olvidar.
- Una idea que se me ocurrió para implementar futuro, porque aun no tengo las dependencias listas implementadas/programadas y que me recuerde cuando le dije que era el momento de verla/integrarla.

Así, cuando empiezo una conversación nueva, puedo decirle al asistente que consulte la información relevante y continuamos desde ahí.

## Cómo instalar Projectmem y conectarlo a Zed

Si quieres probar esta parte del flujo, puedes instalarte [Projectmem](https://github.com/riponcm/projectmem) y conectar su servidor MCP a Zed, que es el editor que yo uso (se nota en qué está inspirada esta web xd)

### 1. Instalarlo en un entorno de Python

Necesitas Python 3.10 o posterior, para mantener sus dependencias separadas, puedes crear un entorno virtual en tu directorio de usuario:

```sh
python3 -m venv "$HOME/.local/share/projectmem/venv"
"$HOME/.local/share/projectmem/venv/bin/python" -m pip install projectmem
```

El ejecutable `pjm` quedará dentro del directorio `bin` del entorno, comprueba que responde:

```sh
"$HOME/.local/share/projectmem/venv/bin/pjm" --help
```

En Windows puedes crear el entorno con `py -m venv "$HOME\.local\share\projectmem\venv"` desde PowerShell y usar después los ejecutables de `Scripts`, por ejemplo `python.exe` y `pjm.exe`.

### 2. Inicializar la memoria en el proyecto

Desde la raíz del repo en el que quieras comenzar a usar Projectmem:

```sh
cd /ruta/a/tu/proyecto
"$HOME/.local/share/projectmem/venv/bin/pjm" init
```

Según la documentación de Projectmem, `pjm init` crea la estructura `.projectmem/`, registra el proyecto y puede instalar hooks de Git, iniciar un observador y crear o modificar archivos de instrucciones, por eso merece la pena revisar la salida y los cambios que propone en tu repositorio, sobre todo si ya tienes hooks o un flujo configurado.

Si ya tienes memoria en el repositorio y estás preparando otro pc, **comprueba antes el estado de los archivos y la documentación de tu versión**, no asumas que debes volver a inicializarla a ciegas, projectmem permite registrar un proyecto existente con `pjm project register /ruta/absoluta/al/proyecto` y consultar la configuración con `pjm doctor`.

### 3. Configurar el servidor MCP en Zed

Abre la config del proyecto `.zed/settings.json` o la global de Zed y añade `projectmem` dentro de `context_servers`, así es como lo tengo yo:

```json
{
  "context_servers": {
    "projectmem": {
      "command": "/Users/<<<TU_USUARIO>>>/.local/share/projectmem/venv/bin/python",
      "args": [
        "-c",
        "import os, runpy; os.environ.pop('PROJECTMEM_ROOT', None); os.chdir('/'); runpy.run_module('projectmem.mcp_server', run_name='__main__')"
      ]
    }
  }
}
```

Mi configuración elimina una variable de entorno heredada y arranca desde `/` para evitar que el servidor quede ligado involuntariamente a una carpeta concreta, no es imprescindible, la documentación de Projectmem ofrece la alternativa de invocar el módulo con `"args": ["-m", "projectmem.mcp_server"]`.

Zed también permite gestionar servidores desde **Settings → AI → MCP Servers**. La disponibilidad para un agente externo depende de cómo se lance y de si recibe los MCP de Zed o lee su propia configuración. Puedes revisar la [documentación de MCP de Zed](https://zed.dev/docs/ai/mcp).

### 4. Comprobarlo con una conversación nueva

Abre una nueva conversación limpia y dile:

> Estoy usando Projectmem en este repositorio, consulta las instrucciones y recupera el estado de la tarea actual, dime qué decisiones o problemas previos encuentras y qué fuentes consultaste

### 5. Y si trabajo desde dos ordenadores?

Repite la instalación y la configuración del cliente en cada máquina, después, en el primer pc, guarda los cambios que quieras compartir y haz push, en el segundo, haz pull y comprueba que Projectmem puede acceder a la memoria del proyecto y ya está.

## También tuve que poner a dieta al contexto

Al principio parece buena idea guardar todo, cada sesión añade un resumen, cada resumen añade antecedentes, cada antecedente incluye una tabla y cuando te quieres dar cuenta le estás entregando a la IA la trilogía completa del señor de los anillos versión "arquitectura del proyecto" para que consulte algo trivial.

Así que en mi caso, el contexto y algunos mapas crecieron demasiado y tuve que reorganizarlos, por lo que separé mejor las responsabilidades:

- **Contexto.md:** qué comportamiento y arquitectura están vigentes.
- **Mapa.md:** dónde están las cosas y cómo se relacionan.
- **Plan.md:** qué queda pendiente y cómo se divide el trabajo.
- **Orden de ejecución.md:** en qué punto estamos y qué toca después.
- **Memoria.md:** decisiones, incidencias y hechos que pueden recuperarse cuando hagan falta.
- **Históricos.md:** información anterior que se conserva como evidencia, sin cargarla siempre.

La idea es recuperar el contexto pertinente para cada tarea, en vez de meter todos los documentos en cada conversación.

Y no, tampoco tengo una cifra medida para decirte cuántos tokens ahorro con esto, lo que sí he observado es que mantener separado lo vigente de la cronología ayuda a que sea más fácil encontrar lo que necesito y revisar si una decisión sigue aplicando, a tener resultados más rápidos y claramente me gasto en menos tiempo el contexto de cada conversación.

## Codebase Memory: para que el asistente también pueda navegar el código

En Zed tengo configurado otro server de contexto, **Codebase Memory MCP**, lo utilizo como apoyo para indexar y consultar la estructura del código, sus símbolos y las relaciones.

La diferencia con projectmem es que una cosa es saber que se acordó separar una responsabilidad y otra es localizar qué componentes, llamadas o dependencias existen en el código.

Un índice puede ayudar a navegar el proyecto, pero no es una bola de cristal, hay que saber qué se indexó, qué carpetas se quedaron afuera y si el índice representa el estado actual.

## Mi configuración de Zed, MCP y extensiones

```json
{
  "context_servers": {
    "projectmem": {
      "command": "/Users/<<<TU_USUARIO>>>/.local/share/projectmem/venv/bin/python",
      "args": [
        "-c",
        "import os, runpy; os.environ.pop('PROJECTMEM_ROOT', None); os.chdir('/'); runpy.run_module('projectmem.mcp_server', run_name='__main__')"
      ]
    },
    "codebase-memory": {
      "command": "/Users/TU_USUARIO/.local/bin/codebase-memory-mcp",
      "args": []
    }
  },
  "enable_language_server": false,
  "languages": {
    "Go": {
      "enable_language_server": true,
      "language_servers": ["gopls"]
    }
  }
}
```

Lo último es porque para el backend en Go, solamente quiero el server de go para tema de lint y tal, no me interesa que me monte otros como typescript, biome etc.

También personalizo la apariencia con un tema de iconos basado en Modern Icons, esto no hace que la IA programe mejor, pero me ayuda a moverme por el proyecto a simple vista xd

## Planificar una parte, implementarla y revisarla

Cuando la funcionalidad es grande, no intento resolver todo en una petición de cincuenta páginas y después descubrir que el agente decidió que ya estamos listos para desplegar.

Aplico la vieja confiable, la clásica, la de siempre, recuerdas? dividir el problema en problemas más pequeños que tengan sentido, para cada problema intento dejar claro qué quiero conseguir, qué afecta y cómo voy a comprobarlo.

Por ejemplo:

1. Definir qué debe permitir una operación y qué reglas tiene.
2. Preparar el caso de uso y las dependencias necesarias.
3. Implementar la persistencia o el adaptador correspondiente.
4. Exponer el comportamiento por HTTP cuando toque.
5. Ejecutar los test que correspondan y revisar el resultado (y sobre todo definir qué testear).
6. Decidir si acepto el problema como resuelto y cuál es el siguiente paso.

El orden concreto cambia según la funcionalidad, no es una cadena de montaje universal, no es una "_IA Software Factory_"

Pero sí intento mantener separadas algunas cosas que la IA tiende a mezclar mucho:

![implementado-no-significa-aceptado](https://img.iadev.blog/posts/implementado-no-significa-aceptado.png)

Si acepto una implementación sin ejecutar una prueba concreta, quiero que quede claro, mi "vale, continuemos" no transforma mágicamente un test que no se ha ejecutado en un test aprobado, esto lo hago porque tengo tests de muchos tipos y algunos se demoran mucho más que otros.

## Los tests: verde no significa "ya está todo"

Le pido a la IA que prepare tests de los comportamientos que estamos implementando, incluidos errores, límites y regresiones, según lo que toque, utilizo tests del caso de uso, test de integración con PostgreSQL (donde se levanta con infra real en Docker), comprobaciones HTTP y otras verificaciones del proyecto.

Los tests de aplicación pueden utilizar dependencias de prueba para comprobar cómo se comporta el caso de uso sin arrancar toda la infraestructura, los test de integración si me permiten comprobar cosas que un mock no demuestra, como consultas, restricciones, transacciones o comportamiento real de PostgreSQL como condiciones de carrera etc.

No es lo mismo:

- Compilar un paquete que ejecutar sus tests.
- Probar un caso de uso con un mock que probar PostgreSQL.
- Comprobar un controlador aislado que recorrer toda la aplicación arrancada.
- Tener una integración con un proveedor simulada que haber llamado al proveedor real en el entorno de prueba/sandbox.
- Pasar una prueba de hoy que verificar automáticamente cualquier cambio de mañana.

Cada una puede ser útil, el problema empieza cuando el asistente ejecuta la primera y me presenta la última en letras mayúsculas.

Por eso intento que indique qué comandos ha ejecutado, qué resultados ha observado y qué se quedó fuera, si un test falla, me interesa saber que falló y cómo se resolvió, no que desaparezca de la historia porque una repetición posterior terminó en verde.

También utilizo `gofmt`, `go vet` y [golangci-lint](https://golangci-lint.run/) y exigo que cada entrega que modifique código, corra el lint.

## Usar la IA para medir antes de que producción me recuerde que existe la RAM

Hay otra forma en la que utilizo la IA que me parece especialmente útil, preparar **experimentos puntuales mientras estoy desarrollando**, antes de que una decisión técnica quede escondida entre otros veinte módulos y tenga que reencontrarme con ella durante una prueba de estrés.

Por ejemplo, estaba trabajando en un flujo que empezaba con una petición HTTP, esa petición generaba un job que quedaba registrado en la base de datos y después, un worker lo recogía para procesarlo, un outbox de toda la vida.

Hasta ahí todo bien, el problema interesante venía después, que el worker podía procesar varios jobs de forma concurrente y yo tenía que decidir **cómo controlar esa concurrencia**.

Una opción era crear una goroutine por cada job disponible y dejar que Go hiciera su magia, y sí, las goroutines son ligeras, pero "ligeras" no significa "gratis", cada una tiene una pila y según lo que haga, puede mantener referencias a datos, reservar memoria, esperar a la base de datos o competir por otros recursos.

Crear una goroutine por cada job sin saber cuántos pueden acumularse es una estrategia perfectamente válida si tu objetivo es descubrir cuánto tarda el servidor en explotar.

### La pregunta no era solo "cuántas goroutines puedo crear"

Lo que quería entender era algo más concreto:

> Para este flujo, con estos jobs y esta forma de procesarlos, cuánta memoria adicional observo al aumentar la concurrencia? Y con una volumetría estimada, qué límite tiene sentido plantear?

No estaba buscando un número mágico que sirviera para todas las goroutines del mundo, una goroutine que incrementa un contador no tiene por qué consumir lo mismo que otra que mantiene datos en memoria, espera una respuesta de un proveedor o utiliza una conexión de la db.

Así que utilicé la IA para ayudarme a preparar experimentos sobre el flujo que ya tenía implementado, la idea era observar qué ocurría al variar la cantidad de jobs concurrentes y utilizar esos resultados para comparar alternativas.

La IA no decidió por mí cuánto tráfico tendría el producto ni convirtió el pc en una réplica exacta de producción, me ayudó a preparar y analizar una prueba que respondiera a la pregunta que yo tenía.

### Goroutines sin límite frente a concurrencia controlada

La alternativa más directa, MUY simplificada, podría parecerse a esto:

```go
for _, job := range jobs {
    go procesar(job)
}
```

Esto lanza una goroutine por cada job de la colección, puede ser suficiente para una cantidad pequeña y conocida, pero si la cantidad crece sin un límite claro, también crece la cantidad de job que la aplicación intenta mantener en marcha al mismo tiempo.

La alternativa que me interesaba era **limitar cuántos jobs se procesan en paralelo** y dejar que los demás esperen su turno.

![goroutines-ligeras-recursos-finitos](https://img.iadev.blog/posts/goroutines-ligeras-recursos-finitos.png)

Cuando una plaza termina puede agarrar otro job y el número de jobs procesándose simultáneamente queda acotado, aunque haya más pendientes.

En mi caso, esa idea encajaba mejor que lanzar goroutines sin un límite por cada job que apareciera, me permitía relacionar la concurrencia configurada con los recursos disponibles y ajustar el sistema con una idea más clara de lo que estaba intentando hacer.

Eso no resuelve todos los problemas de una cola, también hay que ver errores, cancelaciones, tiempos de espera, jobs bloqueados y qué pasa si el proceso se detiene, etc, etc, pero al menos ya no estoy tratando el número de goroutines como una sorpresa que descubriré cuando el servidor se quede sin memoria en una prueba de estrés.

### De la medición a una estimación

Una vez tienes observaciones de varios niveles de concurrencia, puedes hacer una estimación inicial, por ejemplo:

```text
Memoria observada con poca concurrencia:     A
Memoria observada con más concurrencia:      B
Diferencia observada durante la prueba:      B - A
```

A partir de ahí puedes comparar escenarios y preguntarte qué ocurriría si tuvieras más jobs activos o varias instancias del worker, pero **esa diferencia no es necesariamente el coste exacto de una goroutine**, la memoria medida también puede incluir datos de los jobs, buffers, conexiones, actividad del recolector de basura y otras partes del proceso, además, el consumo no tiene por qué crecer de forma perfectamente lineal.

También hay una diferencia entre hablar de usuarios y hablar de jobs concurrentes, mil usuarios registrados no significan mil jobs ejecutándose a la vez, para estimar el comportamiento necesitas plantear cuántos jobs llegan, cuánto tardan en procesarse y cuántos pueden coincidir.

Por eso el resultado me sirve para orientar una decisión y preparar mejores pruebas, no para prometer que producción consumirá exactamente lo que dijo una multiplicación.

### Por qué hacerlo durante el desarrollo?

Porque este backend va creciendo y yo soy humano, ahora mismo tengo esta parte fresca en la cabeza, sé que existe el worker, sé cómo procesa los jobs y sé que estoy tomando una decisión sobre concurrencia.

Dentro de unos meses habrá muchas más funcionalidades, más procesos y más decisiones parecidas, si entonces ejecuto una prueba de estrés y veo que la memoria se dispara, me tocará investigar qué está pasando y recordar "o descubrir otra vez" que en algún punto dejé que los jobs crearan goroutines sin un límite adecuado.

Hacer este experimento ahora no sustituye las pruebas de carga y estrés más adelante, seguiré necesitándolas con datos, infraestructura y condiciones más cercanas a producción pero me permite **detectar antes una decisión que merece atención** y llegar a esas pruebas con una hipótesis y unos límites iniciales.

Y aquí es donde la IA me resulta especialmente útil porque puedo pedirle ayuda para preparar una prueba focalizada, revisar qué se está midiendo y comparar alternativas sin interrumpir durante días el desarrollo de la funcionalidad.

Yo sigo teniendo que plantear la pregunta, elegir las condiciones, interpretar los resultados y decidir qué patrón utilizar, la IA me ayuda a realizar el experimento y a explorar opciones.

Para mí, esto es una buena forma de aprovecharla, **usar su velocidad para hacer más ingeniería durante el desarrollo**, no solo para producir código más rápido, ya que últimamente parece que NADIE se ha detenido a pensar en esto y todos se enfocan en "la IA hace el código más rápido".

## OpenAPI y Postman: el backend no vive solo

Cuando cambia un contrato de la API, necesito poder ver qué reciben y envían los clientes, por eso mantengo **OpenAPI** y una colección de **Postman** coordinados con el desarrollo y ese mantenimiento está 100% delegado a la IA.

Si modifico un endpoint, no basta con cambiar el controlador, también hay que revisar el contrato, los ejemplos y el impacto que puede tener en quien lo consume. También mantengo un registro de cambios y pendientes para no confundir "el backend ya lo expone" con "el front ya está adaptado y comprobado".

## Diagramas para entender lo que la IA va haciendo

Aquí viene una de las partes que más me gusta ahora, no quiero que la IA solo construya el sistema, también quiero herramientas que me permitan **ver y entender lo que está construyendo**, porque ahora puedo tener super fresco una funcionalidad, pero puede que en unos meses ya no, porque no la toqué más.

Utilizo [Archify](https://github.com/tt-a1i/archify) para generar diagramas de arquitectura y flujos, tengo vistas de las piezas generales y recorridos más concretos: registro, sesiones, correos, pagos, procesos en segundo plano y otras operaciones.

Los diagramas se generan como HTML que puedo abrir localmente, y las fuentes permanecen en JSON, esto me permite recorrer visualmente una funcionalidad y comprobar qué componentes participan y qué ocurre en diferentes situaciones.

Los diagramas no enseñan solo el camino feliz, ese en el que todo responde a tiempo, la base de datos jamás falla y los proveedores externos están siempre disponibles porque les hemos puesto una flechita verde, también quiero poder ver condiciones, errores, límites y qué partes están realmente implementadas.

Vamos, toda la documentación ideal que debería tener un proyecto pero que a todo programador siempre le ha dado extrema pereza hacer o simplemente por la cantidad de tiempo que requeríamos para hacerla, a veces no era tan viable.

Yo sigo haciendo documentación para humanos, si el día de mañana un agente la tiene que leer y gastarse más tokens porque no está "optimizada" para una LLM, me da igual, prefiero que le cueste más al agente que una persona.

### Un diagrama también caduca

Si el código cambia y el diagrama no, empieza a representar una versión anterior del proyecto.

Por eso acumulo los cambios visuales pendientes y pido su generación cuando quiero revisar el conjunto, cada entrega debe dejar claro qué diagramas se actualizaron y cuáles siguen siendo sanpshots anteriores.

El diagrama es una ayuda para entender y revisr pero el código y sus tests siguen ahí para contrastarlo.

## La base de datos: quiero ver las tablas y sus relaciones

Con la base de datos tenía otra necesidad, es relacional y necesito poder ver cómo van quedando las tablas y sus relaciones a medida que añado migraciones.

Vibecodeando hice una herramienta para obtener una representación que pudiera llevar a un visor, la solución pasó por varias iteraciones, hubo una versión más elaborada con generación de diagramas y acceso a PostgreSQL, pero terminé prefiriendo una exportación SQL manual que puedo utilizar cuando la necesito ya que me parecía más ágil.

Ahora tengo un comando:

```sh
make db-diagram
```

El comando genera un archivo SQL a partir de las migraciones, después puedo copiar su contenido en [SQL to ER Diagram](https://sqltoerdiagram.com/), seleccionar PostgreSQL y explorar visualmente las tablas y sus relaciones.

## Agentes en paralelo

En algunas tareas puedo repartir trabajo, un agente implementa una parte, otro revisa, otro prepara o ejecuta comprobaciones y después se integran los resultados.

Eso puede ayudar cuando las tareas están bien delimitadas, también puede crear un pequeño festival de archivos modificados a la vez, resultados incompatibles y agentes convencidos de que el otro ya se encargó de lo que falta.

Por eso intento que haya un responsable de integrar, que las tareas tengan un alcance claro y que cada resultado diga qué ha hecho realmente, en mi memoria del proyecto, por ejemplo, las escrituras las centraliza el agente principal para evitar que varios agentes actualicen el registro simultáneamente.

De hecho Zed lo resuelve bastante bien para mi, no siempre es una regla definida por mi.

## Cómo puedes montar un flujo parecido

Si quieres probar algo similar en tu proyecto, no necesitas copiar toda mi estructura ni instalar cinco herramientas antes de escribir tu primera función, puedes empezar por los problemas que realmente tienes:

1. **Escribe unas instrucciones breves.** Explica cómo organizas el proyecto, qué convenciones son importantes y qué no quieres que el agente haga por su cuenta.
2. **Define una tarea concreta.** Describe el comportamiento y las restricciones, si tienes claro cómo dividir la solución, escribelo.
3. **Extrae convenciones repetidas.** Si constantemente explicas cómo crear un caso de uso o dónde poner los tests, considera meterlo en una skill.
4. **Guarda decisiones útiles.** Utiliza Projectmem o el mecanismo que prefieras, pero mantén claro qué es una decisión vigente, qué es un intento fallido y qué está pendiente.
5. **Comprueba la sincronización.** Si trabajas desde varios equipos, verifica qué se versiona y qué no.
6. **Pide evidencia concreta.** Qué ha cambiado, qué se ha probado, qué falló y qué no se ha comprobado.
7. **Añade visibilidad donde la necesites.** Un contrato, un diagrama o una exportación del esquema pueden ayudarte si realmente responden a preguntas que te haces durante el desarrollo, esto es algo 100% subjetivo.
8. **Revisa también el sistema de trabajo.** Si tus instrucciones, documentos o herramientas empiezan a consumir más esfuerzo del que ahorran, simplifícalos.

No hace falta convertir cada proyecto pequeño en una central nuclear de puros Markdown, o las salvajadas que se pretendían hacer con SDD y recuerda que una función de veinte líneas probablemente necesite un buen test y una revisión, no seis agentes discutiendo cómo nombrar el documento que explicará por qué se escribió la función.

## Entonces, soy más eficiente?

Yo creo que la ventaja está en poder avanzar con mis decisiones sin tener que repetir constantemente las convenciones, reconstruir el contexto desde cero o escribir a mano cada pieza mecánica, también puedo pedir investigaciones, pruebas y herramientas que me ayudan a revisar el sistema mientras crece.

Pero la eficiencia no se mide solo por lo rápido que aparecen archivos nuevos en el proyecto, también cuenta cuánto tardas en entenderlos, corregirlos, probarlos y mantenerlos cuando algo cambia.

Una memoria enorme que nadie mantiene, un diagrama desactualizado o una batería de tests que no sabes qué testea pueden convertir la ayuda en trabajo adicional, y un agente que produce código más rápido de lo que puedes revisar no resuelve tu cuello de botella, simplemente te crea una cola.

### Y qué pasa con esas PR inhumanas?

Yo no tengo ese problema, llevo tiempo criticando que hemos encontrado la forma de escribir código a una velocidad absurda para después quedarnos mirando una PR de 8.000 líneas sin tener ni puta idea de qué hay ahi dentro, eso claramente ya no es programar, es hacer arqueología en tu propio proyecto.

En [otro post](posts/de-prompt-a-ia-engineer-la-evolucion-del-humo/) hablaba precisamente de esto, de cómo estamos automatizando una de las partes que más me gustan del desarrollo para convertirnos en revisores de decisiones que ni siquiera hemos tomado, y es aquí donde creo que todo lo que he explicado en este artículo cobra sentido.

Imagina que al agente le digo: "implementa todo el procesamiento de jobs en segundo plano, con su cola, concurrencia, reintentos y pruebas, avísame cuando termines", dos horas después podría encontrarme un worker, migraciones, interfaces, controladores, una política de reintentos que nadie discutió, goroutines por todas partes y 37 tests en verde, perfecto, ahora me toca descubrir qué decisiones tomó por mí, qué comportamiento tienen esas piezas y si hay algo que no debería existir, y todo eso leyendo un diff gigantesco que veo por primera vez, da igual que se algo hecho dentro de una arquitectura que yo mismo he definido, los cambios por si solo son lo suficientemente grandes, abstractos y complejos.

Con mi forma de trabajar intento evitar precisamente ese momento, antes de que exista el worker ya hemos hablado del flujo, de qué responsabilidad tiene cada parte y de cómo se conecta con el resto del sistema, ha sido decisión mia al final, soy yo el que está construyendo, implementamos pieza a pieza, veo los cambios, compruebo lo que corresponde y decido si continuamos, cuando llegamos a la concurrencia no le digo simplemente "hazlo escalable", planteo el problema, preparo las mediciones y elijo qué alternativa quiero aplicar, si algo no encaja, lo corrijo ahí, no cuando ya hay otras cinco funcionalidades construidas encima.

Esto no significa que esté leyendo cada carácter que escribe el agente mientras aparece en pantalla, ni que una funcionalidad grande vaya a terminar necesariamente en veinte líneas, simplemente significa que **la revisión ocurre DURANTE el desarrollo, no al final.** Los cambios llegan en unidades que puedo entender, sobre todo porque recientemente iteramos y decidimos sobre lo que se iba a hacer, además de que de antemano se cómo debería quedar y los comparo con una intención que ya conozco y puedo detectar pronto cuándo el agente empieza a desviarse, si para modificar un caso de uso termina cambiando media aplicación sin una razón clara, no espero a que termine su obra de arte para preguntarle qué coño está haciendo.

No es lo mismo revisar código que aparece de la nada que revisar código que materializa decisiones en las que has participado.

Esa PR final sigue existiendo si el cambio es muy grande, pero no la tengo que revisar, porque ya he revisado todos sus componentes, es simplemente darle a mergear, si el trabajo es muy grande también una gran mala idea hacer una sola PR para todo, eso siempre ha sido así y siempre lo será, no es algo nuevo con la IA, para un cambio muy grande que requiere meterse todo junto a la rama principal, crea esa PR grande y luego crea PR pequeñas por features que son las que revisas, y usas esa rama de la PR grande como tu rama principal de trabajo, cuando al final tengas 20 30 PR pequeñas mergeadas, tienes un mounstruo igual, pero que cnoces al detalle y fue supervisado con claridad.

> Para mí la productividad no consiste en presumir de cuánto código puede generar un modelo mientras te preparas un café, sino en cuánto trabajo útil puedes terminar, entender y mantener después, si no puedo explicar por qué existe una parte importante del código que acabo de aceptar, entonces no he terminado el trabajo, y claramente sería un profesional reemplazable.

Por eso sigo iterando también sobre el proceso, quito instrucciones que no sirven, aclaro las que generan confusión, reorganizo la documentación y cambio herramientas cuando encuentro una forma más práctica de hacer las cosas, todo esto va evolucionando.

**Yo decido qué construyo, la IA me ayuda a construirlo, investigarlo y comprobarlo, las herramientas me ayudan a no perder de vista lo que está pasando.**

Y cuando algo falla, espero poder entender por qué, en vez de preguntarle a la misma IA que acaba de romperlo si está segura de que funciona.
