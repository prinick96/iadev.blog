---
title: "Claude optimizó mi código, ahora consume el triple de memoria"
description: "Una optimización en Go que redujo el tiempo de ejecución, triplicó el pico de RAM y acabó perdiendo frente a una solución con concurrencia limitada, código, mediciones y cero benchmarks inventados."
published_at: 2026-11-17
author: prinick96
categories:
  - engineering
  - development
---

La típica, le das un código a la IA, le dices que lo optimice y te devuelve una solución con concurrencia, goroutines y encima te da una cátedra bastante convincente sobre por qué ahora aprovecha mejor los recursos que antes, pero luego ejecutas el benchmark y efectivamente, tarda bastante menos, win win, otra victoria para tu título de _Autonomous Performance Optimization Engineer_.

Hasta que miras la memoria.

La versión original necesitaba unos **188MiB de RAM**, la versión "optimizada" llegó a **583MiB**, no es una estimación ni un porcentaje elegido para la portada, son los picos de memoria medidos en este experimento, **3,11 veces más RAM** para terminar el trabajo aproximadamente **2,84 veces más rápido**.

Y lo mejor es que después apareció una tercera versión que terminó el mismo trabajo todavía antes, sin multiplicar la memoria y no hizo falta reescribir el proyecto en Rust, migrar a Kubernetes ni inventarnos el puesto de _Senior Memory Engineer_.

> Una aclaración antes de seguir, yo he construido este experimento específicamente para el post, no estoy contando un incidente de producción, la variante "IA" representa una forma de optimizar que un asistente puede proponer cuando solo le pedimos que reduzca el tiempo, paralelizar, copiar datos para evitar problemas entre tareas y conservar los resultados hasta el final, el problema de memoria es real y las mediciones también, pero el escenario está controlado y puedes reproducirlo tu también, da igual si con Caludio o con Codex.

La idea no es demostrar que la IA no sabe programar, de hecho, **la optimización funciona**, lo que vamos a ver es por qué un cambio puede mejorar el resultado que le pediste y empeorar otro.

## Primero, qué intentamos optimizar?

Imagina un servicio Go que recibe un lote de registros binarios y tiene que normalizarlos antes de enviarlos a otro sistema, puede ser una exportación, una transformación de eventos o parte de un proceso de datos, para no meter PostgreSQL, ni colas, ni nada de infra, vamos a aislar únicamente la parte que queremos medir.

Cada registro se transforma mediante una función que realiza varias rondas de hash y produce una representación hexadecimal del contenido junto con su digest, al final calculamos un SHA-256 de **todos los registros transformados, en su orden original**.

Los datos de prueba serán siempre los mismos:

| Parámetro                                     |        Valor |
| --------------------------------------------- | -----------: |
| Registros                                     |       12.000 |
| Tamaño por registro                           |  8.192 bytes |
| Entrada total                                 |    93,75 MiB |
| Rondas de cálculo por registro                |           48 |
| Workers permitidos en las versiones paralelas |            4 |
| Tamaño de ventana de la última versión        | 64 registros |

Las rondas de hash solo nos sirven para simular trabajo de CPU suficiente como para que la concurrencia tenga algo que hacer, si la función se limitara a devolver un `string`, estaríamos midiendo simples asignaciones de memoria.

El requisito es sencillo, **las tres implementaciones deben producir el mismo checksum final**, manteniendo el orden de los registros, de esa forma podemos cambiar cómo se calcula, pero no lo que calcula.

En este caso, como la entrada es fija, el checksum nos permite comprobar que las tres versiones han producido la misma secuencia de salida con una confianza práctica muy alta.

## Un bucle, qué cosa tan del 2020

Empezamos con algo que entendería cualquiera que haya programado en su vida:

```go
func serial(w hash.Hash, data []byte, n, size, rounds int) {
    for i := 0; i < n; i++ {
        record := data[i*size : (i+1)*size]
        _, _ = io.WriteString(w, encodeRecord(record, rounds))
    }
}
```

Leemos un registro, lo transformamos, actualizamos el checksum y continuamos.

Aquí hay una característica importante, **no conservamos los 12.000 resultados transformados en memoria**, los procesamos de uno en uno y el lote de entrada sí está cargado entero, porque así hemos definido el experimento, pero no creamos una segunda colección completa con las salidas.

Es secuencial y para una carga intensa de CPU probablemente no aprovecha todos los núcleos disponibles porque lo que no quiero es confundir "podría ser más rápido" con "cualquier cosa que lo haga más rápido es una mejora".

## Le pedimos a la IA que lo haga más rápido

El objetivo que vamos a representar es este:

> Optimiza el tiempo de procesamiento de este script escrito en Go, puedes utilizar goroutines y paralelismo, pero debes mantener el resultado final y respetar el orden de los registros.

Ves lo que falta no? No hemos dicho nada sobre el límite de memoria, el tamaño máximo del lote ni el número de peticiones que podrían ejecutar ese script simultáneamente (porque estamos actuando como un vibecoder).

Una solución posible es lanzar cuatro workers y dejarles calcular registros en paralelo, hasta aquí, bien, pero para evitar compartir buffers mutables, la implementación decide copiar cada registro a su propio `[]byte` y después guarda **todos los resultados** en un `[]string` para escribirlos en el orden correcto cuando terminen los workers.

La parte importante se reduce a esto:

```go
copies := make([][]byte, n)
for i := 0; i < n; i++ {
    copies[i] = append([]byte(nil), data[i*size:(i+1)*size]...)
}

results := make([]string, n)

// Cuatro workers distribuyen índices y rellenan results[i].
// Cada uno escribe una posición distinta del slice.

for _, result := range results {
    _, _ = io.WriteString(w, result)
}
```

PD: el código completo de los workers está más abajo, no lo puse entero aquí porque el problema está en las dos colecciones que acabamos de crear, no en que un worker utilice `sync.WaitGroup`.

- **Primera decisión:** copiar **93,75MiB** de entrada aunque aquí todos los workers solo lean los datos y nadie los modifique.
- **Segunda decisión:** guardar la salida de todos los registros y cada salida hexadecimal ocupa `(8192 + 32) × 2 = 16.448` bytes, así que los 12.000 resultados representan aproximadamente **188,23 MiB** de contenido, sin contar cabeceras, memoria temporal, estructuras del runtime etc

Esas copias defensivas tendrían sentido si estuviéramos reutilizando buffers que otro proceso puede modificar, pero **en nuestro caso la entrada es inmutable durante el procesamiento**.

Conservar toda la salida también puede ser perfectamente válido si queremos devolverla como colección completa y el tamaño está acotado, pero nosotros solo necesitamos consumir los registros en orden para calcular el resultado y no necesitamos tenerlos todos a la vez.

## Ejecutamos los benchmarks

Compilé y ejecuté cada variante **tres veces en procesos separados**, utilizando los mismos parámetros y los mismos datos deterministas, para evitar confundir el tiempo de generación de datos con el de procesamiento, el cronómetro interno empieza justo antes de llamar a la implementación correspondiente.

El pico de memoria se ha medido externamente con GNU `time`, que informa el máximo RSS del proceso, por lo que **sí incluye** la carga inicial de los datos y el resto de memoria utilizada por Go, no es el tamaño del heap en un instante concreto ni una cifra inventada a partir de usar `runtime.MemStats`.

Entorno de esta prueba:

- Linux `amd64`, con cuatro vCPU.
- Go `1.27.3`
- `GOMAXPROCS=4`, cuatro workers para las variantes paralelas.
- Sin acceso a red, base de datos, almacenamiento externo ni dependencias Go adicionales.
- Los valores mostrados son el **promedio** de tres ejecuciones independientes, no el resultado más favorable elegido a mano.

| Implementación                                    | Tiempo de procesamiento |       Pico RSS | Memoria frente a original |
| ------------------------------------------------- | ----------------------: | -------------: | ------------------------: |
| Original secuencial                               |                 3,537 s |     187,57 MiB |                     1,00× |
| Paralela con copias y resultados completos («IA») |                 1,245 s |     583,32 MiB |                 **3,11×** |
| Paralela por ventanas de 64                       |             **0,993 s** | **189,20 MiB** |                 **1,01×** |

Sí, la solución paralela inicialmente es mucho más rápida, pasamos de procesar el lote en 3,537 segundos a 1,245 segundos, es una mejora de unas **2,84 veces** y si en nuestra revisión solo miramos el tiempo podemos cerrar la tarea y publicar un post diciendo que la IA es un 284 % mejor que los programadores, pero por suerte las matemáticas no funcionan así, y tampoco la ingeniería.

Midiendo la RAM el pico pasa de 187,57MiB a 583,32MiB, eso es **3,11 veces** de la memoria original, no pasa porque Go sea malo gestionando memoria, pasa porque hemos decidido **mantener vivos más datos de los que realmente necesitamos**.

La tercera implementación termina todavía antes, sin disparar la memoria, y con esa sí tenemos una alternativa que vale la pena revisar.

### Los tres checksums son idénticos

Todas las ejecuciones devolvieron este resultado:

```text
92c49996829dec6ced2c474a366947e0e5f8fc852f65dfe0a556a2fb35021b84
```

También ejecuté una prueba de igualdad entre las tres variantes con el detector de carreras de Go (`go test -race`) y pasaron, esto verifica el comportamiento concreto que estamos probando.

## A donde se fue la memoria?

Aquí conviene separar tres cosas que suelen aparecer mezcladas cuando alguien dice "consume mucha memoria"

- **Memoria asignada acumulada:** la suma de las asignaciones realizadas durante la ejecución, un programa puede asignar 1GB en un minuto, liberar y reutilizar casi todo, y no por eso necesita 1GB de RAM simultáneamente.
- **Heap en uso:** memoria del heap de Go que en el momento de la observación sigue ocupada por objetos, cambia durante la ejecución y depende también de lo que haya recolectado el GC.
- **RSS:** memoria residente del proceso según el sistema operativo, esto incluye más cosas que los objetos vivos de Go, como stacks, memoria del runtime y páginas que el proceso puede no haber devuelto todavía al SO.

En nuestra ejecución, `runtime.MemStats.TotalAlloc`, medido desde el inicio de la prueba mostró aprox 726,6MiB de asignaciones acumuladas para la versión secuencial y 820,8MiB para la variante paralela con copias.

Si solo miras ese contador, puedes pensar que la segunda tiene una diferencia muy pequeña pero **TotalAlloc no es el pico de RAM**, la diferencia importante es cuántos datos mantenemos vivos simultáneamente y qué memoria termina reteniendo el proceso.

En el código encontramos dos causas muy concretas:

1. Duplicamos la entrada completa para que cada worker tenga su propia copia, aun siendo datos que no se modifican.
2. Conservamos las 12k de cadenas de salida hasta que todos los workers terminan, cuando podríamos ir consumiéndolas por partes.

Hay asignaciones temporales dentro de `encodeRecord`, GC, buffers y otros costes del runtime, por eso **no puedes sumar 93,75 + 93,75 + 188,23 y esperar que el RSS medido sea exactamente ese número**, la suma explica buena parte del diseño, pero el resultado real se mide.

Y no, **esto no es una fuga de memoria**, las referencias dejan de necesitarse cuando la función termina, el problema es el pico que alcanza mientras trabaja, en un servicio que corre en un contenedor con límite de memoria, una retención temporal puede ser suficiente para que el proceso termine por OOM, que el GC vaya a liberar algo después no ayuda si ya matamos el container.

### Más goroutines no implican automáticamente más rendimiento

Podríamos pensar que el problema es haber creado cuatro workers y solucionarlo dejando solo dos, sería una forma de reducir parte del paralelismo, pero no arreglaría el hecho de que conservamos **todo el lote de salida**, da igual que lo calculen 2 goroutines o 100.

La concurrencia es una decisión distinta de la estrategia de memoria, podemos usar varios núcleos sin guardar cada resultado hasta el final y también podemos hacer un programa secuencial que consuma muchísima memoria si carga todo lo que encuentra, el problema es no poner límites a los datos que mantenemos en proceso.

## La tercera versión: cuatro workers y memoria acotada

Para corregir la situación vamos a conservar la parte que sí nos aportaba valor, es decir, el procesamiento paralelo.

Pero en vez de lanzar todo el lote y esperar a que se acumulen los 12k de resultados vamos a trabajar por **ventanas de 64 registros**, como si estuviésemos paginando:

```text
Lote completo: 12.000 registros
            |
            v
     Tomar 64 registros
            |
            v
   4 workers en paralelo
            |
            v
  Guardar 64 resultados
            |
            v
 Consumirlos en orden
            |
            v
       Siguientes 64
```

Cada ventana se procesa en paralelo, se consume en orden y luego se descarta antes de continuar, como los datos de entrada son inmutables, tampoco necesitamos duplicarlos para entregárselos a los workers.

La parte importante es:

```go
for start := 0; start < n; start += windowSize {
    end := min(start+windowSize, n)
    results := make([]string, end-start)

    // Los workers calculan, como máximo,
    // los resultados de esta ventana.
    // Esperamos a que terminen antes de consumirla.

    for _, result := range results {
        _, _ = io.WriteString(w, result)
    }
}
```

Aquí estoy mostrando la estructura, en el código completo verás los `WaitGroup`, el reparto de índices y las comprobaciones de límites.

Lo importante es que ahora guardamos como máximo **64 resultados de salida por ventana** en vez de los 12k enteros, solo el contenido normalizado de esos 64 registros ocupa alrededor de 1MiB, frente a los 188 MiB del lote completo, esto no significa que toda la aplicación consuma 1 MiB, porque seguimos teniendo el lote de entrada y el runtime, pero ya no multiplicamos su memoria temporal por el tamaño completo del trabajo.

Y el resultado de la prueba fue:

- **0,993 segundos** para procesar los 12.000 registros.
- **189,20 MiB** de pico RSS.
- El **mismo checksum** que las otras dos versiones.

En este entorno concreto fue incluso más rápido que la variante que retenía todos los resultados.

## Qué habría cambiado si somos Prompt Engineer?

Si le pides que reduzca el tiempo, y lo reduce, ha cumplido una parte del objetivo, otra cosa es que la solución sea la ideal para tu app, el prompt original no decía cuánto podía consumir, qué carga simultánea esperamos ni dónde se va a desplegar, la versión paralela puede ser perfectamente aceptable en un entorno con memoria abundante donde el tiempo sea la restricción principal, en otro entorno, el pico de 583 MiB podría ser inaceptable.

Yo hubiese escrito algo como:

> Optimiza el tiempo de procesamiento de este lote manteniendo el mismo resultado y el orden de los registros, la memoria RSS del proceso debe mantenerse por debajo de 256MiB con la carga de referencia, no dupliques datos de entrada que son inmutables, limita los resultados pendientes de consumir y conserva un máximo de cuatro workers, antes de aceptar la solución, ejecuta pruebas de igualdad, detector de carreras y benchmarks de tiempo y pico de RSS, si no puedes medir alguna métrica, indícalo explícitamente.

> Y si no eres un buen programador, da igual que "tan bien" sepas hablarle a la IA, esos detalles simplemente no los puedes mencionar porque no los sabes.

Esto ya lo comenté en mi post de [cómo desarrollo con IA sin perder el control de mi propio código](https://iadev.blog/posts/como-desarrollo-con-ia-sin-perder-el-control-de-mi-codigo/), el asistente puede implementar y proponer, pero el cambio que generaremos sigue siendo una decisión de ingeniería.

## Implementación completa

Puedes copiarte esto en un `main.go`, compilarlo y probar si obtienes algo parecido en tu pc.

El script tiene tres modos:

- `serial`: versión original, transforma cada registro y lo consume inmediatamente.
- `eager`: cuatro workers, copias defensivas de la entrada y resultados completos retenidos en memoria.
- `window`: cuatro workers, entrada compartida solo para lectura y resultados acotados por ventanas.

```go
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"flag"
	"fmt"
	"hash"
	"io"
	"os"
	"runtime"
	"sync"
	"sync/atomic"
	"time"
)

const mib = 1024 * 1024

func encodeRecord(src []byte, rounds int) string {
	digest := sha256.Sum256(src)
	h := sha256.New()

	for i := 0; i < rounds; i++ {
		h.Reset()
		_, _ = h.Write(digest[:])
		_, _ = h.Write(src)
		h.Sum(digest[:0])
	}

	out := make([]byte, hex.EncodedLen(len(digest)+len(src)))
	hex.Encode(out[:len(digest)*2], digest[:])
	hex.Encode(out[len(digest)*2:], src)

	return string(out)
}

func writeRecord(w io.Writer, src []byte, rounds int) {
	_, _ = io.WriteString(w, encodeRecord(src, rounds))
}

func serial(w hash.Hash, data []byte, n, size, rounds int) {
	for i := 0; i < n; i++ {
		writeRecord(w, data[i*size:(i+1)*size], rounds)
	}
}

func eager(w hash.Hash, data []byte, n, size, rounds, workers int) {
	copies := make([][]byte, n)
	for i := 0; i < n; i++ {
		copies[i] = append([]byte(nil), data[i*size:(i+1)*size]...)
	}

	results := make([]string, n)
	var next atomic.Int64
	var wg sync.WaitGroup

	for worker := 0; worker < workers; worker++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			for {
				i := int(next.Add(1)) - 1
				if i >= n {
					return
				}

				results[i] = encodeRecord(copies[i], rounds)
			}
		}()
	}

	wg.Wait()

	for _, result := range results {
		_, _ = io.WriteString(w, result)
	}

	runtime.KeepAlive(results)
	runtime.KeepAlive(copies)
}

func window(w hash.Hash, data []byte, n, size, rounds, workers, windowSize int) {
	for start := 0; start < n; start += windowSize {
		end := start + windowSize
		if end > n {
			end = n
		}

		results := make([]string, end-start)
		var next atomic.Int64
		var wg sync.WaitGroup

		for worker := 0; worker < workers; worker++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				for {
					j := int(next.Add(1)) - 1
					if j >= len(results) {
						return
					}

					i := start + j
					results[j] = encodeRecord(data[i*size:(i+1)*size], rounds)
				}
			}()
		}

		wg.Wait()

		for _, result := range results {
			_, _ = io.WriteString(w, result)
		}
	}
}

func main() {
	mode := flag.String("mode", "serial", "serial, eager o window")
	n := flag.Int("n", 12000, "cantidad de registros")
	size := flag.Int("size", 8192, "bytes por registro")
	rounds := flag.Int("rounds", 48, "rondas de hash por registro")
	workers := flag.Int("workers", 4, "workers paralelos")
	win := flag.Int("window", 64, "registros en vuelo por ventana")

	flag.Parse()

	if *n <= 0 || *size <= 0 || *rounds < 0 || *workers <= 0 || *win <= 0 {
		fmt.Fprintln(os.Stderr, "parámetros inválidos")
		os.Exit(2)
	}

	var before runtime.MemStats
	runtime.ReadMemStats(&before)
	data := make([]byte, *n**size)

	for i := range data {
		data[i] = byte((i*31 + (i / *size)*17) & 0xff)
	}

	start := time.Now()
	result := sha256.New()

	switch *mode {
	case "serial":
		serial(result, data, *n, *size, *rounds)
	case "eager":
		eager(result, data, *n, *size, *rounds, *workers)
	case "window":
		window(result, data, *n, *size, *rounds, *workers, *win)
	default:
		fmt.Fprintln(os.Stderr, "modo inválido")
		os.Exit(2)
	}

	elapsed := time.Since(start)
	runtime.KeepAlive(data)

	var after runtime.MemStats
	runtime.ReadMemStats(&after)

	fmt.Printf("mode=%s elapsed=%s checksum=%x alloc_total_mib=%.1f gc=%d\n", *mode, elapsed.Round(time.Millisecond), result.Sum(nil), float64(after.TotalAlloc-before.TotalAlloc)/mib, after.NumGC-before.NumGC)
}
```

### Y si quiero ver exactamente qué se queda en el heap?

Para esto hay que usar [`runtime/pprof`](https://pkg.go.dev/runtime/pprof), puedes guardar un perfil de memoria en el momento en que la versión `eager` todavía tiene vivos `copies` y `results`, **después de que terminen los workers pero antes de consumir o liberar esas colecciones**.

Por ejemplo, podrías usar:

```go
func writeHeapProfile(path string) error {
    runtime.GC()
    f, err := os.Create(path)
    if err != nil {
        return err
    }
    defer f.Close()
    return pprof.WriteHeapProfile(f)
}
```

De dependencia tendríamos `runtime/pprof` y se añade solo para una ejecución de diagnóstico, **no mezcles esa captura con las mediciones de tiempo anteriores**, porque forzar un GC y escribir el perfil afectan a la ejecución, después puedes abrir el perfil con `go tool pprof -http=:8080 ./memoria-go heap.pprof`.

El profiler te ayuda a entender qué se está asignando y qué sigue vivo en el momento de la captura.

## Y qué pasa cuando llegan diez peticiones a la vez?

Este es el problema que no aparece en una demo donde ejecutamos un solo lote y cerramos el programa.

Imagina que esta operación se expone desde una API y que llegan varias peticiones de tamaño similar al mismo tiempo, **no podemos multiplicar simplemente 583MiB por 10 y dar esa cifra como predicción exacta**, porque las ejecuciones podrían compartir recursos, solaparse de distinta manera y competir por CPU y memoria.

Pero sí sabemos algo, que una implementación que retiene copias y resultados completos **tiene un riesgo de picos elevados cuando se ejecutan varias solicitudes simultáneamente**, la concurrencia por petición y la concurrencia global son dos límites distintos, de nada sirve que cada petición use "solo cuatro workers" si permites que cientos de peticiones inicien su propio procesamiento sin ningún control.

Ahí ya entramos en la parte de saber cuánto consume una operación de principio a fin, cuántas puedo ejecutar simultáneamente y en qué momento necesito establecer una cola, backpressure o un límite de trabajo en curso.

Porque el programa puede ser increíblemente rápido con una sola petición y convertirse en una máquina de generar OOM cuando alguien decide utilizarlo de verdad.

![mas-rapido-no-basta](https://img.iadev.blog/posts/mas-rapido-no-basta.png)

- Una versión paralela redujo el tiempo de procesamiento de **3,537 a 1,245 segundos**.
- Esa misma versión elevó el pico de memoria de **187,57 a 583,32MiB**.
- Una solución con procesamiento por ventanas completó el trabajo en **0,993 segundos**, con un pico de **189,20MiB**.
- Las tres produjeron el mismo resultado y pasaron la comprobación de concurrencia que ejecutamos.

La versión de la IA no era incorrecta en su cálculo, el error habría sido **aceptarla como una mejora general sin medir los recursos que iba a necesitar**, o mejor dicho, el error es vibecodear sin saber lo que haces.

Eso no cambia aunque el código lo escriba un senior con veinte años de experiencia, un junior o un modelo que acaba de consumir medio millón de tokens para sustituir un bucle por un sistema de workers, también los humanos hacemos optimizaciones que empeoran otra métrica, la diferencia es si somos capaces de comprobarlo antes de que el problema sea un problema de verdad.

Esto tampoco significa que debamos rechazar una solución que usa tres veces más memoria, si el sistema tiene recursos suficientes, el procesamiento es esporádico y el tiempo es lo más importante, puede ser una decisión perfectamente razonable, todo depende del contexto, pero **esa decisión no la toma el benchmark de milisegundos por nosotros**.
