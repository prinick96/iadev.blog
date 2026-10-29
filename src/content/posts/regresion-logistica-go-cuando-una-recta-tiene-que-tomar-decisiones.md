---
title: "Regresión logística en Go: cuando una recta tiene que tomar decisiones"
description: "Pasamos de predecir números a clasificar resultados con una sigmoide, porque tomar una decisión no requiere de una LLM, sino una probabilidad y un if."
published_at: 2026-10-26
author: prinick96
categories:
  - engineering
  - machine-learning
---

En el [primer post](https://iadev.blog/posts/regresion-lineal-go-o-harness-de-agentes/) vimos como predecir números con la ecuación de una recta, y en el [anterior](https://iadev.blog/posts/descenso-de-gradiente-go-machine-learning/) vimos cómo ajustar sus parámetros mediante descenso de gradiente, equivocándonos y corrigiendo poco a poco.

Hemos seguido con el ejemplo del server que consume RAM, hasta ahora preguntábamos cuánta RAM iba a consumir, ahora cambiaremos la pregunta por: **se va a quedar sin memoria en los próximos cinco minutos, sí o no?**

Eso ya no es estimar una cantidad, es clasificar un resultado, vamos a hacerlo con regresión logística, una función llamada **sigmoide** y el descenso de gradiente que ya conocemos, obviamente seguimos implementando en Go.

## Ahora la respuesta tiene dos clases

Antes nuestra `y` podía ser una cantidad de algo, ahora, tomando el ejemplo del server que se queda sin memoria, vamos a representar dos resultados:

```text
y = 0 → el proceso no se quedó sin memoria en los siguientes cinco minutos
y = 1 → el proceso sí se quedó sin memoria en los siguientes cinco minutos
```

Esto es **clasificación binaria**: El `1` es la clase positiva, lo vemos como `true`, pero positivo no significa bueno, significa que ocurrió el evento que queremos detectar, que se caiga producción sigue siendo una mierda, aunque estadísticamente sea positivo.

Nuestra entrada `x` será la proporción de RAM utilizada respecto al límite del proceso, un `0.60` significa que estaba usando el 60 %, no 60 MB ni el número `60`, esto ya lo menicionamos en el post anterior.

Hagamos ahora una tabla con datos inventados, basados en la nueva regla para `y`

| RAM utilizada (x) | ¿Se quedó sin memoria después? (y) |
| ----------------- | ---------------------------------: |
| 10 %              |                                  0 |
| 20 %              |                                  0 |
| 30 %              |                                  0 |
| 40 %              |                                  0 |
| 50 %              |                                  0 |
| 60 %              |                                  1 |
| 65 %              |                                  0 |
| 70 %              |                                  1 |
| 75 %              |                                  0 |
| 80 %              |                                  1 |
| 90 %              |                                  1 |
| 95 %              |                                  1 |

Mira que hemos puesto que falle al 60% y luego el 65% no fallo hasta el 75%, esto podria significar que justo se liberó memoria y luego se volvió a llenar por algo que desconocemos, es algo que nos estamos inventando pero que podría suceder realmente.

Con esta tabla, la tendencia que hemos preparado es que, cuanto más lleno está, más probable es el fallo pero no hemos dibujado una frontera perfecta todavia y la etiqueta se obtiene mirando lo que ocurrió después.

Al predecir solo conocemos la RAM actual, no podemos pasarle también si acabó fallando, porque eso no sería predecir, sería leer el resultado con pasos adicionales.

## La ecuación de la recta sigue existiendo

Es la misma, solo que el resultado es `z` en vez de `y`, pero sigue siendo la ecuación de una recta, esto es porque `z` no es la predicción que queremos devolver.

```text
z = b0 + b1 * x
```

Una recta puede darnos `-3`, `0.8` o `7`. Eso sirve para muchas cosas, pero si queremos una probabilidad no podemos decir que el servidor tiene un 700 % de posibilidades de explotar.

Necesitamos transformar ese resultado en un valor entre cero y uno, para poder tener la tabla real que armamos arriba, y es aquí donde entra la `sigmoide`.

## La sigmoide: doblar la recta

La [función sigmoide logística](https://developers.google.com/machine-learning/crash-course/logistic-regression/sigmoid-function) tiene esta forma:

```text
sigmoid(z) = 1 / (1 + e^(-z))

p = sigmoid(b0 + b1 * x)
```

La `e` de Euler es una constante matemática, vale aproximadamente `2.71828`. En Go calcularemos la exponencial con `math.Exp`, no hace falta escribirla a mano.

Podemos comprobar algunos valores:

| `z` | `sigmoid(z)` | Porcentaje aproximado |
| --: | -----------: | --------------------: |
|  -2 |       0.1192 |               11.92 % |
|   0 |       0.5000 |               50.00 % |
|   2 |       0.8808 |               88.08 % |

Su gráfica tiene forma de S, los valores muy negativos se acercan a cero, los muy positivos se acercan a uno y el cero se convierte en `0.5`. Matemáticamente no llega a los extremos de la S con una entrada finita, en un `float64` sí podemos obtener `0` o `1` por redondeo.

Interpretamos `p` como la **probabilidad estimada de que de 1 con la entrada**, escrito de forma más formal:

```text
p = P(y = 1 | x)
```

La barra se lee "dado": probabilidad de fallo dada esa proporción de RAM, todavía no es el valor final, primero estamos estimando una probabilidad y después decidiremos qué hacer con el.

Y sí, se llama regresión logística aunque aquí la utilicemos para clasificar, quédate con lo que hace, no con que alguien haya decidido ponerle un nombre que parece de otro capítulo xd

## Cómo medimos si se está equivocando?

En el post anterior utilizamos el MSE. Ahora vamos a usar **entropía cruzada binaria**, también llamada _binary cross-entropy_ o _log loss_, que es la pérdida habitual para este modelo.

La [fórmula completa](https://developers.google.com/machine-learning/crash-course/logistic-regression/loss-regularization) para una observación es:

```text
loss = -[y * ln(p) + (1 - y) * ln(1 - p)]
```

`ln` es el logaritmo natural, la formula parece más grande de lo que es, porque `y` solo puede valer cero o uno, entonces sustituyendo uno de los dos términos desaparece:

```text
Si y = 1: loss = -ln(p)
Si y = 0: loss = -ln(1 - p)
```

Si el server terminó fallando, queremos que el modelo le hubiese asignado una probabilidad alta de fallo, con `y = 1`:

```text
p = 0.9 → loss ≈ 0.105361
p = 0.5 → loss ≈ 0.693147
p = 0.1 → loss ≈ 2.302585
```

Equivocarse estando muy convencido sale más caro, si el resultado real era cero, ocurre lo contrario: una probabilidad de fallo cercana a uno recibe una penalización grande.

Para todo el conjunto hacemos la media de esas pérdidas, no es un porcentaje de errores ni una cantidad de MB, es el número que vamos a intentar reducir durante el entrenamiento.

También podríamos calcular un error cuadrático entre probabilidades y etiquetas, pero aquí simplemente vamos a entrenar con log loss, y las derivadas tienen que corresponder a **esa** función.

## El descenso de gradiente

La mecánica no cambia: hacemos predicciones, calculamos los gradientes y movemos los parámetros en la dirección contraria, esto ya lo tenemos del post anterior.

Para la combinación de sigmoide y entropía cruzada, las cuentas quedan así:

```text
p_i = sigmoid(b0 + b1 * x_i)
error_i = p_i - y_i

gradiente_b0 = suma(error_i) / n
gradiente_b1 = suma(error_i * x_i) / n

b0_nuevo = b0 - learningRate * gradiente_b0
b1_nuevo = b1 - learningRate * gradiente_b1
```

Se parece muchísimo a lo anterior, pero ahora el error utiliza una probabilidad y no aparece el factor `2` del MSE.

Y no, no nos hemos olvidado de derivar la sigmoide, la derivada es sencilla, básicamente:

```text
dloss/dp = (p - y) / [p * (1 - p)]
dp/dz    = p * (1 - p)

dloss/dz = p - y
```

Los factores se cancelan, después, derivar `z` respecto a `b0` da `1` y respecto a `b1` da `x`. De ahí salen los dos gradientes; no hay que multiplicar otra vez por la derivada de la sigmoide.

Si empezamos con ambos parámetros a cero, como en el post anterior, todas las entradas producen `z = 0` y por tanto `p = 0.5`.

Da igual la etiqueta: la pérdida inicial es `-ln(0.5)`, aproximadamente `0.693147`.

Con los doce datos de nuestra tabla, los primeros gradientes son:

```text
gradiente_b0 ≈  0.083333
gradiente_b1 = -0.043750
```

Usando una tasa de `0.5`, la primera actualización deja:

```text
b0 ≈ -0.041667
b1 =  0.021875

Log loss antes   ≈ 0.693147
Log loss después ≈ 0.688828
```

Todavía no tenemos un modelo que sirva para mucho, pero ya podemos ver qué ha cambiado y por qué, todavía no le hemos escrito "revisa tu respuesta", hemos calculado una corrección concreta.

## Implementación en Go

Añadimos `regression/logistic.go`. Esta vez creamos una estructura distinta, `LogisticRegression`, para no confundir una predicción de MB con una probabilidad.

Si sigues en el proyecto de los artículos anteriores, puedes añadir el archivo a tu paquete `regression` y usar la ruta de tu módulo en el import del `main.go`.

Esto sería `regression/logistic.go`:

```go
package regression

import (
	"fmt"
	"math"
)

type LogisticRegression struct {
	Intercept float64
	Slope     float64
}

func finite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}

// Las dos ramas calculan la misma sigmoide sin exponenciales enormes.
func sigmoid(z float64) float64 {
	if z >= 0 {
		return 1 / (1 + math.Exp(-z))
	}

	e := math.Exp(z)
	return e / (1 + e)
}

// PredictProbability estima P(y = 1 | x). Devuelve NaN ante un cálculo no finito.
func (lr *LogisticRegression) PredictProbability(x float64) float64 {
	z := lr.Intercept + lr.Slope*x
	if !finite(x) || !finite(z) {
		return math.NaN()
	}

	return sigmoid(z)
}

// Predict convierte la probabilidad en una clase con el umbral indicado.
func (lr *LogisticRegression) Predict(x, threshold float64) (int, error) {
	if !finite(threshold) || threshold <= 0 || threshold >= 1 {
		return 0, fmt.Errorf("threshold debe estar entre 0 y 1, sin incluirlos")
	}

	p := lr.PredictProbability(x)
	if !finite(p) {
		return 0, fmt.Errorf("la predicción no es finita")
	}

	if p >= threshold {
		return 1, nil
	}

	return 0, nil
}

// LogLoss calcula la entropía cruzada binaria media desde z, no desde log(p).
// Devuelve NaN si los datos o el cálculo no son válidos.
func (lr *LogisticRegression) LogLoss(x, y []float64) float64 {
	if len(x) != len(y) || len(x) == 0 {
		return math.NaN()
	}

	var total float64
	for i := range x {
		z := lr.Intercept + lr.Slope*x[i]
		if !finite(x[i]) || !finite(z) || (y[i] != 0 && y[i] != 1) {
			return math.NaN()
		}

		total += math.Max(z, 0) - y[i]*z + math.Log1p(math.Exp(-math.Abs(z)))
	}

	if !finite(total) {
		return math.NaN()
	}

	return total / float64(len(x))
}

// FitLogistic entrena por lote completo. history[0] es la pérdida inicial.
func FitLogistic(
	x, y []float64,
	learningRate float64,
	epochs int,
) (*LogisticRegression, []float64, error) {
	if len(x) != len(y) || len(x) < 2 {
		return nil, nil, fmt.Errorf("se necesitan al menos dos pares de datos")
	}

	if !finite(learningRate) || learningRate <= 0 || epochs <= 0 {
		return nil, nil, fmt.Errorf("learningRate debe ser finito y positivo; epochs, positivo")
	}

	var hasZero, hasOne, hasVariation bool
	for i := range x {
		if !finite(x[i]) || (y[i] != 0 && y[i] != 1) {
			return nil, nil, fmt.Errorf("dato %d inválido: x debe ser finito e y debe ser 0 o 1", i)
		}

		hasZero = hasZero || y[i] == 0
		hasOne = hasOne || y[i] == 1
		hasVariation = hasVariation || x[i] != x[0]
	}

	if !hasZero || !hasOne || !hasVariation {
		return nil, nil, fmt.Errorf("este ejemplo requiere las dos clases y variación en x")
	}

	model := &LogisticRegression{}
	history := []float64{model.LogLoss(x, y)}
	n := float64(len(x))

	for epoch := 0; epoch < epochs; epoch++ {
		var gradientIntercept, gradientSlope float64
		for i := range x {
			residual := model.PredictProbability(x[i]) - y[i]
			gradientIntercept += residual
			gradientSlope += residual * x[i]
		}

		// Los dos gradientes usan los parámetros ANTES de esta actualización
		model.Intercept -= learningRate * (gradientIntercept / n)
		model.Slope -= learningRate * (gradientSlope / n)

		loss := model.LogLoss(x, y)
		if !finite(loss) {
			return nil, nil, fmt.Errorf("cálculo no finito en epoch %d: revisa la tasa y la escala", epoch+1)
		}
		history = append(history, loss)
	}

	return model, history, nil
}
```

`FitLogistic` entrena y devuelve el modelo junto con el historial.
`PredictProbability` devuelve una probabilidad y `Predict` la convierte en una clase utilizando el umbral que le pasemos.

Son operaciones diferentes a propósito.

En esta implementación rechazamos entradas infinitas, etiquetas que no sean cero o uno, una `x` constante y conjuntos que no contengan las dos clases.

Otra vez calculamos los dos gradientes antes de tocar los parámetros y usamos todos los datos en cada actualización, también medimos la pérdida **después** de actualizar, por eso `history[1]` describe el resultado del primer paso y `history[0]` el modelo sin entrenar.

### Ese `Log1p` no estaba en la fórmula

Un detalle importante de implementación: en la explicación hemos usado `ln(p)` y `ln(1 - p)`, pero en el código calculamos la pérdida directamente desde `z`.

Si por redondeo la probabilidad llega a cero o uno, la expresión literal puede terminar evaluando `log(0)` y generando infinitos o `NaN`. Para evitarlo usamos esta [forma equivalente y numéricamente estable](https://www.tensorflow.org/api_docs/python/tf/nn/sigmoid_cross_entropy_with_logits):

```text
loss = max(z, 0) - y*z + ln(1 + exp(-abs(z)))
```

[`math.Log1p(v)`](https://pkg.go.dev/math#Log1p) calcula `ln(1 + v)` con más precisión cuando `v` está cerca de cero. Las dos ramas de `sigmoid` también evitan pedir exponenciales enormes, la operación matemática es la misma, cambia cómo la calculamos.

> Sí, el enlace de la fórmula es documentación de TensorFlow, consultar cómo se calcula algo no te obliga a instalarlo.

## Cómo lo usamos?

En nuestro `main.go` los datos de entrenamiento son los de la tabla y creamos otros ejemplos inventados para comprobar qué hace el modelo con observaciones que no ha utilizado para ajustar sus parámetros.

```go
package main

import (
	"fmt"
	"log"

	"example.com/logistica/regression"
)

func main() {
	// Consumo de RAM en %
	x := []float64{0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.65, 0.70, 0.75, 0.80, 0.90, 0.95}
	y := []float64{0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1}

	model, history, err := regression.FitLogistic(x, y, 0.5, 10000)
	if err != nil {
		log.Fatal(err)
	}

	for _, epoch := range []int{0, 1, 10, 100, 1000, 10000} {
		fmt.Printf("Epoch %5d | Log loss: %.6f\n", epoch, history[epoch])
	}
	fmt.Printf("\nIntercepto: %.6f\n", model.Intercept)
	fmt.Printf("Pendiente: %.6f\n", model.Slope)

	const threshold = 0.5
	fmt.Printf("\nUmbral: %.2f\n", threshold)
	for _, ram := range []float64{0.20, 0.50, 0.70, 0.90} {
		class, err := model.Predict(ram, threshold)
		if err != nil {
			log.Fatal(err)
		}

		fmt.Printf("RAM: %.0f %% | P(fallo): %.2f %% | Clase: %d\n",
			ram*100, model.PredictProbability(ram)*100, class)
	}

	// Datos inventados aparte: no se pasan a FitLogistic porque no son para entrenar
	xTest := []float64{0.15, 0.35, 0.55, 0.72, 0.85, 0.92}
	yTest := []float64{0, 0, 1, 0, 1, 1}
	var tp, tn, fp, fn int
	for i, ram := range xTest {
		class, err := model.Predict(ram, threshold)
		if err != nil {
			log.Fatal(err)
		}
		switch {
		case class == 1 && yTest[i] == 1:
			tp++
		case class == 0 && yTest[i] == 0:
			tn++
		case class == 1 && yTest[i] == 0:
			fp++
		default:
			fn++
		}
	}

	fmt.Printf("\nTest | Log loss: %.6f\n", model.LogLoss(xTest, yTest))
	fmt.Printf("TP: %d | TN: %d | FP: %d | FN: %d\n", tp, tn, fp, fn)
	fmt.Printf("Aciertos: %d/%d\n", tp+tn, len(xTest))
}
```

El resultado es este:

```text
Epoch     0 | Log loss: 0.693147
Epoch     1 | Log loss: 0.688828
Epoch    10 | Log loss: 0.659210
Epoch   100 | Log loss: 0.501882
Epoch  1000 | Log loss: 0.349389
Epoch 10000 | Log loss: 0.337895

Intercepto: -7.856908
Pendiente: 11.779714

Umbral: 0.50
RAM: 20 % | P(fallo): 0.41 % | Clase: 0
RAM: 50 % | P(fallo): 12.27 % | Clase: 0
RAM: 70 % | P(fallo): 59.60 % | Clase: 1
RAM: 90 % | P(fallo): 93.96 % | Clase: 1

Test | Log loss: 0.473534
TP: 2 | TN: 2 | FP: 1 | FN: 1
Aciertos: 4/6
```

La pérdida del entrenamiento baja desde `0.693147` hasta aproximadamente `0.337895`. La recta interna aprendida queda así:

```text
z ≈ -7.856908 + 11.779714 * x
p = sigmoid(z)
```

Con un 70 % de RAM utilizada, le pasamos `0.70`, obtenemos un `z` cercano a `0.3889` y la sigmoide lo transforma en aproximadamente `0.5960`, es decir, un **59.60 % de probabilidad estimada de fallo** según este modelo de juguete.

No estamos diciendo que el servidor vaya a consumir un 59.60 % de memoria.
La entrada es consumo y la salida, probabilidad de un evento, son cosas distintas aunque las dos se puedan escribir con un porcentaje.

PD: el aprendizaje sigue estando en dos `float64`.
El historial sirve para inspeccionar el entrenamiento, pero no hace falta recorrerlo para predecir, tampoco hay que repetir las 10.000 iteraciones cada vez que llega una medición.

## La inteligencia en un `if`

Después de calcular la probabilidad, alguien tiene que decidir cuándo considerar positiva la predicción o no.

En nuestro código usamos esta regla:

```text
p >= threshold → clase 1
p <  threshold → clase 0
```

Eso es un [umbral de clasificación](https://developers.google.com/machine-learning/crash-course/classification/thresholding), hemos elegido `0.5` y, en caso de igualdad, asignamos la clase 1. Esa convención también la hemos escrito nosotros.

Con el ejemplo del 70 % de RAM, que produce `p ≈ 0.5960`:

| Umbral | Clase resultante |
| -----: | ---------------: |
|    0.3 |                1 |
|    0.5 |                1 |
|    0.8 |                0 |

El modelo no ha cambiado de opinión, **la probabilidad es la misma; hemos cambiado la regla con la que decidimos actuar**, no hay que volver a entrenar para probar otro umbral.

Bajarlo hace que marquemos más casos como positivos, puede ayudarnos a detectar más fallos, a costa de generar más falsas alarmas también, y subirlo hace lo contrario: exigimos una probabilidad mayor antes de avisar y podemos dejar escapar fallos.

Para este ejemplo empezamos con `0.5`, no porque sea una ley de la naturalez ni una recomendación, en un sistema real, elegiríamos el umbral con datos de validación y teniendo en cuenta el coste de cada tipo de error, no moviéndolo hasta que el conjunto de test quede bonito.

Y otra cosita: **un umbral de probabilidad del 50 % no significa avisar al llegar al 50 % de RAM**.

Con los parámetros aprendidos, `p = 0.5` ocurre cuando `z = 0`:

```text
0 = b0 + b1*x
x = -b0 / b1 ≈ 0.667
```

Aquí la frontera está alrededor del 66.7 % de RAMl, para este modelo, con pendiente positiva, superar esa entrada equivale a superar la probabilidad de `0.5`, esa frontera sale de los parámetros que ajustamos, no de escribir a mano `ram > 0.667` antes del entrenamiento.

## Un porcentaje no es una garantía, es una probabilidad

Que la sigmoide devuelva un número entre cero y uno no convierte automáticamente ese número en una estimación fiable del mundo real.

La idea de una probabilidad bien calibrada sería que, entre muchos casos a los que asignamos aproximadamente un 60 % de probabilidad de fallo, alrededor del 60 % termine fallando, y eso se llama [calibración](https://scikit-learn.org/stable/modules/calibration.html) y hay que comprobarlo con datos reales.

Nuestro `59.60 %` no significa que el programa tenga un 59.60 % de posibilidades de estar bien implementado, ni que el modelo acierte ese porcentaje de veces, ni que doce observaciones inventadas nos permitan conocer el futuro de algo.

Poner dos decimales es fácil, tener datos que justifiquen esos decimales ya requiere trabajar un poco más.

## Y los ejemplos que no vio durante el entrenamiento?

Al final del `main.go` hay seis observaciones que no hemos pasado a `FitLogistic`, con el umbral fijado en `0.5`, obtenemos dos verdaderos positivos, dos verdaderos negativos, un falso positivo y un falso negativo.

- El **falso positivo** es el caso con un 72 % de RAM: avisamos de fallo y la etiqueta dice que no falló.
- El **falso negativo** es el del 55 %: no avisamos y sí falló, la matriz de confusión solo está poniendo nombres a esas cuatro posibilidades.

Acertamos cuatro de seis, aproximadamente un 66.7 % pero son seis casos inventados: **esto comprueba el funcionamiento del ejemplo, no su utilidad real**.

La log loss del test es aproximadamente `0.473534`. Mide las probabilidades frente a las etiquetas, mientras que el recuento de aciertos depende además del umbral, no son lo mismo.

Ahora imagina cien ejecuciones y solo dos fallos: un programa que siempre diga "no pasa nada" acertará el 98 % y no detectará ninguno de los fallos, es por eso qje existen métricas como [recall y precision](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall): cuántos fallos reales detectamos y cuántas de nuestras alarmas correspondían realmente a un fallo, respectivamente.

Para un caso real separaríamos [entrenamiento, validación y test](https://developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets). El primero ajusta los parámetros, la validación ayuda a elegir configuraciones y el test queda para la evaluación final.

## Y el código, también lo comprobamos

Probar predicciones con datos nuevos y comprobar la implementación son dos cosas diferentes, podemos tener un algoritmo bien programado que aprenda de datos malos, igual que podemos tener buenos datos y haber cambiado un signo en la derivada.

Creamos `regression/logistic_test.go`:

```go
package regression

import (
	"math"
	"testing"
)

func TestSigmoid(t *testing.T) {
	if sigmoid(0) != 0.5 {
		t.Fatal("con z = 0 la probabilidad debe ser 0.5")
	}
	for _, z := range []float64{-1000, -10, 10, 1000} {
		p := sigmoid(z)
		if !finite(p) || p < 0 || p > 1 {
			t.Fatalf("sigmoide inválida para z = %v: %v", z, p)
		}
	}
}

func TestFitLogisticOneStep(t *testing.T) {
	model, history, err := FitLogistic([]float64{0, 1}, []float64{0, 1}, 0.1, 1)
	if err != nil {
		t.Fatal(err)
	}

	// Desde cero: gradiente_b0 = 0 y gradiente_b1 = -0.25.
	if math.Abs(model.Intercept) > 1e-12 || math.Abs(model.Slope-0.025) > 1e-12 {
		t.Fatalf("actualización incorrecta: %+v", model)
	}
	if len(history) != 2 || math.Abs(history[0]-math.Log(2)) > 1e-12 || history[1] >= history[0] {
		t.Fatalf("historial inesperado: %v", history)
	}
}

func TestPredictThreshold(t *testing.T) {
	model := &LogisticRegression{} // P(y = 1) = 0.5.
	for _, tc := range []struct {
		threshold float64
		want      int
	}{{0.5, 1}, {0.8, 0}} {
		got, err := model.Predict(0.7, tc.threshold)
		if err != nil || got != tc.want {
			t.Fatalf("umbral %v: clase %d, error %v", tc.threshold, got, err)
		}
	}
}

func TestFitLogisticRejectsInvalidLabel(t *testing.T) {
	_, _, err := FitLogistic([]float64{0, 1}, []float64{0, 2}, 0.1, 10)
	if err == nil {
		t.Fatal("no podemos entrenar con la clase 2")
	}
}
```

Y ejecutamos:

```bash
go test ./...
```

El test unitario no exige que el modelo ya clasifique bien, comprueba algo más concreto: que, partiendo de cero y con esos dos datos, el intercepto siga en cero y la pendiente avance hasta `0.025`, también comprobamos la sigmoide, el umbral y una etiqueta inválida.

Así, si alguien "ptimiza" la fórmula y cambia el comportamiento, tenemos una forma de enterarnos que no consiste en esperar a que el servidor se caiga xD

## Lo que no acabamos de construir

No tenemos un detector universal de problemas, tenemos una regresión logística con una sola entrada, entrenada con datos pequeños e inventados, no ve la velocidad a la que crece el consumo, el tamaño de las peticiones ni qué proceso está reservando memoria.

Con esta entrada y sin transformaciones adicionales, la probabilidad solo puede subir, bajar o permanecer constante al aumentar `x`. No es capaz de aprender por arte de magia que hay riesgo alto en dos extremos y bajo en medio, haría falta meter otras características o un modelo que represente esa relación.

Tampoco hemos añadido regularización con datos que puedan separarse perfectamente, la pérdida puede seguir bajando mientras los coeficientes crecen sin límite, sin llegar a un mínimo finito.

Más epochs no significa automáticamente un mejor modelo; aquí fijamos un número de pasos y dejamos fuera técnicas como [la regularización](https://developers.google.com/machine-learning/crash-course/logistic-regression/loss-regularization) para no mezclar demasiadas cosas en un mismo post.

Y el algoritmo no sabe qué es la memoria RAM, nosotros hemos elegido la entrada, definido el evento, preparado las etiquetas, escogido la pérdida y decidido a partir de qué probabilidad avisamos.

---

Ya tenemos el recorrido completo:

```text
RAM utilizada → recta → sigmoide → probabilidad → umbral → clase
```

En el primer artículo la recta estimaba una cantidad, en el segundo vimos cómo entrenarla paso a paso, ahora la utilizamos dentro de un modelo que estima probabilidades y nos permite clasificar resultados.

Podríamos haber montado un agente que leyera las métricas, otro que reflexionara sobre la salud del servidor y un tercero que decidiera si el primero estaba suficientemente preocupado.

Aquí podemos abrir el código, mirar los dos parámetros y reconstruir la decisión con una calculadora.

> No es que todo se resuelva con una regresión logística, es que antes de construir algo más complejo merece la pena entender qué resuelve esto, qué no y cómo comprobarlo.
