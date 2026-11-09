---
title: "El Juego de la Vida: cuatro reglas y un universo que parece estar vivo"
description: "Construimos el Juego de la Vida de Conway desde cero y con ejemplos interactivos, para descubrir cómo reglas simples pueden generar patrones que parecen estar vivos."
published_at: 2026-11-09
author: prinick96
categories:
  - a-life
---

En la serie de [machine learning](https://iadev.blog/categories/machine-learning/) estuvimos construyendo modelos pequeños para entender qué hacen por dentro, empezamos haciendo ajustes en una recta y terminamos con una pequeña red neuronal, ahora me gustaría explorar un concepto igual de interesante: **podemos conseguir algo que parezca estar vivo sin entrenar absolutamente nada?**

Podemos hacer algo _muy parecido_ a cómo funciona la vida, vamos a dibujar una matriz, decidir cuáles están encendidas y dejar que cuatro reglas deterministas hagan su trabajo, con esto veremos que algunas figuras desaparecen, otras se quedan quietas y otras terminarán desplazándose por la pantalla, aunque nosotros no hayamos escrito ninguna instrucción para que lo hagan.

Con esto empezamos una serie sobre evolución en informática, sobre vida artificial y hoy hablaremos de cómo cambia un sistema con el tiempo, no de una especie que se adapta ni de un modelo que aprende, eso lo veremos más adelante.

Lo más fácil y rápido para entender este concepto es desarrollar el **juego de la Vida de John Conway**, presentado por [Martin Gardner en _Scientific American_ en octubre de 1970](https://www.scientificamerican.com/article/mathematical-games-1970-10/).

Lo implementaremos con **TypeScript y Canvas**, porque así podemos trabajar los ejemplos de forma más visual, la verdad pudimos haber hecho lo mismo con los post de ML pero se me acaba de ocurrir esta forma de hacer los posts así que nada, espero que sea más fácil de entender si hacemos el post interactivo.

## Primero, qué es lo que está vivo aquí

Imagina una hoja de un cuaderno de matemáticas, cada cuadrito puede estar en uno de estos dos estados:

```text
0 = muerta
1 = viva
```

Y ya está, por ahora, no hay edad, hambre, energía ni un pequeño cerebro dentro de cada cuadrado.

En los dibujos usaré `O` para una célula viva y `.` para una muerta:

```text
.....
..O..
...O.
.OOO.
.....
```

Cada casilla ocupa una posición fija, lo que cambia es su estado, no su posición, este detalle importa porque después veremos algo que parece moverse, pero ninguna casilla habrá salido de su sitio realmente.

A un sistema de casillas con estados y una regla local de actualización lo llamamos **autómata celular**, el nombre suena bastante más complicado que lo que acabamos de describir ([The Nature of Code: autómatas celulares](https://natureofcode.com/cellular-automata/)).

### El vecino: a quién mira cada célula

Para decidir qué ocurrirá con una célula, miramos las ocho posiciones que la rodean, incluidas las diagonales:

```text
O O O
O X O
O O O
```

La `X` es la posición que estamos evaluando, las otras ocho forman su entorno inmediato y **la célula central no se cuenta a sí misma como vecina**. Esta forma de vecindario se conoce como vecindario de Moore ([Life Lexicon: vecindario de Moore](https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_m.htm)).

No miramos todo el tablero, ni buscamos la célula más cercana, ni calculamos una distancia, simplemente miramos esas posiciones y contamos cuántas están vivas.

## Las cuatro reglas

Podemos escribir las reglas del Juego de la Vida así:

1. Una célula viva con menos de dos vecinas vivas muere.
2. Una célula viva con dos o tres vecinas vivas sobrevive.
3. Una célula viva con más de tres vecinas vivas muere.
4. Una célula muerta con exactamente tres vecinas vivas nace.

Una célula muerta que no cumpla la cuarta regla sigue muerta ([Las reglas originales descritas por Gardner](https://www.ibiblio.org/lifepatterns/october1970.html)).

Lo de morir por soledad o por sobrepoblación ayuda a recordarlas, pero no estamos simulando esas causas biológicas aún, son nombres para unas condiciones numéricas.

Al programarlo podemos resumirlo todavía más:

```text
3 vecinas vivas  -> estará viva, da igual su estado anterior.
2 vecinas vivas  -> conserva su estado anterior.
Cualquier otro  -> muere.
```

Fíjate en el segundo caso, **dos vecinas mantienen una célula viva, pero no hacen nacer una muerta**.

Cada vez que aplicamos las reglas a todo el tablero obtenemos una nueva **generación**, el dibujo inicial será la generación cero.

## Una generación a mano, antes de escribir el bucle

Vamos a hacer el ejercicio a mano para entender cómo funcionará el sistema, para ello empecemos con tres células en una línea horizontal, rodeadas de espacio vacío:

```text
.....
.....
.OOO.
.....
.....
```

La del centro tiene dos vecinas vivas, así que se queda ahi, cada extremo solo tiene una, así que ambos se mueren.

Ahora mira la casilla muerta que está justo encima del 0 del centro, desde ahí se ven las tres células de la fila, dos en diagonal y una debajo, tiene exactamente tres vecinas vivas, así que nace, y abajo del centro pasa lo mismo.

El resultado es este:

```text
.....
..O..
..O..
..O..
.....
```

Si repetimos las cuentas, volvemos a la línea horizontal,

```text
Generación 0    Generación 1    Generación 2

.....           .....           .....
.....           ..O..           .....
.OOO.           ..O..           .OOO.
.....           ..O..           .....
.....           .....           .....
```

Este patrón se llama **blinker** y es un **oscilador de período dos**, es decir, necesita dos generaciones para volver exactamente al mismo estado ([Life Lexicon: blinker](https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_b.htm)).

En ningún momento hemos programado de forma explícita "gira", hemos aplicado las mismas reglas a cada posición y ha ocurrido eso, creo que vas entendiendo cómo va la cosa, todo es fruto de unas reglas + azar, no es algo "scripteado" y esa es la parte que nos interesa.

## El tablero: una matriz

Usaremos 60 columnas y 40 filas, cada casilla ocupará 12 píxeles al dibujarla para que se vea bien el cuadradito en la pantalla:

```typescript
type Cell = 0 | 1;
type Grid = readonly (readonly Cell[])[];

const COLS = 60;
const ROWS = 40;
const SIZE = 12;

function emptyGrid(columns = COLS, rows = ROWS): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, (): Cell => 0),
  );
}
```

Si hacemos `const grid = emptyGrid()` crearemos por defecto 40 filas, cada una con 60 ceros.

Para acceder a una posición específica escribiremos algo como:

```javascript
grid[y][x];
```

Y una pequeña trampa de JavaScript, no es lo mismo que esto:

```javascript
// No lo usaremos: todas las filas compartirían el mismo array.
Array(ROWS).fill(Array(COLS).fill(0));
```

Ahí habríamos repetido la referencia a una misma fila, modificar una casilla terminaría cambiando esa columna en todas las filas y el universo puede ser extraño, pero ese comportamiento sería un bug.

De momento, solo queremos ver la estructura, que son 60 columnas, 40 filas y ninguna célula viva., este primer tablero no se edita ni avanza, todavía no hay nada que simular.

<life-empty-grid>Demo del tablero vacío</life-empty-grid>

## Punto de partida

Antes, otros dos patrones:

- **Block:** es un patrón formado por cuatro células vivas dispuestas en un cuadrado de 2×2.
- **Glinder** es un patrón formado por cinco células vivas que cambia de forma y se desplaza diagonalmente por el tablero, es el más vistoso porque es el que se mueve sin intervención externa, una propiedad es que cada cuatro generaciones recupera su forma original, pero desplazada una casilla hacia abajo y otra hacia la derecha.
- **Blinker** el que ya dimos de ejemplo que itera entre dos estados siempre.

Ahora, podemos describir cada patrón con coordenadas relativas a un origen, un bloque ocupa cuatro posiciones, un blinker tres y un glider cinco, no guardamos instrucciones de movimiento, solo dónde empieza encendida cada célula y ya está:

```typescript
const PATTERNS = {
  block: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  blinker: [
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  glider: [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ],
} as const;

type PatternName = keyof typeof PATTERNS;

function createPattern(name: PatternName, columns = COLS, rows = ROWS): Grid {
  const startX = Math.floor(columns / 2) - 2;
  const startY = Math.floor(rows / 2) - 2;
  const coordinates = PATTERNS[name];

  return emptyGrid(columns, rows).map((row, y) =>
    row.map((_, x): Cell =>
      coordinates.some(
        ([offsetX, offsetY]) =>
          x === startX + offsetX && y === startY + offsetY,
      )
        ? 1
        : 0,
    ),
  );
}
```

`startX` y `startY` sitúan el origen cerca del centro y luego con un `map()` construimos las filas nuevas y con `some()` comprobamos si cada casilla coincide con alguna de las coordenadas del patrón, no modificamos el tablero de entrada ni compartimos filas entre pruebas.

Selecciona **Bloque**, **Blinker** o **Glider** y pulsa **Cargar patrón**, el botón **Vaciar** devuelve todos los valores a cero, aquí todavía no hay evolución, simplemente mostramos que la figura se queda donde la hemos puesto.

<life-pattern-grid>Demo de patrones iniciales</life-pattern-grid>

## Contar vecinos

Vamos a enumerar los ocho desplazamientos vecinos, combinando `-1`, `0` y `1` en ambos ejes, pero sin incluir el centro:

```typescript
const OFFSETS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

function countNeighbors(current: Grid, x: number, y: number): number {
  let count = 0;

  for (const [dx, dy] of OFFSETS) {
    count += current[y + dy]?.[x + dx] ?? 0;
  }

  return count;
}
```

Cuando `dx = -1` significa una columna a la izquierda, `dx = 1`, una a la derecha y con `dy` hacemos lo mismo para las filas, en nuestro dibujo, aumentar `y` significa ir hacia abajo.

`OFFSETS` contiene únicamente las ocho posiciones vecinas, no incluimos `[0, 0]` porque esa posición corresponde a la propia célula y no queremos contarla.

Con `for...of` recorremos las ocho posiciones y consultamos el estado de cada célula vecina, es necesario `?.` para evitar errores cuando una posición está fuera del tablero y `?? 0` para considerar esas posiciones como células muertas.

Como cada posición contiene un `0` (muerta) o un `1` (viva), simplemente sumamos su valor al contador, al terminar el bucle, `count` contiene el número total de vecinas vivas.

No necesitamos comprobar cada célula con un if, sumar ceros y unos es suficiente.

El modelo original se plantea sobre una cuadrícula infinita, pero es más fácil hacerlo sobre una delimitada, así que debemos decidir qué ocurre afuera de la cuadrícula ([La cuadrícula infinita del modelo original](https://www.ibiblio.org/lifepatterns/october1970.html)).

En esta implementación, **toda posición exterior permanece muerta**, con esto realmente modificamos un poco el flujo de la vida dentro de la cuadricula pero también haríamos innecesariamente complejo mostrarte los ejemplos aquí.

Las casillas del borde sí se actualizan, lo que no existe en nuestra simulación son nacimientos fuera de la cuadrícula visible.

También podríamos conectar el lado derecho con el izquierdo y el superior con el inferior, pero sería otra condición de contorno y también terminaríamos cambiando el flujo, **simplemente cuando un patrón alcance el borde puede cambiar o desaparecer, y no debemos confundir ese resultado con lo que haría teniendo espacio ilimitado**

## Todo cambia a la vez

Podríamos recorrer el tablero y modificar cada célula directamente, pero eso estaría mal para estas reglas, terminariamos produciendo un bug.

Si cambio la primera casilla y después cuento las vecinas de la segunda, la segunda ya estaría viendo parte del futuro entonces unas células usarían valores antiguos y otras valores recién actualizados.

**Todas las células deben calcular su siguiente estado a partir de la misma generación anterior.**, esa actualización simultánea forma parte del Juego de la Vida ([Gardner: nacimientos y muertes simultáneos](https://www.ibiblio.org/lifepatterns/october1970.html)).

Para hacer esto simplemente construimos el resultado en otro tablero:

```typescript
function nextGeneration(current: Grid): Grid {
  return current.map((row, y) =>
    row.map((cell, x): Cell => {
      const neighbors = countNeighbors(current, x, y);
      return neighbors === 3 || (cell === 1 && neighbors === 2) ? 1 : 0;
    }),
  );
}
```

Cada `map()` nos devuelve un array nuevo, uno para el tablero y otro para cada fila, calculamos explícitamente un uno o un cero para cada casilla, sin modificar `current`.

La condición dice: estará viva si tiene tres vecinas, o si ya estaba viva y tiene dos.

Leemos siempre de `current` y devolvemos el siguiente tablero completo, más adelante, el controlador (una clase de ts que pondré más abajo) guardará ese resultado como su estado.

No hace falta ejecutar las células en paralelo, podemos calcularlas una detrás de otra, lo importante es que todas consulten la misma fotografía del pasado `(current)`

Y con esto ya tenemos la simulación hecha, los tableros anteriores solo mostraban el estado inicial y ahora podemos calcular cómo cambia.

## Canvas solo dibuja lo que ya hemos calculado

Canvas será solo la superficie del dibujo, obtendremos un contexto 2D y utilizaremos `fillRect(x, y, ancho, alto)` para pintar rectángulos con el color de `fillStyle`

La conversión entre una casilla y su posición en pantalla será esta:

```javascript
ctx.fillRect(x * SIZE, y * SIZE, SIZE - 1, SIZE - 1);
```

Si una célula está en la columna 10 y cada casilla ocupa 12 píxeles, empieza en el píxel 120, restamos uno al ancho y al alto para dejar una separación entre casillas y apreciarlas claramente

Pintamos las vivas con un color distinto del fondo y sumamos los unos para contar la población.

Separar estas cosas ayuda bastante, `nextGeneration()` calcula y el método `render()` del controlador actualiza el dibujo y los contadores.

Ahora sí podemos comprobarlo, este tablero empieza con un blinker y solo avanza cuando pulsas **Un paso**, también puedes cargar otro patrón, vaciarlo o pulsar **Reiniciar** para volver al punto de partida de la prueba.

Para editar, pulsa una casilla con el ratón o el dedo, con el teclado, lleva el foco al tablero, mueve la selección con las **flechas** y pulsa **Espacio** para encender o apagar esa célula, cada edición establece una nueva generación cero.

<life-generations>Demo de generaciones paso a paso.</life-generations>

## Los demos del post

Aquí básicamente explico un poco la integración de esto al navegador, para hacerlo visual (los demos que has visto en el post), no tienen nada que ver con el algoritmo y te lo puedes saltar, pero es básicamente eso, cómo hacer que el algoritmo de la vida se convierta en algo gráfico que se ve en el browse.

Entonces, hasta aquí hemos escrito funciones que reciben un tablero y devuelven otro, pero `nextGeneration()` no sabe si hemos pulsado un botón, ni guarda el resultado para la siguiente vez, alguien tiene que quedarse con ese tablero y decidir cuándo volver a calcularlo.

Esa parte está en `LifeBoardElement.ts`, una clase que conecta el motor con la interfaz, a eso me refiero cuando hablo del **controlador**

Los elementos que has visto en las demos, usan esta clase como base, cada tablero tiene su propia instancia y por tanto sus propios datos, cargar un bloque en uno no cambia el glider que tengas en otro (esto fue necesario para poder hacerlo en este post sin copiar y pegar una y otra vez el código)

Este es el fragmento de la clase que prepara esos datos y permite avanzar una generación, todavía faltan los métodos que conectan los controles y dibujan:

```typescript
class LifeBoardElement extends HTMLElement {
  readonly #templateId: string;
  #grid: Grid;
  #initialGrid: Grid;
  #generation = 0;

  constructor(templateId: string, pattern?: PatternName) {
    super();
    this.#templateId = templateId;
    this.#grid = pattern ? createPattern(pattern) : emptyGrid();
    this.#initialGrid = this.#grid;
  }

  private advance(): void {
    this.#grid = nextGeneration(this.#grid);
    this.#generation += 1;
    this.render();
  }
}
```

Fíjate en `advance()`, ahí no hay reglas nuevas, solo pedimos la siguiente generación, guardamos el resultado y sumamos uno al contador, después llamamos a `render()`, que es el método encargado de recorrer `#grid`, pintar las casillas con `fillRect()` como vimos antes y actualizar el texto de generación y población, porque **dibujar no hace avanzar la simulación**, solo muestra el estado que ya tenemos.

### Que avance solo

Como ya podemos calcular una generación al pulsar un botón, para animarlo necesitamos repetir esa misma llamada a `advance()` cada cierto tiempo.

El navegador nos da `requestAnimationFrame()`, le pasamos una función y la llama antes de un próximo repintado de pantalla, no se repite sola, si queremos continuar tenemos que pedir otra llamada.

Podríamos avanzar en cada call pero entonces la velocidad del universo dependería de la pantalla y alguien con un monitor de 120hz tendría las células más estresadas y lo que queremos controlar son las **generaciones por segundo**, no los repintados.

Para distinguir esas dos cosas, añadimos estos campos a la misma clase:

```typescript
#running = false;
#lastTime = 0;
#frameId: number | null = null;
```

`#running` indica si la animación está en marcha, `#lastTime` guarda el tiempo del último avance y `#frameId` guarda el identificador de la llamada pendiente, lo necesitaremos para cancelarla al pausar.

Al pulsar **Iniciar**, el controlador llama a `start()`:

```typescript
private start(): void {
  if (this.#running || document.hidden) {
    return;
  }
  this.#running = true;
  this.#lastTime = performance.now();
  this.render();
  this.#frameId = requestAnimationFrame((time) => this.tick(time));
}
```

Primero evitamos arrancar dos veces o hacerlo con la pestaña oculta, después guardamos el tiempo actual y pedimos la primera llamada a `tick()`, que será el método que compruebe si ya toca avanzar, aquí `render()` también cambia el texto del botón de **Iniciar** a **Pausar**, todavía no ha cambiado ninguna célula.

El control deslizante de velocidad está en la plantilla y lo buscamos dentro de este tablero con `[data-speed]`, su valor indica las generaciones por segundo que queremos mostrar:

```typescript
private tick(time: number): void {
  if (!this.#running) {
    return;
  }
  const speed = this.shadowRoot?.querySelector<HTMLInputElement>("[data-speed]");
  const interval = 1000 / Number(speed?.value ?? 6);
  if (time - this.#lastTime >= interval) {
    this.advance();
    this.#lastTime = time;
  }
  this.#frameId = requestAnimationFrame((nextTime) => this.tick(nextTime));
}
```

Dividimos los mil ms de un segundo entre la velocidad elegida, con cinco generaciones por segundo necesitamos dejar al menos 200ms entre pasos, si todavía no ha pasado ese tiempo, no calculamos nada, simplemente pedimos otra llamada y comprobamos de nuevo.

Si ya ha pasado, ejecutamos `advance()` una vez y guardamos el tiempo, es un control sencillo, no un reloj de precisión, no intentamos recuperar de golpe todos los pasos pendientes si el navegador se retrasa.

Para salir de ese ciclo usamos el `pause()` que habíamos dejado pendiente:

```typescript
private pause(): void {
  this.#running = false;
  if (this.#frameId !== null) {
    cancelAnimationFrame(this.#frameId);
    this.#frameId = null;
  }
  this.render();
}
```

Además del botón **Pausar**, llamamos a este método cuando se oculta la pestaña, cuando el tablero sale de la zona visible de la página o cuando se retira el elemento del DOM.

La animación y su control de velocidad están en el juego completo al final del artículo, el tablero de arriba solo avanza con **un paso**, que para estudiar qué ha pasado entre dos generaciones nos es más útil.

## Ahora sí, vamos a probar cosas

Ahora que sabemos cómo se conectan las piezas, vamos a mirar qué producen las reglas, para el bloque, el blinker y el glider puedes usar el tablero de **Un paso** de arriba, cuando lleguemos a los tableros aleatorios usaremos el juego completo del final, que añade la animación, la velocidad y el control de densidad.

### Un bloque: seguir vivo sin hacer absolutamente nada

Carga **Bloque**, este es un cuadrado de cuatro células:

```text
....
.OO.
.OO.
....
```

Cada célula viva tiene tres vecinas vivas, todas sobreviven, es la mejor agrupación, ninguna posición muerta de alrededor tiene exactamente tres vecinas, así que tampoco aparecen células nuevas.

El resultado es idéntico al punto de partida, y vuelve a serlo en la siguiente generación, es un **patrón estable**, también llamado _still life_ ([Life Lexicon: block](https://sources.debian.org/data/main/g/golly/3.2-2/Help/Lexicon/lex_b.htm)).

No es que el universo se haya quedado parado, sigue calculando y obtiene el mismo resultado.

### Un blinker: repetir sin tener un contador de giros

Carga **Blinker** y pulsa dos veces **Un paso**, primero aparece la línea vertical y después regresa la horizontal que ya calculamos a mano.

### Un glider: moverse sin que hayamos programado movimiento

Carga **Glider**, esta es la configuración que estamos usando, junto con su estado cuatro generaciones después, dibujados sobre las mismas coordenadas:

```text
Generación 0    Generación 4

.O...           .....
..O..           ..O..
OOO..           ...O.
.....           .OOO.
.....           .....
```

Recupera la misma forma, pero una columna a la derecha y una fila hacia abajo, es el desplazamiento del glider en esa orientación, repite su forma cada cuatro generaciones, trasladada en diagonal, mientras no interfieran otros patrones ni el borde.

Busca en el código dónde le hemos puesto una velocidad o una dirección, no hay ninguna.

`PATTERNS.glider` solo guarda cinco coordenadas iniciales, después, `nextGeneration()` trata esas células exactamente igual que las de un bloque o las de un dibujo hecho al azar.

Lo que se desplaza es **el patrón**, mediante nacimientos y muertes en posiciones distintas. Las casillas siguen donde estaban.

Además, tener cinco células vivas no demuestra por sí solo que siga habiendo un glider, hay que comprobar sus posiciones, dos tableros pueden tener la misma población y comportarse de forma muy diferente.

### Al azar

Hasta ahora hemos elegido las posiciones iniciales a mano, vamos a probar qué pasa si las elegimos al azar, en el juego completo del final encontrarás un selector de **Densidad inicial** y el botón **Generar al azar**, la densidad será la probabilidad de que cada casilla empiece viva.

Para construir ese tablero usamos `randomGrid()`, esta es la parte que genera sus valores, he dejado fuera del fragmento la validación que comprueba que la densidad esté entre cero y uno:

```typescript
function randomGrid(density: number, columns = COLS, rows = ROWS): Grid {
  return emptyGrid(columns, rows).map((row) =>
    row.map((): Cell => (Math.random() < density ? 1 : 0)),
  );
}
```

`Math.random()` devuelve un número pseudoaleatorio entre cero, incluido, y uno, excluido, al compararlo con `0.3`, damos a cada posición aproximadamente un 30 % de probabilidad de empezar viva.

Eso no obliga a que exactamente el 30 % del tablero esté encendido, tampoco a que cada región tenga la misma densidad, cada casilla hace su propia probabilidad.

Al pulsar **Generar al azar**, el controlador pasa el resultado de `randomGrid()` a `replaceGrid()`, igual que hacía al cargar un patrón, así podemos usar **Un paso**, **Iniciar** y **Reiniciar** sin cambiar nada más.

Prueba con densidades del 10 %, 30 % y 70 %, genera un tablero y pulsa **Iniciar** para observar las primeras generaciones, después repite varias veces. Desaparece casi todo? Se quedan figuras quietas?? Reconoces algún oscilador?

No hay que esperar siempre el mismo resultado para un porcentaje, cambian las posiciones concretas, no solo el número de células.

Y llenar más el tablero no equivale a hacerlo más duradero, podemos comprobarlo sin ninguna estadística, una célula viva completamente rodeada tiene ocho vecinas y puede morir en el siguiente paso.

El azar solo se usa para construir ese tablero inicial, **durante la simulación no lanzamos dados**, dado el mismo tablero, las mismas reglas y el mismo tratamiento de los bordes, obtenemos la misma secuencia, es decir, esto es **determinista**.

Para repetir exactamente una prueba hay que conservar las posiciones iniciales, volver a pulsar el botón aleatorio con el mismo porcentaje genera otra prueba, no una repetición controlada.

## Qué pasa si cambiamos una sola célula

Volvamos a un dibujo que podamos seguir a mano, estos dos experimentos se pueden hacer tanto en el tablero de **Un paso** como en el juego completo, si lo has dejado animándose, pulsa **Pausar** antes de editar.

Primero carga un blinker y apaga una de las células de un extremo, quedan dos células juntas, cada una tiene una sola vecina, así que ambas mueren en el siguiente paso y el tablero queda vacío.

Hemos pasado de una oscilación indefinida, mientras no intervengamos, a la desaparición completa cambiando un único valor.

Ahora carga un bloque y apaga una de sus cuatro esquinas:

```text
Antes           Después de un paso

....            ....
.OO.            .OO.
.O..            .OO.
....            ....
```

Las tres supervivientes tienen dos vecinas cada una y se mantienen, la esquina que apagamos ve tres vecinas vivas y vuelve a encenderse.

Esta vez nace una nueva.

Por tanto, no vamos a decir que "cualquier cambio mínimo provoca un resultado completamente distinto", a veces sí y otras no. Depende de la configuración y de cómo actúan las reglas sobre ella.

Tampoco significa que el bloque haya aprendido a repararse, el código no detecta daños ni guarda una versión correcta del cuadrado, solo vuelve a aplicar las mismas condiciones.

## La emergencia no es una quinta regla escondida

Ya tenemos tres comportamientos diferentes, una figura que permanece quieta, otra que oscila y otra que se desplaza.

Pero solo hemos escrito una regla de actualización, aplicada por igual a todas las posiciones.

A esta aparición de comportamiento a escala del conjunto, a partir de interacciones locales, se hace llamar **emergencia**, no hace falta añadir una instrucción que describa cada figura completa ([The Nature of Code: sistemas complejos y emergencia](https://natureofcode.com/cellular-automata/)).

En nuestro caso se ve bastante claro, `countNeighbors()` no sabe qué es un glider, ni siquiera recibe todo el historial de la simulación, solo le basta con mirar una célula y su entorno en el tablero actual.

El comportamiento grande aparece al repetir esa operación por toda la cuadrícula y a lo largo de muchas generaciones.

Eso no significa que el pc esté improvisando, puede costarnos anticipar lo que hará un dibujo complicado pero se puede.

Y podemos separar tres decisiones que a veces se mezclan, **las reglas** determinan cómo cambia el sistema, **las condiciones iniciales** determinan desde dónde comienza y **los bordes** determinan qué mundo le hemos dejado disponible.

Cambiar una de ellas puede cambiar el resultado, por ejemplo el hecho de que el tablero no sea infinito ya cambia todo el experimento al final, no es lo mismo apagar una célula que modificar la condición de nacimiento.

## Entonces, esto está evolucionando o está aprendiendo?

Está evolucionando en el sentido de que su estado cambia con el tiempo.

En los ejemplos de machine learning ajustábamos parámetros usando datos y aquí no tenemos pesos que corregir, una respuesta deseada ni una función de error, las reglas de la generación cien son las mismas que las de la generación cero.

Tampoco hemos construido en este ejemplo un proceso de reproducción con variaciones heredables y selección, que algunas células desaparezcan y otras permanezcan no basta para afirmar que hemos simulado evolución biológica.

El glider no avanza porque quiera llegar a algún sitio, el bloque no sobrevive porque haya encontrado una estrategia, esas son interpretaciones que ponemos nosotros al mirar unos patrones.

Lo interesante es que ya podemos explicar de dónde sale cada comportamiento sin atribuirle intenciones a un simple array.

Esta será una buena base para explorar después otros sistemas donde sí introduzcamos reproducción, mutación o selección.

## Conclusiones

Hemos construido un tablero, contado vecinos y calculado cada generación en un array nuevo, deespués le hemos puesto una pantalla para poder observarlo y tocarlo.

El bloque nos permite comprobar la estabilidad, el blinker la repetición y el glider el desplazamiento de un patrón, cambiar una sola célula nos ha servido para comprobar que una perturbación puede destruir una estructura o desaparecer por sí misma.

No hemos programado tres comportamientos distintos, hemos programado unas reglas y probado distintas condiciones iniciales.

<life-complete-game>Demo del Juego de la Vida completo</life-complete-game>

Puedes ver todo el código del juego en [Github](https://github.com/prinick96/iadev.blog/tree/main/src/ui/assets/posts/el-juego-de-la-vida/).
