---
title: "Una neurona artificial en Go: el perceptrón"
description: "Implementamos un perceptrón en Go, desde cero y sin dependencias, para entender pesos, bias, activaciones y aprendizaje, solo necesitamos hacer unas multiplicaciones, una suma y un if."
published_at: 2026-11-04
author: prinick96
categories:
  - engineering
  - machine-learning
---

En el [primer post](/posts/regresion-lineal-go-o-harness-de-agentes/) sobre ML usamos una recta para predecir números, después vimos cómo [ajustar sus parámetros](/posts/descenso-de-gradiente-go-machine-learning/) y luego pasamos a [clasificar con regresión logística](/posts/regresion-logistica-go-cuando-una-recta-tiene-que-tomar-decisiones/), en el post anterior nos desviamos un poco para ver [K-Means](/posts/k-means-go-agrupar-datos-sin-preguntarle-a-un-llm/) y aprender a agrupar mediciones sin tener una respuesta correcta para cada una.

En este, programaremos una neurona artificial, quizá medio internet actual te habrá hecho pensar que esto es ritual de magia negra y conocimiento selecto solo para unos pocos super dotados, pero nah, buena parte de lo que vamos a hacer ya lo conocemos, es simple igual que todo lo demás, antes teníamos coeficientes y un intercepto, ahora hablaremos de pesos y bias, y el nombre es distinto pero las multiplicaciones siguen siendo las mismas.

![ia-if-else-if-else](https://img.iadev.blog/posts/memeia.webp)

> PD: Este meme, es eso, un meme, podríamos lueeego decir que al final las neuronas se activan/no se activan y lo podriamos ver como if/else pero eso es muy rebuscado, aquí no haremos un montón de if en cadena no te preocupes xD

Ahora sí, en serio, vamos a construir un **perceptrón clásico**, entrenarlo con datos pequeños y comprobar qué consigue aprender, para después ponerle un problema que no puede resolver, que también forma parte de entender lo que estamos haciendo.

Qué es un perceptrón? pues es un modelo matemático creado para clasificadores binarios (decidir si una entrada pertenece o no a una categoría, arrojando un resultado como true/false o 1/0)

## Primero, la neurona en cuestión

Imagina esta función:

```go
func neuron(x, y float64) int {
	z := x*0.6 + y*0.9 - 0.8

	if z >= 0 {
		return 1
	}

	return 0
}
```

Esto ya calcula la salida de un perceptrón con dos entradas, recibe dos números, multiplica cada uno por un peso, añade otro número y decide si el resultado ha llegado a cero.

Y ya está, esa es la operación que realiza al predecir.

Lo que todavía no hemos hecho es entrenarlo, los valores `0.6`, `0.9` y `-0.8` claramente son inventados ahora, más adelante los encontrará el algoritmo a partir de los ejemplos, pero la función que usa esos valores no es más compleja que esa.

Escrito como fórmula:

$$
z = w_1 x_1 + w_2 x_2 + b
$$

Y después:

$$
\hat{y} = f(z)
$$

`x1` y `x2` son las entradas, `w1` y `w2` son los pesos, `b` es el bias y `f` es la función de activación, la `y` con el sombrerito representa nuestra predicción, para distinguirla de la respuesta correcta que nos darán los datos.

_PD: Sobre el **bias** leyendo un poquito más abajo, sabrás qué es_

Siguiendo con la formula anterior, para más entradas hacemos exactamente lo mismo:

$$
z = \sum_{j=1}^{n} w_j x_j + b
$$

Si hay una sumatoria en la ecuación, nosotros lo podemos implementar con un simple `for`, como dice la ecuación, multiplicamos cada entrada por su peso y vamos acumulando el resultado.

Esta es la estructura habitual de una neurona artificial sencilla, de donde viene en detalle, podemos leerlo en los [apuntes de Stanford sobre redes neuronales](https://cs231n.github.io/neural-networks-1/), también advierten que la comparación biológica es una simplificación enorme, así que no, no estamos implementando una célula del cerebro en un `struct`.

## Los pesos: cuánto aporta cada entrada

Mantendremos el ejemplo del server que llevamos usando en la serie, esta vez con dos entradas: proporción de CPU utilizada y proporción de RAM utilizada respecto a sus límites.

![multiplicar_sumar_decidir](https://img.iadev.blog/posts/01_multiplicar_sumar_decidir.png)

En la función de Go de arriba hemos decidido básicamente que:

```text
peso de CPU =  0.6
peso de RAM =  0.9
bias        = -0.8
```

Para una medición con CPU al 80 % y RAM al 70 %:

$$
\begin{aligned}
z &= 0.6 \cdot 0.80 + 0.9 \cdot 0.70 - 0.8 \\
  &= 0.48 + 0.63 - 0.8 \\
  &= 0.31
\end{aligned}
$$

Como es mayor o igual que cero, la salida es `1`.

Con CPU al 20 % y RAM al 30 %, en cambio:

$$
z = 0.6 \cdot 0.20 + 0.9 \cdot 0.30 - 0.8 = -0.41
$$

Y la salida es `0`.

Qué hace un peso? Manteniendo lo demás igual, determina cuánto cambia `z` cuando cambia esa entrada, con nuestros números, subir la CPU de `0.20` a `0.30` aumenta `z` en `0.06`, mientras que subir la RAM esa misma cantidad lo aumenta en `0.09`.

Un peso negativo haría lo contrario, al aumentar esa entrada bajaría `z` y un peso cero hace que esa entrada no contribuya a esta suma.

Pero ojo, **los pesos no son porcentajes**, no tienen que sumar uno, no están obligados a ser positivos y tampoco son una explicación automática de las causas del problema.

También importa cómo representamos los datos, si cambio una entrada de proporción a porcentaje, de `0.80` a `80`, el peso que mantiene la misma contribución tendría que ser cien veces menor, vamos lo que ya vimos en los posts anteriores, hay que mantener coherencia con las cantidades, el dato describe lo mismo, lo que hemos cambiado es la escala.

## El bias es el término que ya conocíamos

En la regresión lineal teníamos esto:

$$
y = b_0 + b_1 x
$$

El `b0` era el intercepto, el bias cumple ese mismo papel: es un valor que sumamos aunque las entradas sean cero.

En nuestro ejemplo:

$$
0.6 \cdot \mathrm{CPU} + 0.9 \cdot \mathrm{RAM} - 0.8 \geq 0
$$

Es equivalente a:

$$
0.6 \cdot \mathrm{CPU} + 0.9 \cdot \mathrm{RAM} \geq 0.8
$$

Así se ve mejor para qué sirve, la suma ponderada tiene que alcanzar `0.8` para activar la salida, si cambiamos el bias a `-1.2`, tendrá que alcanzar `1.2`. Si lo ponemos en `-0.3`, con `0.3` basta, básico.

Para entenderlo mejor, toma una hoja blanca con dos puntos aleatorios y quieres dibujar una línea que los separe:

- Los pesos permiten girar la línea para cambiar su inclincación
- El bias permite mover la línea hacia arriba, hacia abajo o los lados sin necesidad de girarla

Y si no tenemos bias, osea, si ponemos 0, para CPU y RAM a cero tendríamos `z = 0` y devolveríamos `1`, pongamos los pesos que pongamos, si queremos clasificar ese punto como `0`, necesitamos poder desplazar el umbral, esto es porque la linea siempre tiene que pasar por el punto (0,0), es decir, donde se cruzan los ejes del plano cartesiano.

![el_bias_mueve_la_frontera](https://img.iadev.blog/posts/02_el_bias_mueve_la_frontera.png)

En resumen Taringuero!

- Pesos: hacia donde apunta la recta
- Bias: dónde colocamos la recta

Ambos trabajan juntos para encontrar la recta que mejor separa los datos.

## La activación: qué hacemos con el resultado

Hasta ahora `z` puede ser cualquier número, la activación es la función que aplicamos para obtener la salida de la neurona.

Para el perceptrón clásico usaremos un escalón:

$$
f(z) =
\begin{cases}
1 & \text{si } z \geq 0 \\
0 & \text{si } z < 0
\end{cases}
$$

En Go, el `if` que acabamos de escribir.

He elegido que exactamente en cero devuelva `1`, podríamos elegir otra convención, pero tenemos que mantenerla durante el entrenamiento y las predicciones, no nos sirve usar `>=` en una función y `>` en otra y luego preguntarnos por qué falla.

No todas las neuronas usan esa activación, para situarnos, estas son algunas posibilidades:

| Activación | Qué devuelve               | Qué estamos haciendo                                                       |
| ---------- | -------------------------- | -------------------------------------------------------------------------- |
| Identidad  | El mismo `z`               | Dejamos pasar el resultado sin transformarlo                               |
| Escalón    | `0` o `1`                  | Tomamos una decisión binaria directamente                                  |
| Sigmoide   | Un valor entre cero y uno. | Transformamos suavemente el resultado, ya la usamos en regresión logística |
| ReLU       | `max(0, z)`                | Quitamos los valores negativos y dejamos pasar los positivos               |

La [explicación de activaciones de Google](https://developers.google.com/machine-learning/crash-course/neural-networks/activation-functions) desarrolla estas funciones y cómo se usan en redes neuronales, pero para este post nos quedamos con el escalón, no necesitamos implementar cuatro variantes para entender una sola.

Con la sigmoide ya habíamos calculado algo que se puede representar como una neurona artificial, ahora, el perceptrón clásico y la regresión logística **no se entrenan igual**. Uno devuelve aquí una clase y lo corregiremos cuando se equivoque, en la regresión logística estimábamos una probabilidad y ajustábamos los parámetros mediante una pérdida, incluso cuando la clase elegida ya era correcta.

Si usamos los mismos pesos y bias, decidir con `z >= 0` da la misma frontera que decidir con `sigmoid(z) >= 0.5`, eso no significa que sus entrenamientos vayan a encontrar los mismos parámetros.

Tampoco significa que `z = 0.31` sea una probabilidad del 31 %, en este perceptrón es una puntuación, y el `1` final es una etiqueta, no un 100 % de confianza.

## Los datos: volvemos a darle las respuestas correctas

En K-Means habíamos quitado las etiquetas, ahora volvemos al aprendizaje supervisado, cada observación tendrá sus entradas y la clase que queremos aprender a reconocer.

Para no mezclarlo con el ejemplo anterior, aquí no vamos a estimar si el proceso se quedará sin memoria, clasificaremos un estado ficticio como `normal`, representado por `0`, o `revisar`, representado por `1`.

Estos serán los datos de entrenamiento:

| CPU  | RAM  | Etiqueta |
| ---- | ---- | -------- |
| 10 % | 20 % | 0        |
| 70 % | 20 % | 0        |
| 20 % | 70 % | 0        |
| 40 % | 40 % | 0        |
| 60 % | 80 % | 1        |
| 80 % | 60 % | 1        |
| 30 % | 90 % | 1        |
| 90 % | 30 % | 1        |

Son datos inventados, y los he etiquetado usando una regla que también me inventé `CPU + RAM >= 1.1`, con ambas entradas en proporciones.

La idea es que el algoritmo reciba los pares de números y sus etiquetas, **no la regla ni los pesos que la representan**, además, las filas están preparadas para que mirar solo si la CPU o la RAM son altas no resuelva todos los casos.

Si tu requisito real fuera exactamente esa suma, escribiría el `if` directamente, no entrenaría un modelo para aproximar una regla que ya conozco, aquí lo hacemos para ver cómo encuentra una separación a partir de ejemplos.

Guardaremos otras seis observaciones para comprobar el resultado, sin pasárselas al entrenamiento, la separación entre [datos de entrenamiento y datos de prueba](https://developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets) importa precisamente porque acertar lo que has usado para ajustar el modelo no basta para saber cómo responde fuera de ahí.

## Aprender es cambiar los pesos y el bias

Vamos a empezar con todo a cero:

```text
pesos = [0, 0]
bias  = 0
```

Con nuestra activación eso devuelve `1` para todas las entradas, todavía no ha aprendido nada, simplemente está ejecutando lo que hemos programado.

Por cada ejemplo calculamos la predicción y la diferencia respecto a la etiqueta:

$$
e = y - \hat{y}
$$

- Si acertamos, `e = 0`
- Si debería devolver `1` y devuelve `0`, `e = 1`
- Si debería devolver `0` y devuelve `1`, `e = -1`

Después actualizamos:

$$
\begin{aligned}
w_j &\leftarrow w_j + \eta e x_j \\
b &\leftarrow b + \eta e
\end{aligned}
$$

La letra `η`, eta, es la tasa de aprendizaje, la elegimos nosotros y escala el tamaño de cada corrección, para este ejemplo usaremos `0.1`.

Fíjate en que el peso se corrige multiplicando también por su entrada, si esa entrada vale cero, ese peso no cambia con este ejemplo, el bias, en cambio, recibe la corrección directamente, también podríamos verlo como el peso de una entrada adicional que siempre vale uno.

Esta es la [regla de aprendizaje del perceptrón](https://courses.cis.cornell.edu/cs4780/2023sp/lectures/lecturenote03.html), escrita aquí con etiquetas `0` y `1` pero también se suele ver mucho que usan `-1` y `+1`.

Y otro detalle respecto al post de descenso de gradiente, ahí usábamos una diferencia con el orden contrario, aquí he definido `e = real - predicción` y **sumo** la corrección, el signo no es decoración, si cambias la resta sin cambiar la actualización, ya no estás haciendo lo mismo.

### Una corrección, con los números delante

La primera fila tiene CPU `0.10`, RAM `0.20` y etiqueta `0`.

Como los parámetros están a cero, `z = 0`, la neurona devuelve `1` y se equivoca:

$$
e = 0 - 1 = -1
$$

Aplicamos la actualización:

$$
\begin{aligned}
w_1 &= 0 + 0.1 \cdot (-1) \cdot 0.10 = -0.01 \\
w_2 &= 0 + 0.1 \cdot (-1) \cdot 0.20 = -0.02 \\
b &= 0 + 0.1 \cdot (-1) = -0.1
\end{aligned}
$$

Si volvemos a evaluar esa misma fila:

$$
z = -0.01 \cdot 0.10 - 0.02 \cdot 0.20 - 0.1 = -0.105
$$

Ahora devuelve `0`, que era lo que queríamos.

Eso ha sido una actualización de entrenamiento, solo modificando tres números.

![corregir_tres_numeros](https://img.iadev.blog/posts/03_corregir_tres_numeros.png)

Pero ojo, arreglar que arreglar una fila puede dañar otra, por eso no paramos en cuanto acertamos una observación, recorremos los ejemplos y comprobamos cómo queda el modelo sobre el conjunto completo.

Un ciclo del bucle por todos los datos es un **epoch**, que ya lo hemos visto, haremos varios, con un límite para no quedarnos entrenando indefinidamente cuando no podamos separar las clases.

### Aquí no estamos derivando el escalón

El escalón tiene derivada cero a ambos lados del salto y no es derivable en el salto, intentar entrenar esta función aplicando sin más el mismo procedimiento de derivación que usamos con la sigmoide no nos daría una señal útil a través de esa activación.

Por eso estamos usando una regla de corrección por errores de clasificación, no calculando la derivada del `if`.

Eso tampoco significa que el perceptrón esté desconectado de la optimización, por ejemplo, [scikit-learn lo implementa sobre un clasificador entrenado con descenso de gradiente estocástico](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Perceptron.html), usando una pérdida específica del perceptrón, una cosa es esa formulación y otra derivar directamente la salida del escalón, que no es lo que hacemos aquí.

## La implementación completa en Go

Vamos a dejarlo en un `main.go`, fijaré dos entradas con `[2]float64`, CPU y RAM en ese orden, para que no tengamos que dedicar medio ejemplo a gestionar dimensiones variables.

`Score` calcula la suma, `Predict` aplica el escalón y `Train` busca los parámetros:

```go
package main

import (
	"fmt"
	"log"
	"math"
)

type Sample struct {
	X [2]float64 // CPU y RAM, en ese orden y entre 0 y 1.
	Y int        // 0: normal, 1: revisar.
}

type Perceptron struct {
	Weights [2]float64
	Bias    float64
}

type TrainingResult struct {
	Epochs    int
	Updates   int
	Converged bool
}

func (p Perceptron) Score(x [2]float64) float64 {
	return p.Weights[0]*x[0] + p.Weights[1]*x[1] + p.Bias
}

func (p Perceptron) Predict(x [2]float64) int {
	if p.Score(x) >= 0 {
		return 1
	}
	return 0
}

func (p Perceptron) Correct(data []Sample) int {
	correct := 0
	for _, sample := range data {
		if p.Predict(sample.X) == sample.Y {
			correct++
		}
	}
	return correct
}

func Train(data []Sample, rate float64, maxEpochs int) (Perceptron, TrainingResult, error) {
	var model Perceptron
	var result TrainingResult

	if len(data) == 0 || maxEpochs <= 0 {
		return model, result, fmt.Errorf("necesitamos datos y un límite de epochs positivo")
	}
	if rate <= 0 || math.IsNaN(rate) || math.IsInf(rate, 0) {
		return model, result, fmt.Errorf("la tasa debe ser positiva y finita")
	}
	for i, sample := range data {
		if sample.Y != 0 && sample.Y != 1 {
			return model, result, fmt.Errorf("muestra %d: la etiqueta debe ser 0 o 1", i)
		}
		for _, value := range sample.X {
			if math.IsNaN(value) || value < 0 || value > 1 {
				return model, result, fmt.Errorf("muestra %d: las entradas deben estar entre 0 y 1", i)
			}
		}
	}

	for epoch := 1; epoch <= maxEpochs; epoch++ {
		for _, sample := range data {
			prediction := model.Predict(sample.X)
			difference := sample.Y - prediction
			if difference == 0 {
				continue
			}

			change := rate * float64(difference)
			for j, value := range sample.X {
				model.Weights[j] += change * value
			}
			model.Bias += change
			result.Updates++

			// Comprobamos también el resultado de las operaciones.
			for _, value := range []float64{model.Weights[0], model.Weights[1], model.Bias} {
				if math.IsNaN(value) || math.IsInf(value, 0) {
					return model, result, fmt.Errorf("desbordamiento numérico durante el entrenamiento")
				}
			}
		}

		result.Epochs = epoch
		// Evaluamos todos los ejemplos con los mismos pesos, ya sin modificarlos.
		if model.Correct(data) == len(data) {
			result.Converged = true
			return model, result, nil
		}
	}

	return model, result, nil
}

func main() {
	training := []Sample{
		{X: [2]float64{0.10, 0.20}, Y: 0},
		{X: [2]float64{0.70, 0.20}, Y: 0},
		{X: [2]float64{0.20, 0.70}, Y: 0},
		{X: [2]float64{0.40, 0.40}, Y: 0},
		{X: [2]float64{0.60, 0.80}, Y: 1},
		{X: [2]float64{0.80, 0.60}, Y: 1},
		{X: [2]float64{0.30, 0.90}, Y: 1},
		{X: [2]float64{0.90, 0.30}, Y: 1},
	}

	// Estos ejemplos no se pasan a Train.
	test := []Sample{
		{X: [2]float64{0.20, 0.30}, Y: 0},
		{X: [2]float64{0.80, 0.15}, Y: 0},
		{X: [2]float64{0.15, 0.80}, Y: 0},
		{X: [2]float64{0.70, 0.65}, Y: 1},
		{X: [2]float64{0.65, 0.70}, Y: 1},
		{X: [2]float64{0.85, 0.40}, Y: 1},
	}

	initial := Perceptron{}
	fmt.Printf("Antes del entrenamiento %d/%d; prueba %d/%d\n",
		initial.Correct(training), len(training), initial.Correct(test), len(test))

	model, result, err := Train(training, 0.1, 100)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Epochs: %d; ajustes: %d; convergió: %t\n",
		result.Epochs, result.Updates, result.Converged)
	fmt.Printf("Pesos: [%.3f %.3f]; bias: %.3f\n",
		model.Weights[0], model.Weights[1], model.Bias)
	fmt.Printf("Después de entrenamiento %d/%d; prueba %d/%d\n",
		model.Correct(training), len(training), model.Correct(test), len(test))

	for _, sample := range test {
		fmt.Printf("CPU=%.2f RAM=%.2f -> z=%+.4f; predicción=%d; esperado=%d\n",
			sample.X[0], sample.X[1], model.Score(sample.X),
			model.Predict(sample.X), sample.Y)
	}
}
```

La parte que aprende está en estas operaciones:

```go
prediction := model.Predict(sample.X)
difference := sample.Y - prediction
// ...
change := rate * float64(difference)

for j, value := range sample.X {
	model.Weights[j] += change * value
}
model.Bias += change
```

El resto organiza los datos, valida, decide cuándo parar y muestra resultados, que el archivo completo tenga más líneas no cambia lo que hace la neurona.

Aquí `Train` siempre crea un modelo nuevo desde cero y mantiene el orden de los ejemplos para que podamos reproducir las cuentas, `Predict` no entrena ni modifica nada, solo usa los parámetros que ya tenemos.

## Vamos a comprobar si ha aprendido algo

Si ejecutamos el programa, tendríamos:

```text
Antes del entrenamiento 4/8; prueba 3/6
Epochs: 3; ajustes: 5; convergió: true
Pesos: [0.090 0.100]; bias: -0.100
Después del entrenamiento 8/8; prueba 6/6
CPU=0.20 RAM=0.30 -> z=-0.0520; predicción=0; esperado=0
CPU=0.80 RAM=0.15 -> z=-0.0130; predicción=0; esperado=0
CPU=0.15 RAM=0.80 -> z=-0.0065; predicción=0; esperado=0
CPU=0.70 RAM=0.65 -> z=+0.0280; predicción=1; esperado=1
CPU=0.65 RAM=0.70 -> z=+0.0285; predicción=1; esperado=1
CPU=0.85 RAM=0.40 -> z=+0.0165; predicción=1; esperado=1
```

Antes de entrenar acertó la mitad de cada conjunto porque contesta `1` a todo y hemos puesto el mismo número de ejemplos de cada clase, después acierta las ocho observaciones de entrenamiento y las seis reservadas para la prueba.

Ha necesitado tres epochs y cinco ajustes, no son cinco cambios por parámetro, sino cinco ejemplos mal clasificados que provocaron una actualización de los pesos y el bias.

Si miramos cómo terminó cada epoch:

| Epoch | Ajustes durante esa vuelta | Errores con el modelo al terminar |
| ----- | -------------------------- | --------------------------------- |
| 1     | 2                          | 4 de 8                            |
| 2     | 2                          | 4 de 8                            |
| 3     | 1                          | 0 de 8                            |

Las dos últimas columnas no miden lo mismo, mientras entrenamos, los pesos van cambiando, para contar los errores finales, evaluamos todas las filas con los mismos pesos, sin volver a tocarlos, es por eso que puede haber dos correcciones durante una vuelta y cuatro errores al terminarla.

Tenemos un ejemplo pequeño, sintético y preparado para ser separable, lo que hemos comprobado es que esta implementación ajusta sus parámetros y mejora en estas observaciones, incluidas seis que no utilizó para entrenar, no hemos demostrado que funcione con datos reales ni que haya descubierto exactamente la regla que usé al inventar las etiquetas.

![dos_fronteras_un_contraejemplo](https://img.iadev.blog/posts/04_dos_fronteras_un_contraejemplo.png)

Si empezáramos a cambiar el modelo mirando continuamente cómo responde a esas seis filas, dejarían de servir como una evaluación final independiente, para ese trabajo separaríamos también datos de validación, como explica la [guía de partición de datos](https://developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets).

## Lo que ha aprendido cabe en una recta

Los valores que imprime el programa son:

```text
wCPU =  0.09
wRAM =  0.10
bias = -0.10
```

Así que la decisión queda, con esos valores redondeados:

$$
\hat{y} =
\begin{cases}
1 & \text{si } 0.09 \cdot \mathrm{CPU} + 0.10 \cdot \mathrm{RAM} - 0.10 \geq 0 \\
0 & \text{en otro caso}
\end{cases}
$$

La frontera está donde `z = 0`:

$$
\begin{aligned}
0.09 \cdot \mathrm{CPU} + 0.10 \cdot \mathrm{RAM} - 0.10 &= 0 \\
\mathrm{RAM} &= 1 - 0.9 \cdot \mathrm{CPU}
\end{aligned}
$$

Una recta, los puntos de una clase quedan a un lado y los de la otra al otro.

```vega-lite
{
  "description": "Ocho observaciones sintéticas de CPU y RAM. Las cuatro etiquetadas como normal quedan debajo de la frontera aprendida RAM = 1 - 0.9 por CPU; las cuatro etiquetadas como revisar quedan por encima. Los ejes representan proporciones y se muestran como porcentajes.",
  "width": 320,
  "height": 340,
  "encoding": {
    "x": {
      "field": "cpu",
      "type": "quantitative",
      "title": "CPU utilizada",
      "scale": { "domain": [0, 1], "nice": false },
      "axis": { "format": ".0%" }
    },
    "y": {
      "field": "ram",
      "type": "quantitative",
      "title": "RAM utilizada",
      "scale": { "domain": [0, 1], "nice": false },
      "axis": { "format": ".0%" }
    }
  },
  "layer": [
    {
      "data": {
        "values": [
          { "cpu": 0, "ram": 1 },
          { "cpu": 1, "ram": 0.1 }
        ]
      },
      "mark": { "type": "line", "strokeDash": [6, 4] }
    },
    {
      "data": {
        "values": [
          { "cpu": 0.1, "ram": 0.2, "clase": "0: normal" },
          { "cpu": 0.7, "ram": 0.2, "clase": "0: normal" },
          { "cpu": 0.2, "ram": 0.7, "clase": "0: normal" },
          { "cpu": 0.4, "ram": 0.4, "clase": "0: normal" },
          { "cpu": 0.6, "ram": 0.8, "clase": "1: revisar" },
          { "cpu": 0.8, "ram": 0.6, "clase": "1: revisar" },
          { "cpu": 0.3, "ram": 0.9, "clase": "1: revisar" },
          { "cpu": 0.9, "ram": 0.3, "clase": "1: revisar" }
        ]
      },
      "mark": { "type": "point", "filled": true, "size": 110 },
      "encoding": {
        "color": { "field": "clase", "type": "nominal", "title": "Etiqueta" },
        "shape": { "field": "clase", "type": "nominal", "title": "Etiqueta" }
      }
    }
  ]
}
```

Con solo dos entradas podemos dibujar una recta que separa las clases, con más dimensiones hablaríamos de un hiperplano, pero la idea sigue siendo decidir de qué lado queda cada punto.

La regla con la que inventé los datos tenía la frontera `RAM = 1.1 - CPU`, y el modelo ha encontrado otra, ambas separan estas observaciones, por eso acertar todas las filas no demuestra que haya recuperado la regla original ya quie en otros puntos podrían discrepar.

Por ejemplo, CPU `0.20` y RAM `0.85` suman `1.05`, así que mi regla inventada diría `0`, pero el modelo calcula `0.09*0.20 + 0.10*0.85 - 0.10 = 0.003` y devuelve `1`, las seis pruebas han salido bien, pero no han cubierto todos los casos, este punto adicional ya nos muestra la diferencia.

El resultado teórico del perceptrón garantiza que encontrará una separación en un número finito de actualizaciones si los datos de entrenamiento son linealmente separables (osea que con una recta podamos separar las clases) bajo las condiciones del algoritmo, esto no garantiza que encuentre la única recta correcta, porque puede haber muchas, ni que un límite arbitrario de cien epochs sea suficiente, la [demostración de Cornell](https://courses.cis.cornell.edu/cs4780/2023sp/lectures/lecturenote03.html) detalla eso justamente.

Y el escalón no cambia esta limitación, aunque la activación sea una función no lineal, **la frontera de este perceptrón sigue siendo lineal en sus entradas**.

## Ahora le ponemos algo que no puede aprender

Vamos a dejar el server un momento y usar `XOR`, que devuelve `1` cuando las dos entradas binarias son distintas:

| x1  | x2  | Resultado |
| --- | --- | --------- |
| 0   | 0   | 0         |
| 0   | 1   | 1         |
| 1   | 0   | 1         |
| 1   | 1   | 0         |

Son cuatro filas, no parece un problema enorme, pero si las dibujas en un cuadrado, los puntos de cada clase quedan en esquinas opuestas, no hay una recta que separe los dos `1` de los dos `0`.

Es el [ejemplo clásico de la limitación de una sola capa sin neuronas ocultas](https://cvw.cac.cornell.edu/SciML/mlp/xor-problem), y podemos comprobarlo con nuestro mismo código.

Añade este bloque dentro de la función `main()` al final:

```go
xor := []Sample{
	{X: [2]float64{0, 0}, Y: 0},
	{X: [2]float64{0, 1}, Y: 1},
	{X: [2]float64{1, 0}, Y: 1},
	{X: [2]float64{1, 1}, Y: 0},
}

xorModel, xorResult, err := Train(xor, 0.1, 100)
if err != nil {
	log.Fatal(err)
}

fmt.Printf("XOR: epochs=%d; convergió=%t; aciertos=%d/%d\n",
	xorResult.Epochs, xorResult.Converged,
	xorModel.Correct(xor), len(xor))
```

Con ese orden de los datos, la salida es:

```text
XOR: epochs=100; convergió=false; aciertos=2/4
```

Esto no demuestra por sí solo que sea imposible, solo muestra que este entrenamiento no lo pudo resolver.

Para ver por qué no puede, podemos hacer la cuenta:

- Para que `(0, 0)` dé `0`, necesitamos `b < 0`.
- Para que `(1, 0)` y `(0, 1)` den `1`, necesitamos:

$$
\begin{aligned}
w_1 + b &\geq 0 \\
w_2 + b &\geq 0
\end{aligned}
$$

Por tanto, ambos pesos tienen que ser al menos `-b` y si evaluamos ahora `(1, 1)`:

$$
w_1 + w_2 + b \geq -b - b + b = -b > 0
$$

La neurona devolverá `1`, pero XOR necesita `0`.

No hay unos pesos mejores escondidos detrás de otras mil epochs, hemos pedido condiciones incompatibles para esta forma de calcular la salida.

![xor_no_necesita_mas_epochs](https://img.iadev.blog/posts/05_xor_no_necesita_mas_epochs.png)

El `2/4` tampoco es el mejor resultado posible de cualquier recta para XOR, se pueden acertar tres de las cuatro filas, es simplemente donde queda nuestro entrenamiento al alcanzar el límite, este algoritmo no está guardando el mejor modelo que haya pasado por el bucle.

Cambiar el orden puede cambiar los parámetros finales, y cambiar la configuración puede cambiar la trayectoria, pero no hará que una recta separe esos cuatro puntos correctamente, poner una sigmoide y decidir con un umbral fijo tampoco arreglaría esa geometría.

Y ojo con sacar la conclusión contraria, que `Converged` sea `false` en un conjunto cualquiera no demuestra que ese conjunto no sea separable, puede habernos faltado entrenamiento y ya, en XOR lo sabemos por el razonamiento anterior, no porque haya llegado el contador a cien.

## Entonces, para qué sirve conectar más neuronas?

Una neurona sencilla tiene limitaciones, y ahora podemos señalar una concreta en vez de decir simplemente que "le falta inteligencia"

Al combinar varias neuronas podemos usar sus salidas como entradas de otras y construir decisiones que una única frontera lineal no representa, imagina esto como usar compuertas lógicas, ahí aparecen las capas ocultas y las redes que iremos viendo después.

Pero conectar capas sin una transformación no lineal entre ellas tampoco hace el trabajo ya que si una operación calcula:

$$
u = 2x + 1
$$

Y la siguiente:

$$
v = 3u - 4
$$

Al sustituir nos queda:

$$
v = 3(2x + 1) - 4 = 6x - 1
$$

Hemos añadido un paso, pero el resultado sigue siendo una función afín, con matrices y varias entradas ocurre lo mismo, como se puede comprobar en la [explicación de nodos y capas de Google](https://developers.google.com/machine-learning/crash-course/neural-networks/nodes-hidden-layers).

Las activaciones no lineales entre capas permiten salir de esa composición de funciones afines, la capacidad no aparece porque hayamos hecho el diagrama más grande.

También tendremos que resolver cómo entrenarlas, que eso es otra cosa, aquí conocemos la respuesta correcta de la única salida, en una red con capas ocultas no nos vienen dadas las respuestas correctas de cada neurona, no servirá solo con copiar `Train` en cada capa y esperar que se entiendan solas, ahí es donde tendrá sentido volver a las derivadas y hablar de backpropagation.

Otra posibilidad para algunos problemas sería transformar las entradas, por ejemplo añadiendo el producto `x1*x2` en el caso de XOR, eso cambia la representación sobre la que aprende el clasificador, no demuestra que nuestro perceptrón de dos entradas originales pudiera resolverlo, más capas no son la única herramienta que existe.

## Lo interesante

Una neurona artificial como esta hace una operación bastante sencilla, solo multiplica entradas por pesos, suma el bias y aplica una activación, entrenarla consiste en encontrar unos parámetros que le permitan responder mejor a los ejemplos que le damos, eso es todo.

En nuestro caso, lo aprendido queda en dos pesos y un bias, si guardamos esos valores y conservamos el orden y la escala de las entradas, podemos volver a usar el modelo sin repetir el entrenamiento, el conjunto de ejemplos no se consulta en `Predict`, la decisión sale de la ecuación.

Que esta pieza sea sencilla no significa que construir y entrenar una red grande sea sencillo también, para nada, significa que podemos empezar entendiendo una pieza, comprobar qué aprende, ver dónde falla y después estudiar qué cambia al combinarla con otras, vamos que un problema grande se soluciona comprendiendo todas sus partes pequeñas.

Yo prefiero llegar a las redes por ahí, ya tenemos código que podemos leer, unos resultados que podemos reproducir y un caso que no funciona por una razón matemática concreta (lo del xor).

Y cuando algo no funcione, tendremos una pregunta algo más útil que "le doy más contexto?", si es que el modelo que hemos elegido puede representar la respuesta que estamos intentando enseñarle.
