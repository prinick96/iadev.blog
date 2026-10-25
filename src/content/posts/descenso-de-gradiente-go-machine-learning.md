---
title: "Descenso de gradiente en Go: eseñar no make mistake a un modelo"
description: "Implementamos descenso de gradiente en Go, sin dependencias, para ver cómo una máquina ajusta sus parámetros y reduce el error. Porque aprender de los errores es algo más que escribirle al agente: sigue estando mal."
published_at: 2026-10-25
author: prinick96
categories:
  - engineering
  - machine-learning
---

En el [post anterior](https://iadev.blog/posts/regresion-lineal-go-o-harness-de-agentes/) implementamos una regresión lineal en Go, calculamos dos números y con eso pudimos estimar el precio de una vivienda o cuándo un servidor iba a explotar por quedarse sin RAM, todo bastante sencillo.

Pero hubo una parte que resolvimos muy rápido: el entrenamiento, le pasamos los datos a una fórmula de mínimos cuadrados y nos devolvió los coeficientes. Funciona, pero es posible te hayas quedado con la duda de dónde está eso que hablamos en el post de [la ia bajo el capo](http://localhost:4321/posts/la-ia-bajo-el-capo/), sobre que que una IA se equivoca, corrige sus pesos y vuelve a intentarlo.

En este post, vamos a ver justamente eso, empezaremos con un modelo que responde como el culo, luego mediremos cuánto se equivoca y ajustaremos sus parámetros hasta que aprenda a responder mejor.

Como el código lo estoy haciendo yo, pues vamos a seguir en Go.

## Qué cambia respecto al post anterior?

La recta sigue siendo esta:

```text
y = b0 + b1 * x
```

`b0` es el intercepto y `b1` la pendiente, lo que cambia no es el modelo, sino cómo encontramos esos dos valores: antes los calculábamos directamente y ahora vamos a ir corrigiéndolos poco a poco...

Una cosita importante: **el descenso de gradiente no sustituye a la regresión lineal, es una manera de entrenarla**. Podemos buscar el mismo ajuste por mínimos cuadrados utilizando una solución directa o un procedimiento iterativo, no estamos inventando una regresión más inteligente por meterle un bucle.

De hecho, si en la vida real tenemos un problema pequeño como los del post anterior, yo seguiría usando la fórmula, porque es simple y funciona, la gracia de hacerlo así es entender un mecanismo que también sirve para entrenar modelos donde no tenemos una solución directa tan cómoda.

## Primero hay que saber cuánto nos equivocamos

Vamos a empezar con unos datos inventados a propósito para que el resultado sea fácil de comprobar:

```text
x = [1, 2, 3, 4, 5]
y = [3, 5, 7, 9, 11]
```

Si ves `y` fácilmente puedes ver el patrón que sigue la relación `y = 1 + 2*x`, y nosotros lo sabemos porque hemos preparado los datos y sí somos capaces de pensar xd, al entrenamiento solo le vamos a pasar esas observaciones, no los valores `1` y `2` que queremos que encuentre, me explico?

Si inicializamos los dos parámetros a cero, la predicción será cero para cualquier entrada y tendríamos una máquina que se equivoca a cada rato.

Ahora necesitamos convertir ese desastre en un número, para ello utilizaremos el **error cuadrático medio**, o **MSE**: calculamos la resta entre cada predicción y su valor real, después la elevamos al cuadrado y hacemos la media, es sencillo.

![medir-el-error-machine-learning](https://i.8upload.com/image/0c989dd1095e901c/01-medir-el-error.png)

Así los errores positivos y negativos no se cancelan y los errores grandes pesan más, te puedes [revisar esto](https://developers.google.com/machine-learning/crash-course/linear-regression/loss?hl=es-419)

La cosa sería:

```text
error_i = predicción_i - valor_real_i

MSE = (error_1^2 + error_2^2 + ... + error_n^2) / n
```

Con todas las predicciones a cero:

```text
MSE = (3^2 + 5^2 + 7^2 + 9^2 + 11^2) / 5
MSE = 57
```

Ese será nuestro punto de partida, con esto tenemos una medida concreta de lo mal que está ajustando estos datos.

## Y cómo sabe hacia dónde corregir?

Aquí aparece el gradiente, la implemetación también es sencilla, nada del otro mundo.

Tenemos una pérdida que depende de dos parámetros, sus derivadas nos dicen cómo cambia esa pérdida al mover un poquito cada uno, el gradiente reúne esas derivadas y apunta hacia el crecimiento local de la pérdida, en cambio nosotros avanzaremos en la dirección contraria, con un pasito pequeño, no es probar números al azar hasta que alguno quede bonito.

En el post anterior solo hicimos algo de primaria, ahora tenemos que usar derivadas (sí, estas son cosas que se ven en ingeniería informática y luego muchos dicen, en mi vida lo usasré) [cómo derivar x](https://fisicaymates.com/derivadas/)

Para nuestra recta y nuestro MSE, las cuentas quedan así:

```text
error_i = (b0 + b1*x_i) - y_i

gradiente_b0 = (2 / n) * suma(error_i)
gradiente_b1 = (2 / n) * suma(error_i * x_i)
```

El `2` sale de derivar el cuadrado, `la derivada de x^2 es 2x`, en el segundo gradiente aparece también `x_i` porque estamos derivando respecto a la pendiente, que está multiplicada por esa entrada, son las derivadas del mismo error que acabamos de definir.

Después actualizamos:

```text
b0_nuevo = b0 - learningRate * gradiente_b0
b1_nuevo = b1 - learningRate * gradiente_b1
```

`learningRate` es la tasa de aprendizaje, el factor con el que ajustamos el tamaño del paso **calculamos ambos gradientes con los parámetros actuales y después actualizamos los dos**.

Ahora vamos a ver una vuelta con nuestros datos, empezando en cero, los gradientes son `-14` y `-50`

Si usamos una tasa de `0.01`:

```text
b0_nuevo = 0 - 0.01 * (-14) = 0.14
b1_nuevo = 0 - 0.01 * (-50) = 0.50
```

La nueva recta es `y = 0.14 + 0.50*x`. Su MSE ya no es `57`, sino `33.2296`.

Todavía responde bastante mal, pero menos mal que antes, **ESA es la idea**: repetir una corrección que hemos calculado.

![corregir-no-es-adivinar](https://i.8upload.com/image/3f15c8abda10a92c/02-un-paso-de-gradiente.png)

## Implementación en Go

Creamos `regression/gradient.go`, conservamos la struct `LinearRegression` del post anterior, añadimos una función para medir el error y otra para entrenar mediante descenso de gradiente.

```go
package regression

import (
	"fmt"
	"math"
)

// si estamos en el mismo package del anterior post no hay que volver a defnir esto
type LinearRegression struct {
	Intercept float64
	Slope     float64
}

// si estamos en el mismo package del anterior post no hay que volver a defnir esto
func (lr *LinearRegression) Predict(x float64) float64 {
	return lr.Intercept + lr.Slope*x
}

// MSE calcula el error cuadrático medio, esto es lo nuevo
func (lr *LinearRegression) MSE(x, y []float64) float64 {
	if len(x) != len(y) || len(x) == 0 {
		return math.NaN()
	}

	// esto es todo, un bucle de predicciones
	var total float64
	for i := range x {
		residual := lr.Predict(x[i]) - y[i]
		total += residual * residual
	}

	return total / float64(len(x))
}

// FitGradientDescent entrena usando todos los datos en cada actualización.
// history[0] contiene el MSE inicial; history[k], el MSE tras k actualizaciones.
func FitGradientDescent(
	x, y []float64,
	learningRate float64,
	epochs int,
) (*LinearRegression, []float64, error) {
	if len(x) != len(y) || len(x) < 2 {
		return nil, nil, fmt.Errorf("se necesitan al menos dos pares de datos")
	}

	if learningRate <= 0 {
		return nil, nil, fmt.Errorf("learningRate debe ser positivo")
	}

	if epochs <= 0 {
		return nil, nil, fmt.Errorf("epochs debe ser mayor que cero")
	}

	var hasVariation bool
	for i := range x {
		if x[i] != x[0] {
			hasVariation = true
		}
	}

	if !hasVariation {
		return nil, nil, fmt.Errorf("x no tiene variación")
	}

	model := &LinearRegression{} // Los dos parámetros empiezan en cero, conceptos básicos de Go
	loss := model.MSE(x, y)

	history := []float64{loss}
	n := float64(len(x))

	for epoch := 0; epoch < epochs; epoch++ {
		var gradientIntercept, gradientSlope float64

		for i := range x {
			residual := model.Predict(x[i]) - y[i]
			gradientIntercept += residual
			gradientSlope += residual * x[i]
		}

		gradientIntercept *= 2 / n
		gradientSlope *= 2 / n

		// Ambos gradientes usan los mismos parámetros, antes de actualizarlos
		model.Intercept -= learningRate * gradientIntercept
		model.Slope -= learningRate * gradientSlope

		loss = model.MSE(x, y)
		history = append(history, loss)
	}

	return model, history, nil
}
```

Hay más validaciones que misterio en este script, también rechazamos una `x` constante: sin variación no podemos identificar de forma única la pendiente y el intercepto por separado.

Lo importante está dentro del bucle: predecir, calcular los errores, acumular los gradientes y actualizar los parámetros.
El segundo recorrido calcula la pérdida **después** de esa actualización, para que el historial muestre el resultado del paso que acabamos de dar.

Cada vuelta usa todos los ejemplos antes de actualizar, esto es descenso de gradiente por lote completo, o _batch gradient descent_. Un **epoch** es una pasada por todos los datos, aquí coincide con una actualización, aunque con mini-lotes habría varias actualizaciones dentro del mismo epoch.

PD: el historial no forma parte de lo que el modelo ha aprendido, simplemente lo guardamos para mirar cómo evoluciona el entrenamiento, lo aprendido sigue estando en los dos `float64` de la estructura, tal como en el post anterior.

## Cómo lo usamos?

Otra vez desde un `main.go`

```go
package main

import (
	"fmt"
	"log"

	"github.com/project/regression"
)

func main() {
	x := []float64{1, 2, 3, 4, 5}
	y := []float64{3, 5, 7, 9, 11}

	model, history, err := regression.FitGradientDescent(x, y, 0.01, 5000)
	if err != nil {
		log.Fatal(err)
	}

	for _, epoch := range []int{0, 1, 10, 100, 1000, 5000} {
		fmt.Printf("Epoch %4d | MSE: %.8g\n", epoch, history[epoch])
	}

	fmt.Printf("\nIntercepto: %.6f\n", model.Intercept)
	fmt.Printf("Pendiente: %.6f\n", model.Slope)
	fmt.Printf("Predicción para x = 6: %.6f\n", model.Predict(6))
}
```

El resultado es este, los últimos decimales pueden variar ligeramente entre plataformas:

```text
Epoch    0 | MSE: 57
Epoch    1 | MSE: 33.2296
Epoch   10 | MSE: 0.2865032
Epoch  100 | MSE: 0.015866292
Epoch 1000 | MSE: 3.5727093e-05
Epoch 5000 | MSE: 6.1154694e-17

Intercepto: 1.000000
Pendiente: 2.000000
Predicción para x = 6: 13.000000
```

Fíjate en el Epoch cero: todavía no hemos actualizado nada y el error es `57`, exactamente lo que calculamos antes, después de la primera actualización aparece `33.2296`, y luego sigue bajando hasta quedar muy cerca de cero.

Y los parámetros terminan muy cerca de `1` y `2`, aunque al imprimir seis decimales parezcan exactos, hemos recuperado la recta con la que construimos los datos sin escribir esos coeficientes dentro del entrenamiento :)

Cuando preguntamos por `x = 6`, el modelo aplica la recta aprendida y devuelve aproximadamente `13`, no busca el seis en una tabla, ni necesita repetir las 5.000 epoch ahora para contestar, en nuestro código, predecir sigue siendo una multiplicación y una suma, ya está.

## La tasa de aprendizaje: no aprende mas rapido si la subimos

Puede que estés pensando: si con `0.01` aprende, con `0.1` aprenderá 10 veces más rápido, como cuando crees que 999 agentes en vez de 1 te darán un mejor proyecto solo vibecodeando; pues NO necesariamente.

Una tasa demasiado pequeña puede hacer que el entrenamiento avance muy despacio y una demasiado grande puede hacer que nos pasemos del mínimo, oscilemos o terminemos alejándonos cada vez más, no hay un valor universal que funcione para cualquier problema

Con los mismos datos, empezando siempre desde cero y ejecutando **100 epoch**, obtenemos:

| Tasa de aprendizaje | MSE tras 100 epochs |
| ------------------- | ------------------: |
| `0.0001`            |         `35.501628` |
| `0.01`              |       `0.015866292` |
| `0.1`               |     `7.2091046e+28` |

Puedes reproducirlo cambiando la tasa y el número de epochs en la llamada a `FitGradientDescent`, la última fila no es una error raro, simplemente hemos conseguido que un modelo que empezaba bastante mal termine brutalmente peor xD todo eso de forma completamente autónoma.

Otra diferencia útil: la pendiente y el intercepto son **parámetros**, los ajusta el entrenamiento, la tasa y el número de epochs son **hiperparámetros**, los configuramos nosotros en este ejemplo.

![tasa-de-aprendizaje](https://i.8upload.com/image/d60a20e0028d2a19/03-tasa-de-aprendizaje.png)

## Volvamos al ejemplo del server que se quedaba sin RAM

Supongamos que seguimos sin arreglarle la fuga al server, pero ahora vamos a entrenar otra vez para predecir su consumo.

Hay un detalle antes: la escala de las entradas influye en el entrenamiento, transformarlas a una escala más manejable puede facilitar la convergencia y si aplicamos una transformación al entrenar, tenemos que aplicar **la misma al predecir**, esto es una especie de normalización.

Aquí haremos algo muy simple, es expresar el tiempo en bloques de cinco minutos, los valores `0, 5, 10, 15, 20, 25` en vez de `0, 1, 2, 3, 4, 5`
en el bucle

Sustituimos el contenido del `main.go` por esto:

```go
package main

import (
	"fmt"
	"log"

	"example.com/gradient/regression"
)

func main() {
	minutes := []float64{0, 5, 10, 15, 20, 25}
	memory := []float64{120, 175, 230, 290, 345, 405}

	// Entrenamos en bloques de cinco minutos, no en minutos
	const timeScale = 5.0
	x := make([]float64, len(minutes))
	for i, minute := range minutes {
		x[i] = minute / timeScale
	}

	model, history, err := regression.FitGradientDescent(x, memory, 0.01, 5000)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("MSE inicial: %.4f\n", history[0])
	fmt.Printf("MSE final: %.4f\n", history[len(history)-1])
	fmt.Printf("RAM inicial estimada: %.2f MB\n", model.Intercept)
	fmt.Printf("Crecimiento: %.2f MB/min\n", model.Slope/timeScale)

	// La predicción debe usar la misma escala que el entrenamiento
	fmt.Printf("RAM estimada en el minuto 30: %.2f MB\n", model.Predict(30/timeScale))
}
```

Ahora obtenemos

```text
MSE inicial: 77512.5000
MSE final: 2.2222
RAM inicial estimada: 118.33 MB
Crecimiento: 11.40 MB/min
RAM estimada en el minuto 30: 460.33 MB
```

Con estos datos, la recta ajustada en minutos queda aproximadamente así:

```text
RAM = 118.33 + 11.40 * minutos
```

Ojo con la pendiente: el modelo entrenado tiene una pendiente cercana a `57` MB **por bloque de cinco minutos**, al dividirla entre cinco obtenemos los `11.40` MB por minuto y para preguntarle por el minuto treinta le pasamos `30 / 5`, no `30`, recuerda que hay que dividir entre 5 porque alteramos los minutosa a bloques de 5 en 5.

Esta vez el error no llega a cero porque nuestras observaciones no están exactamente sobre una recta. Hemos reducido el MSE desde `77512.5` hasta aproximadamente `2.2222`, que es el mínimo por mínimos cuadrados para estos datos, el MSE está en MB al cuadrado, no significa que nos equivoquemos una media de `2.22` MB.

Más epochs no van a hacer que una recta pase exactamente por puntos que no están alineados, y predecir el minuto treinta sigue siendo extrapolar fuera del intervalo que observamos porque stamos suponiendo que la tendencia continúa.

## Y si hacemos un test, en vez de tener FE de que funciona?

Para comprobar el primer ejemplo podemos crear `regression/gradient_test.go`:

```go
package regression

import (
	"math"
	"testing"
)

func TestFitGradientDescent(t *testing.T) {
	x := []float64{1, 2, 3, 4, 5}
	y := []float64{3, 5, 7, 9, 11}

	model, history, err := FitGradientDescent(x, y, 0.01, 5000)
	if err != nil {
		t.Fatal(err)
	}

	if math.Abs(model.Intercept-1) > 1e-6 || math.Abs(model.Slope-2) > 1e-6 {
		t.Fatalf("coeficientes inesperados: %+v", model)
	}
	if math.Abs(model.Predict(6)-13) > 1e-6 {
		t.Fatalf("predicción inesperada: %v", model.Predict(6))
	}
	if len(history) != 5001 || history[len(history)-1] >= history[0] {
		t.Fatal("historial de pérdida incorrecto")
	}
}
```

Y ejecutarlo:

```bash
go test ./...
```

La tolerancia es necesaria para evitar que el test falle por querer exigir igualdad exacta a unos coeficientes obtenidos mediante los floats, la idea del test es comprobar que la implementación recupera una relación conocida, que predice lo esperado y que el error final es menor que el inicial.

## Entonces, esto es lo que pasa al entrenar una red neuronal?

Hay una idea compartida: hacer predicciones, calcular una pérdida, obtener gradientes y utilizar un optimizador para ajustar los parámetros, pero no, no acabamos de construir un modelo de lenguaje con dos campos en una struct.

En una red neuronal, la retropropagación, o _backpropagation_, permite calcular los gradientes recorriendo las operaciones hacia atrás y aplicando la regla de la cadena, el optimizador utiliza después esos gradientes para actualizar los parámetros. **Calcular los gradientes y actualizar los parámetros son cosas distintas**, aunque formen parte del mismo entrenamiento, vamos que son cosas mas serias esto sigue siendo algo simple, porque tanto tu como yo lo podemos entender.

Nosotros hemos escrito las dos derivadas a mano porque caben en dos líneas, en una red hay muchas más operaciones y parámetros, pero ya puedes reconocer qué papel tiene cada parte sin imaginar una GLaDOS reflexionando sobre sus errores.

Otra cosa, cuuando aquí digo que la máquina "aprende de sus errores", estamos describiendo una actualización numérica, no ha descubierto qué es una fuga de memoria, no ha reescrito el programa y no ha decidido qué objetivo le conviene perseguir, nosotros hemos elegido el modelo, los datos y lo que cuenta como error.

---

Y ya está. Esta vez hemos visto el entrenamiento por dentro: un modelo que empieza respondiendo mal, una función que mide cuánto se equivoca y unas actualizaciones que, con una configuración adecuada, reducen ese error, creo que no soy capaz de simplifircarlo más.

A mí esta parte me parece bastante más interesante que envolverlo todo en una caja que pone «IA», puedes mirar los valores, ejecutar una sola iteración y entender exactamente por qué la siguiente predicción es diferente.
