---
title: "Regresión lineal en Go: 20 líneas de código o harness de agentes"
description: "Implementamos una regresión lineal en Go, sin dependencias ni agentes de, porque a veces una fórmula matemática resuelve lo que otros solucionarían con 200.000 tokens y una arquitectura multiagente."
published_at: 2026-10-25
author: prinick96
categories:
  - engineering
---

Antes de empezar, ¿qué haremos aquí? exploraremos creo yo que el algoritmo más elemental y simple que podemos hacer para que algo sea "inteligente" o más bien, que una máquina sea capaz de aprender.

Haremos un pequeño script en **Go** para implementar un **algoritmo de regresión lineal simple**, sin dependencias externas, utilizando únicamente la biblioteca estándar, con esto podemos de forma práctica endender, cómo hacer que un software sea capaz de aprender patrones y producir respuestas gracias ello.

Por qué en Go y no en Python? porque me gusta más y ya está, igualmente, esto lo puedes implementar hasta en un Protoboard con compuertas lógicas o quizá menos, si te lo ingenias bien.

## Cómo funciona el algoritmo?

La regresión lineal simple busca una recta que se ajuste lo mejor posible a un conjunto de observaciones, vale que hay que ver algo de matemática pero muy simple la verdad, con sabernos la formula basta:

```
y = b0 + b1*x
```

Esa simple ecuación, dónde, si esto lo usamos para calcular la predicción del precio de una vivienda, cada variable podria ser

- `x`: variable independiente, por ejemplo, metros cuadrados
- `y`: variable dependiente, por ejemplo, el precio de la vivienda, lo que queremos obtener
- `b0`: intercepto, el valor estimado cuando `x = 0`
- `b1`: pendiente, cuánto cambia `y` por cada unidad adicional de la `x`

El algoritmo utiliza el método de mínimos cuadrados ordinarios (OLS), minimizando la suma de los errores al cuadrado entre los valores que se observan y los que se estiman.

## Implementación en Go

Crearemos un paquete reutilizable llamado `regression`

```go

package regression

import (
	"errors"
	"math"
)

type LinearRegression struct {
	Intercept float64
	Slope     float64
}

// Calcula los coeficientes mediante mínimos cuadrados
func Fit(x, y []float64) (*LinearRegression, error) {
	if len(x) != len(y) {
		return nil, errors.New("x e y deben tener la misma longitud")
	}

	if len(x) < 2 {
		return nil, errors.New("se necesitan al menos dos observaciones")
	}

	n := float64(len(x))

	var sumX, sumY float64

	for i := range x {
		sumX += x[i]
		sumY += y[i]
	}

	meanX := sumX / n
	meanY := sumY / n

	var ssXY, ssXX float64

	for i := range x {
		dx := x[i] - meanX
		dy := y[i] - meanY

		ssXY += dx * dy
		ssXX += dx * dx
	}

	if ssXX == 0 {
		return nil, errors.New("x no tiene variación")
	}

	slope := ssXY / ssXX
	intercept := meanY - slope*meanX

	return &LinearRegression{
		Intercept: intercept,
		Slope:     slope,
	}, nil
}

// Estima el valor de y para un valor x.
func (lr *LinearRegression) Predict(x float64) float64 {
	return lr.Intercept + lr.Slope*x
}

// Mide la calidad del ajuste.
// Un valor próximo a 1 indica mejor ajuste.
func (lr *LinearRegression) RSquared(x, y []float64) float64 {
	if len(x) != len(y) || len(y) == 0 {
		return math.NaN()
	}

	var meanY float64
	for _, value := range y {
		meanY += value
	}
	meanY /= float64(len(y))

	var ssTotal, ssResidual float64

	for i := range y {
		prediction := lr.Predict(x[i])

		ssTotal += math.Pow(y[i]-meanY, 2)
		ssResidual += math.Pow(y[i]-prediction, 2)
	}

	if ssTotal == 0 {
		if ssResidual == 0 {
			return 1
		}
		return 0
	}

	return 1 - ssResidual/ssTotal
}
```

Con esta implementación ofrecemos tres operaciones muy básicas:

- `Fit(x, y)` esto entrena al modelo y calcula sus coeficientes
- `Predict(x)` esto predice un resultado utilizando el modelo ya entrenado
- `RSquared(x, y)` calcula el coeficiente de determinación R^2`

PD: si te fijas, solo como dato, para que lo interiorices un poco más, este "aprendizaje" se guarda en memoria ram, por ello `Predict` y `RSquared` son métodos del "objeto" que será el modelo ya entrenado, el entrenamiento con `Fit` nos devuelve ese modelo, no lo sé, pero este tipo de detalles tontos siempre me parecen arte cuando los concibes xd

## Cómo lo usamos?

Veamos algunos ejemplos de caso de uso

### Estimar el precio de una vivienda

Imagina que tenemos los precios históricos de viviendas de una zona y queremos estimar cuánto costaría una vivienda de X metros cuadrados, pues vamos a implementar en Go

```go

package main

import (
	"fmt"

	"github.com/project/regression"
)

func main() {
	// Superficies en metros cuadrados.
	x := []float64{
		50, 65, 80,
		95, 120, 150,
	}

	// Precioss históricos en euros por cada m2
	y := []float64{
		150000, 185000, 220000,
		255000, 310000, 380000,
	}

	// Entrenamos al modelo (vamos a gastar CPU, RAM y Agua)
	model, err := regression.Fit(x, y)
	if err != nil {
		panic(err)
	}

	// Ahora, le pasamos unos m2 que nunca antes ha visto
	price := model.Predict(110)

	fmt.Printf("Precio estimado: %.2f €\n", price)
	fmt.Printf("R2: %.4f\n", model.RSquared(x, y))
}
```

Ejecutando podriamos tener algo como

```
Precio estimado: 288.000 €
R2 ≈ 0,9998.
```

Otra cosita, el R2, es el coeficiente de determinación, básicamente es una métrica que indica qué proporción de la variabilidad de los datos consigue explicar nuestro modelo de regresión lineal, mientras más tienda a 1 es mejor.

Si por ejemplo esto nos da 0.8, explica el 80% de la variabilidad, si nos da 0,0 no mejora la predicción constante basada en la media y si nos da un negativo significa que es peor que predecir siempre la media.

---

Y ya está, hemos enseñado a la máquina a hacer algo, qué esperabas? verdad que no es nada del otro mundo? verdad que has programado cosas más complejas? es simple, esto es una forma muy básica de cómo entrenar modelos.

En el post de [la ia bajo el capó](https://iadev.blog/posts/la-ia-bajo-el-capo/) hablamos de los "pesos", pues en este ejemplo, nuestra estructura de datos

```go
type LinearRegression struct {
	Intercept float64
	Slope     float64
}
```

sería el equivalente a esos famosos pesos de los que tanto se habla cuando se entrenan modelos como GPT, porque esos valores son los parámetros aprendidos durante el entrenamiento.

Ahora veamos otro ejemplo simple:

### Cuánto tardaría un server en explotar por una fuga de memoria?

Imagina que tenemos un proceso en Go con una fuga de memoria, cada minuto registras el consumo de RAM con alguna herramienta y eso te da datos

| Minuto | RAM utilizada |
| :----: | :-----------: |
|   0    |    120 MB     |
|   5    |    175 MB     |
|   10   |    230 MB     |
|   15   |    290 MB     |
|   20   |    345 MB     |
|   25   |    405 MB     |

Con esa info podríamos simplemente reemplazar y predecir cuándo el proceso alcanzrá 1GB de memoria.

```go

package main

import (
	"fmt"

	"example.com/project/regression"
)

func main() {
	// Los datos de la tabla
	minutes := []float64{0, 5, 10, 15, 20, 25}
	memory := []float64{120, 175, 230, 290, 345, 405}

	// Entrenamos el modelo otra vez
	model, err := regression.Fit(minutes, memory)
	if err != nil {
		panic(err)

	// Predecimos ahora el consumo de memoria para minutos que el modelo aun no tiene en su memoria, si notas empezamos desde +30
	futureMinutes = []float64{30, 40, 50, 60, 70, 80, 90}
	for _, minute := range futureMinutes {
		prediction := model.Predict(minute)

		fmt.Printf(
			"Minuto %.0f: %.2f MB\n",
			minute,
			prediction,
		)
	}

	// Calculamos cuándo se alcanzará el límite.
	const memoryLimit = 1024.0 // MB

	// Esto podría pasar
	if model.Slope <= 0 {
		fmt.Println("No se detecta crecimiento de memoria.")
		return
	}

	timeToLimit := (memoryLimit - model.Intercept) / model.Slope

	fmt.Printf("Límite de memoria: %.0f MB\n", memoryLimit)
	fmt.Printf("Tiempo estimado hasta el límite: %.2f minutos\n", timeToLimit)

	// Tiempo restante desde la última observación.
	lastMinute := minutes[len(minutes)-1]
	remainingTime := timeToLimit - lastMinute

	if remainingTime <= 0 {
		fmt.Println("El modelo estima que el límite ya se ha alcanzado.")
	} else {
		fmt.Printf(
			"Tiempo restante desde la última medición: %.2f minutos\n",
			remainingTime,
		)
	}
}
```

El resultado debería ser algo como

```
Minuto 30: 459.86 MB
Minuto 40: 573.86 MB
Minuto 50: 687.86 MB
Minuto 60: 801.86 MB
Minuto 70: 915.86 MB
Minuto 80: 1029.86 MB
Minuto 90: 1143.86 MB

Límite de memoria: 1024 MB
Tiempo estimado hasta el límite: 79.49 minutos
Tiempo restante desde la última medición: 54.49 minutos
```

Y así de simple. Hemos implementado un algoritmo de regresión lineal en unas pocas líneas de Go, sin frameworks de machine learning, sin dependencias de medio internet y lo mejor de todo, **sin necesitar una suscripción de OpenAI que nos explique cómo sumar dos números**.

![regresion-linear-en-go](https://i.8upload.com/image/57a01250d68ab0fb/simplicidad-contra-caos-agentes-en-accio-n.png)

No hemos tenido que resolver integrales, derivadas, ecuaciones diferenciales ni invocar ninguna entidad matemática de otro universo, solo hemos utilizado una fórmula que algún matemático, hace bastante tiempo, tuvo la amabilidad de desarrollar y nosotros como buenos ingenieros, hemos hecho lo que mejor sabemos hacer: **entender el problema, aprovechar el conocimiento existente e implementarlo**.

El resultado es un algoritmo sencillo, comprensible, prácticamente gratuito de ejecutar y con un potencial enorme para resolver problemas reales.

Así que la próxima vez que necesites hacer una predicción sencilla, quizá no sea necesario montar un _harness_ con 999 agentes de IA, cada uno con su correspondiente archivo `.md` de 800 líneas explicándole que es un ingeniero sénior con 30 años de experiencia, experto en estadística bayesiana, arquitectura hexagonal y liderazgo de equipos multidisciplinares.

Tampoco hace falta que un agente planificador convoque a tres subagentes investigadores, que estos deleguen en otros cinco agentes especializados y que, después de consumir 200.000 tokens y unos cuantos dólares por petición, un agente revisor concluya que la mejor solución es instalar una dependencia de Python que, por debajo, hace exactamente lo que acabamos de implementar.

> A veces, la solución no necesita más inteligencia artificial, necesita un poco más de inteligencia real y junto con algo de ingeniería.

Pero bueno, siempre puedes preguntarle a tu agente si está de acuerdo, seguramente te responda que es una reflexión excelente, que tienes toda la razón y que le encantaría ayudarte a diseñar una arquitectura multiagente para evitar que vuelva a suceder.
