---
title: "K-Means en Go: agrupar datos sin preguntarle a un LLM"
description: "Implementamos K-Means en Go, sin dependencias, para encontrar patrones sin datos etiquetados agrupando métricas con distancias, medias y un bucle."
published_at: 2026-11-02
author: prinick96
categories:
  - engineering
  - machine-learning
---

En el [primer post](https://iadev.blog/posts/regresion-lineal-go-o-harness-de-agentes/) usamos una recta para estimar cuánto iba a consumir nuestro server, después vimos cómo [ajustarla con descenso de gradiente](https://iadev.blog/posts/descenso-de-gradiente-go-machine-learning/) y en el [anterior](https://iadev.blog/posts/regresion-logistica-go-cuando-una-recta-tiene-que-tomar-decisiones/), pasamos de predecir una cantidad a estimar la probabilidad de que se quedara sin memoria.

Continuaremos con el mismo ejemplo, hasta ahora había algo en común, le dábamos al entrenamiento las entradas y también las respuestas correctas, los MB que se consumieron, o si el proceso terminó fallando, ahora vamos a quitar esa segunda parte y trabajaremos con un dato más, CPU.

Añadimos ese parámetro adicional, para ahora hacernos la pregunta, **qué observaciones se parecen entre sí?**

Vamos a agruparlas con **K-Means**, desde cero y en Go, esta vez ni siquiera necesitamos derivar una sigmoide, con restar, multiplicar y calcular medias es más que suficiente.

![asignar-promediar-repetir](https://i.8upload.com/image/b1159cf3d0a88e8d/01-asignar-promediar-repetir.png)

## Ahora no tenemos una `y` que copiar

Lo anterior era aprendizaje supervisado, cada entrada tenía un resultado conocido con el que comparar la predicción, ahora solo vamos a pasar las características de cada observación.

Esto es [aprendizaje no supervisado](https://developers.google.com/machine-learning/glossary/clustering), y el problema concreto que vamos a resolver se llama **clustering** o agrupamiento.

No estamos entrenando al modelo para reconocer unas clases que ya definimos, estamos buscando una agrupación según una medida de cercanía que también vamos a elegir nosotros.

## Los datos: el server, pero ahora con dos números

Cada fila será una medición del mismo proceso en un momento distinto, añadimos CPU al consumo de RAM, así podemos representar cada observación como un punto en un plano.

| Medición |  CPU |  RAM |
| -------- | ---: | ---: |
| A        | 10 % | 15 % |
| B        | 15 % | 20 % |
| C        | 20 % | 25 % |
| D        | 70 % | 20 % |
| E        | 75 % | 25 % |
| F        | 80 % | 30 % |
| G        | 70 % | 75 % |
| H        | 75 % | 80 % |
| I        | 80 % | 85 % |

Las letras solo sirven para identificar las filas, no son clases y no se las pasaremos al algoritmo, tampoco le pasaremos el instante de cada medición porque vamos a comparar estados, no a aprender cómo evoluciona el proceso en el tiempo.

Si dibujamos los datos, queda así:

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "Consumo de CPU y RAM de las nueve mediciones de la tabla anterior. A, B y C tienen CPU y RAM bajas; D, E y F tienen CPU alta y RAM baja; G, H e I tienen CPU y RAM altas. Todavía no hemos asignado grupos.",
  "width": 400,
  "height": 400,
  "data": {
    "values": [
      { "measurement": "A", "cpu": 10, "ram": 15 },
      { "measurement": "B", "cpu": 15, "ram": 20 },
      { "measurement": "C", "cpu": 20, "ram": 25 },
      { "measurement": "D", "cpu": 70, "ram": 20 },
      { "measurement": "E", "cpu": 75, "ram": 25 },
      { "measurement": "F", "cpu": 80, "ram": 30 },
      { "measurement": "G", "cpu": 70, "ram": 75 },
      { "measurement": "H", "cpu": 75, "ram": 80 },
      { "measurement": "I", "cpu": 80, "ram": 85 }
    ]
  },
  "encoding": {
    "x": {
      "field": "cpu",
      "type": "quantitative",
      "title": "CPU (%)",
      "scale": { "domain": [0, 100] },
      "axis": { "tickCount": 5 }
    },
    "y": {
      "field": "ram",
      "type": "quantitative",
      "title": "RAM (%)",
      "scale": { "domain": [0, 100] },
      "axis": { "tickCount": 5 }
    }
  },
  "layer": [
    { "mark": { "type": "point", "filled": true, "size": 80 } },
    {
      "mark": { "type": "text", "dx": 10, "align": "left", "fontSize": 14 },
      "encoding": { "text": { "field": "measurement", "type": "nominal" } }
    }
  ]
}
```

Se ven tres zonas bastante claras porque **hemos inventado los datos para que se vean**, esto nos sirve para entender y comprobar el algoritmo, la gracia es que el programa no va a recibir esas tres zonas dibujadas, solo recibirá los nueve pares de números.

## Qué significa K-Means?

K-Means es un algoritmo de aprendizaje no supervisado que sirve para agrupar datos que se parecen entre sí, sin necesidad de decirle previamente a qué grupo pertenece cada uno.

La `K` es la cantidad de grupos que queremos intentar formar, esa cantidad la elegimos antes de entrenar al modelo, en nuestro caso vamos a usar `k = 3`.

`Means` viene de medias, cada grupo tiene un punto central llamado **centroide**, que representa la media de los valores de todos los elementos que pertenecen a ese grupo, por ejemplo, si manualmente agrupamos los servers A y B, podemos calcular su centroide así:

```
CPU: (10 + 15) / 2 = 12,5
Memoria: (15 + 20) / 2 = 17,5
```

Por tanto, el centroide de ese grupo estará en las coordenadas `(12,5, 17,5)`, fácil no? pues cada vez que mencione un centroide, ya sabemos qué es exactamente.

Entonces, sabiendo esto, usaremos el [algoritmo básico](https://developers.google.com/machine-learning/clustering/kmeans/overview) que consiste en alternar dos operaciones, asignar cada punto al centroide más cercano y recalcular los centroides con los puntos que recibieron.

```text
Elegir k posiciones iniciales
            |
            v
Asignar cada punto al centroide más cercano
            |
            v
Recalcular cada centroide haciendo la media
            |
            v
Reasignar los puntos y repetir si cambian los grupos
```

Esta es la versión clásica conocida como algoritmo de Lloyd, nosotros pararemos cuando las asignaciones ya no cambien, con un límite de iteraciones por si no llegamos antes.

## Primero: qué significa que dos puntos estén cerca?

Usaremos la distancia euclídea al cuadrado, la que usabamos en la univ cuando trabajabamos con el plano cartesiano, para dos puntos `a` y `b`:

$$
\operatorname{distancia}^2(a, b) = (a_x - b_x)^2 + (a_y - b_y)^2
$$

La distancia euclídea llevaría una raíz cuadrada, pero no necesitamos calcularla para decidir cuál es menor: comparar `4` con `9` da el mismo orden que comparar `2` con `3`.

Vamos a empezar con estas posiciones, tomadas de A, B y H (ojo no significa que esto sea el resultado de los centroides, estamos directamente tomando esas posiciones como los centroides, para tener un punto de partida):

```text
Centroide 0 = (0.10,0.15)
Centroide 1 = (0.15,0.20)
Centroide 2 = (0.75,0.80)
```

Fijate que los dos primeros están bastante juntos, esto lo hacemos a propósito para ver cómo se recolocan, no para regalarle al algoritmo la solución terminada.

Para la medición E, que está en `(0.75, 0.25)`, las cuentas son, lo tomaremos como nuestro punto `a` en la ecuación de distancia y los centroides inventados como `b`:

$$
\begin{aligned}
\text{Al centroide 0:} \quad &(0.75 - 0.10)^2 + (0.25 - 0.15)^2 = 0.4325 \\
\text{Al centroide 1:} \quad &(0.75 - 0.15)^2 + (0.25 - 0.20)^2 = 0.3625 \\
\text{Al centroide 2:} \quad &(0.75 - 0.75)^2 + (0.25 - 0.80)^2 = 0.3025
\end{aligned}
$$

La menor es la última, así que E empieza en el grupo `2`, todavía no hemos terminado, cuando se muevan los centroides, puede cambiar de grupo.

## Después: mover el centro al centro

Con esas posiciones iniciales, el grupo `1` recibe B, C y D y su nuevo centroide se calcula así:

$$
\begin{aligned}
\text{CPU media} &= \frac{0.15 + 0.20 + 0.70}{3} = 0.35 \\\\

\text{RAM media} &= \frac{0.20 + 0.25 + 0.20}{3} \approx 0.216667 \\\\

\text{Nuevo centroide } 1 &\approx (0.35, 0.216667)
\end{aligned}
$$

Hacemos lo mismo con los otros grupos y volvemos a calcular a qué centroide queda más cerca cada punto.

Y por qué la media? Porque, manteniendo fijos los puntos de un grupo, esa es la posición que minimiza la suma de sus distancias al cuadrado, en una sola coordenada podemos verlo sin mucho misterio:

$$
\begin{aligned}
\operatorname{Error}(c) &= \sum_i (x_i - c)^2 \\
\text{derivada} &= 2 \left(mc - \sum_i x_i\right)
\end{aligned}
$$

Si igualamos a cero la derivada y despejamos:

$$
c = \frac{\sum_i x_i}{m}
$$

`m` es el número de puntos de ese grupo, repetimos la cuenta para la otra coordenada y tenemos el centroide.

Una vez fijados los grupos, sabemos calcular directamente su mejor centro, lo que repetimos es la asignación y la media, no pequeños pasos de gradiente.

## Y qué estamos intentando reducir?

En los posts anteriores comparábamos una predicción con una respuesta conocida, aquí no tenemos esa respuesta, pero sí podemos medir cuánto se alejan los puntos del centro de su grupo.

La función que queremos minimizar es:

$$
J = \sum_i \operatorname{distancia}^2(\text{punto}_i, \text{centroide asignado}_i)
$$

A esta suma se la suele llamar [inercia o suma de cuadrados dentro de los grupos](https://scikit-learn.org/stable/modules/clustering.html#k-means), esta es una medida de dispersión, no un porcentaje de aciertos.

Con los centroides fijos, mandar cada punto al más cercano no aumenta esa suma, con las asignaciones fijas, mover cada centro a la media tampoco la aumenta, es por eso que estos dos pasos encajan, mejoramos una parte mientras mantenemos la otra quieta.

En aritmética exacta, la inercia no aumenta entre iteraciones, en estos tests vamos a dejar una pequeña tolerancia para el redondeo de los `float64`.

## Implementación en Go

Esta vez creamos el paquete `clustering`, para separarnos del paquete `regression`.

La implementación será de **dos dimensiones**, para que podamos seguirla en el dibujo, el mismo procedimiento se puede extender a más dimensiones, sumando las diferencias al cuadrado de cada una, pero no lo veo necesario para explicarlo.

Creamos `clustering/kmeans.go`:

```go
package clustering

import (
	"fmt"
	"math"
	"slices"
)

// Point representa el punto en el plano cartesiano
type Point struct {
	X, Y float64
}

type KMeans struct {
	Centroids []Point
	Converged bool
}

func finite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}

func squaredDistance(a, b Point) float64 {
	dx, dy := a.X-b.X, a.Y-b.Y

	return dx*dx + dy*dy
}

func nearest(point Point, centroids []Point) (int, float64, error) {
	if len(centroids) == 0 {
		return 0, 0, fmt.Errorf("el modelo no tiene centroides")
	}

	best, bestDistance := 0, math.Inf(1)
	for i, centroid := range centroids {
		distance := squaredDistance(point, centroid)
		if !finite(distance) {
			return 0, 0, fmt.Errorf("distancia infinita: revisa los datos y su escala")
		}
		// En un empate gana el centroide con menor índice.
		if distance < bestDistance {
			best, bestDistance = i, distance
		}
	}
	return best, bestDistance, nil
}

// Predict devuelve el índice del centroide más cercano, no una probabilidad.
func (model *KMeans) Predict(point Point) (int, error) {
	label, _, err := nearest(point, model.Centroids)
	return label, err
}

func assign(points, centroids []Point) ([]int, float64, error) {
	labels := make([]int, len(points))
	var inertia float64
	for i, point := range points {
		label, distance, err := nearest(point, centroids)
		if err != nil {
			return nil, 0, fmt.Errorf("dato %d: %w", i, err)
		}
		labels[i] = label
		inertia += distance
	}
	if !finite(inertia) {
		return nil, 0, fmt.Errorf("inercia infinita: revisa la escala")
	}
	return labels, inertia, nil
}

// Fit aplica K-Means en 2D. k es len(initial).
// history[0] es la inercia inicial, el resto, después de cada actualización
// Conserva el centroide anterior cuando un grupo queda vacío
func Fit(points, initial []Point, maxIterations int) (*KMeans, []int, []float64, error) {
	if len(points) == 0 || len(initial) == 0 || len(initial) > len(points) {
		return nil, nil, nil, fmt.Errorf("se requiere 1 <= k <= número de datos")
	}

	if maxIterations <= 0 {
		return nil, nil, nil, fmt.Errorf("maxIterations debe ser positivo")
	}

	model := &KMeans{Centroids: slices.Clone(initial)}
	labels, inertia, err := assign(points, model.Centroids)
	if err != nil {
		return nil, nil, nil, err
	}
	history := []float64{inertia}

	k := len(initial)
	sums := make([]Point, k)
	counts := make([]int, k)

	for iteration := 0; iteration < maxIterations; iteration++ {
		for i := 0; i < k; i++ {
			sums[i] = Point{0, 0}
			counts[i] = 0
		}

		for i, point := range points {
			group := labels[i]
			sums[group].X += point.X
			sums[group].Y += point.Y
			counts[group]++
		}

		for group, count := range counts {
			if count == 0 {
				continue
			}
			model.Centroids[group] = Point{
				X: sums[group].X / float64(count),
				Y: sums[group].Y / float64(count),
			}
		}

		next, inertia, err := assign(points, model.Centroids)
		if err != nil {
			return nil, nil, nil, err
		}
		history = append(history, inertia)

		model.Converged = slices.Equal(labels, next)
		labels = next

		if model.Converged {
			break
		}
	}

	return model, labels, history, nil
}
```

`Fit` recibe los datos, las posiciones iniciales y el máximo de iteraciones, `k` es la longitud de `initial`, así evitamos recibir un número por un lado y una cantidad distinta de centroides por otro.

También retorna el modelo, el grupo asignado a cada observación y el historial de inercia, como en los posts anteriores, `history[0]` describe el estado inicial y `history[1]`, el resultado de la primera actualización.

Las posiciones iniciales son solo un punto de partida, **no etiquetas de entrenamiento**, las pasamos explícitamente para poder repetir las cuentas y probar distintos arranques sin mezclar todavía el algoritmo con una estrategia aleatoria.

### Dos detalles importantes

Primero, un grupo puede quedarse sin puntos, la media de cero observaciones no existe, así que no vamos a dividir entre cero.

En esta versión **conservamos su centroide anterior**. esto es una decisión sencilla, no una garantía de que terminemos con `k` grupos ocupados. Si necesitas que todos tengan datos, tendrás que tratar esa situación de otra manera, por ejemplo recolocando el centroide vacío y continuando. Hay [implementaciones con distintas políticas](https://www.mathworks.com/help/stats/kmeans.html), no una línea mágica que todos deban copiar.

Segundo, después de mover los centroides reasignamos los puntos hasta en la última vuelta, ssí, las etiquetas retornadas coinciden con lo que devuelve `Predict` sobre los mismos datos.

Si llegamos al límite mientras siguen cambiando las asignaciones, `Converged` será `false`, esto significará que los centroides todavía podrían no ser las medias de esos últimos grupos, **parar porque se acabó el bucle no es lo mismo que converger.**

## Cómo lo usamos?

Nuestro `main.go` contiene los mismos nueve datos de la tabla:

```go
package main

import (
	"fmt"
	"log"

	"example.com/kmeans/clustering"
)

func main() {
	// X = proporción de CPU; Y = proporción de RAM.
	points := []clustering.Point{
		{X: 0.10, Y: 0.15}, // A
		{X: 0.15, Y: 0.20}, // B
		{X: 0.20, Y: 0.25}, // C
		{X: 0.70, Y: 0.20}, // D
		{X: 0.75, Y: 0.25}, // E
		{X: 0.80, Y: 0.30}, // F
		{X: 0.70, Y: 0.75}, // G
		{X: 0.75, Y: 0.80}, // H
		{X: 0.80, Y: 0.85}, // I
	}

	// Tres posiciones de partida: A, B y H.
	initial := []clustering.Point{points[0], points[1], points[7]}
	model, labels, history, err := clustering.Fit(points, initial, 100)
	if err != nil {
		log.Fatal(err)
	}

	for iteration, inertia := range history {
		fmt.Printf("Iteración %d | Inercia: %.6f\n", iteration, inertia)
	}
	fmt.Printf("Convergió: %t\n", model.Converged)

	for group, centroid := range model.Centroids {
		fmt.Printf("\nGrupo %d | CPU: %.2f %% | RAM: %.2f %% | Datos:",
			group, centroid.X*100, centroid.Y*100)
		for i, label := range labels {
			if label == group {
				fmt.Printf(" %c", 'A'+i)
			}
		}
	}
	fmt.Println()

	newPoint := clustering.Point{X: 0.78, Y: 0.28}
	group, err := model.Predict(newPoint)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("\nCPU: 78 %% | RAM: 28 %% | Grupo: %d\n", group)
}
```

Esto nos devuelve:

```text
Iteración 0 | Inercia: 0.872500
Iteración 1 | Inercia: 0.491778
Iteración 2 | Inercia: 0.177600
Iteración 3 | Inercia: 0.030000
Convergió: true

Grupo 0 | CPU: 15.00 % | RAM: 20.00 % | Datos: A B C
Grupo 1 | CPU: 75.00 % | RAM: 25.00 % | Datos: D E F
Grupo 2 | CPU: 75.00 % | RAM: 80.00 % | Datos: G H I

CPU: 78 % | RAM: 28 % | Grupo: 1
```

La inercia baja desde `0.8725` hasta `0.03`, y las asignaciones evolucionan así:

| Iteración   | A   | B   | C   | D   | E   | F   | G   | H   | I   |
| ----------- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Inicio      | 0   | 1   | 1   | 1   | 2   | 2   | 2   | 2   | 2   |
| Iteración 1 | 0   | 0   | 0   | 1   | 2   | 2   | 2   | 2   | 2   |
| Iteración 2 | 0   | 0   | 0   | 1   | 1   | 1   | 2   | 2   | 2   |
| Iteración 3 | 0   | 0   | 0   | 1   | 1   | 1   | 2   | 2   | 2   |

En el tercer ciclo del bucle, recalculamos los centros con los grupos de la segunda, volvemos a asignar y nadie cambia de sitio, ahí marcamos la convergencia. E, que empezó en el grupo `2`, ha acabado en el `1` sin que nadie le escriba un prompt para reconsiderar su pertenencia.

El centroide del grupo `1` termina en `(0.75, 0.25)`, y nuestra nueva observación , `(0.78, 0.28)`, cae en ese grupo porque es el centroide más cercano que tiene:

$$
\text{Distancia}^2 = (0.78 - 0.75)^2 + (0.28 - 0.25)^2 = 0.0018
$$

PD: esta vez lo aprendido ya no son el intercepto y la pendiente, sino también las coordenadas de los tres centroides, seis `float64`, el `Predict` compara con esos centros, no necesita recorrer los nueve ejemplos originales ni repetir el entrenamiento cada vez que llega una medición.

## El grupo `2` no significa los que explotan

Podemos mirar el resultado y describir el grupo `0` como bajo consumo de ambos recursos, el `1`, como CPU alta y RAM relativamente baja y el `2`, como consumo alto de ambos recursos.

Esos nombres los ponemos nosotros **después**, el algoritmo no conoce el significado de CPU, no sabe si esa carga es esperable y no ha aprendido si alguno de esos puntos terminó provocando un fallo.

En el artículo lo simplificamos como evento futuro, aquí no, por eso sustituir la regresión logística por K-Means y llamar "fallo" al grupo con más RAM sería incorrecto.

Los índices tampoco tienen un orden de gravedad, con otro arranque, los mismos grupos podrían recibir los números `2`, `0` y `1`, cambiarles el número no cambia qué observaciones están juntas.

Un posible uso de este ejemplo sería resumir las métricas en perfiles y estudiar qué está ejecutándose en cada uno y cpn eso diagnosticar la causa.

## Y si empezamos en otro sitio?

Aquí hay una trampa bastante importante, **converger no significa haber encontrado el mejor agrupamiento posible**, el resultado puede depender de las posiciones iniciales, esto lo podemos leer en la [documentación sobre las limitaciones de K-Means](https://developers.google.com/machine-learning/clustering/kmeans/advantages-disadvantages).

Podemos comprobarlo sin cambiar los datos, simplemente en el `main.go`, sustituye la elección inicial por A, B y C:

```go
initial := []clustering.Point{points[0], points[1], points[2]}
```

Ahora los tres centros empiezan en la misma zona, con nuestro código, la inercia final queda en `0.476250`, aunque `Converged` también sea `true`.

| Posiciones iniciales | Inercia final | Convergió |
| -------------------- | ------------: | --------- |
| A, B y H             |      0.030000 | Sí        |
| A, B y C             |      0.476250 | Sí        |

En el segundo caso se queda separando la zona de poco consumo en dos grupos y juntando las otras dos zonas en uno solo, esol significa que está estable, pero tenemos otro resultado que reduce mucho más la misma función, podrías subir el límite de 100 a 1M de iteraciones y no arreglarías ese arranque, si las asignaciones ya no cambian, repetir las mismas medias no va a encontrar otra solución.

![converger-no-es-encontrar-lo-mejor](https://i.8upload.com/image/0eb3d02d2a9b5427/02-converger-no-es-encontrar-lo-mejor.png)

Una estrategia habitual es probar varias inicializaciones y quedarse con la de menor inercia, **comparando el mismo `k`, los mismos datos y la misma escala**.

Otra es [K-Means++](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html), una forma de elegir los centros iniciales favoreciendo puntos alejados de los ya elegidos, esto mejora el punto de partida pero no garantiza el óptimo global.

Aquí dejamos esa responsabilidad fuera de `Fit` para que el bucle principal siga siendo fácil de leer y comprobar.

## La `K` tampoco la ha descubierto el algoritmo

Hemos elegido tres porque preparamos un ejemplo con tres zonas, con datos reales no siempre vas a tener esa ayuda, siempre podemos probar distintos valores y observar cómo baja la inercia, por ejemplo, el [método del codo](https://developers.google.com/machine-learning/clustering/kmeans/evaluate-results) busca un punto a partir del cual añadir más grupos aporta una reducción bastante menor, es como una orientación, no siempre aparece un codo claro.

Y otra referencia es el [coeficiente de silueta](https://scikit-learn.org/stable/auto_examples/cluster/plot_kmeans_silhouette_analysis.html), que básicamente compara la cercanía de cada punto a su grupo con la cercanía al grupo vecino, esto ayuda a evaluar separación y compacidad, no a demostrar que los grupos tengan el significado que buscamos.

Ojo con elegir `k` mirando solo cuál da la menor inercia, con nueve centros, uno en cada una de nuestras nueve observaciones, podemos obtener cero.

El mínimo posible de esa función no empeora al permitir más centros, una ejecución concreta sí puede salir peor por un mal arranque, por eso es mejor considerar las inicializaciones al comparar.

## La escala vuelve a importar

Ya nos pasó con el descenso de gradiente, pero aquí la escala afecta directamente a **qué puntos consideramos parecidos**.

Imagina que usamos CPU como proporción y RAM en MB, una diferencia de `0.10` en CPU aporta `0.01` a la distancia al cuadrado, mientras que una diferencia de `1000` MB aporta `1000000`, con esto, la segunda característica puede dominar la cuenta simplemente por cómo hemos escrito sus unidades.

Por eso hay que pensar en la [preparación y el escalado de las características](https://developers.google.com/machine-learning/clustering/prepare-data), no pasar cualquier tabla y asumir que la distancia ya representa lo que nos interesa.

Nosotros usamos proporciones para ambos recursos y damos el mismo peso a un cambio de diez puntos porcentuales en CPU que al mismo cambio en RAM y **eso también es una elección**, no una propiedad universal del problema.

En fin, la aproximación que elijas debe mantenerse al predecir, por ejemplo, entrenar con `0.78` y luego pasar `78` no es un pequeño detalle de formato, es importante.

---

Hasta ahora habíamos aprendido a predecir cantidades, ajustar parámetros y estimar probabilidades para clasificar, ahora hemos añadido algo distinto, agrupar observaciones sin tener sus respuestas de antemano.

```text
CPU y RAM → distancias → grupos → medias → repetir
```

Hemos elegido las características, la escala, la cantidad de grupos, el punto de partida y la forma de medir el resultado, el script ha hecho los cálculos y nos ha devuelto una agrupación que podemos inspeccionar.

K-Means se puede utilizar en muchos ámbitos para descubrir grupos de datos que comparten características similares, sin tener que clasificarlos manualmente, casos de uso que veo para esto serían:

- Identificar patrones de tráfico de red y detectar comportamientos poco habituales
- Agrupar clientes según sus hábitos de compra y preferencias
- Identificar productos que tengan patrones de venta similares
- Podemos agrupar transferencias según importes, frecuencias y características
- Identificar usuarios con intereses o comportamientos parecidos
- Reducir la cantidad de colores d euna imagen agrupando colores parecidos

Y muchas más, imagina que tienes un SaaS, sin indicarle qué tipo de usuario es cada uno de los que tienes, con K-Means podrías encontrar tres grupos

- `0`: usuarios que entran ocasionalmente y utilizan pocas funcionalidades
- `1`: usuarios que entran frecuentemente y utilizan varias funcionalidades
- `2`: usuarios muy activos que utilizan prácticamente toda la plataforma

El algoritmo no sabe qué significa ser un usuario ocasional o avanzado, simplemente encuentra similitudes matemáticas entre sus comportamientos, ya nosotros en una interfaz bonita pintamos la interpretación de esos grupos, y no necesitamos IA para que sea capaz de "contextualizar" el comportamineto de los usuarios y nos lo diga.
