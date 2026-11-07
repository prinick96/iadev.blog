---
title: "Una red neuronal en Go sin TensorFlow: multiplicaciones, derivadas y paciencia"
description: "Construimos una red neuronal pequeña en Go, sin dependencias, para entender forward propagation, función de pérdida y backpropagation."
published_at: 2026-11-07
author: prinick96
categories:
  - engineering
  - machine-learning
---

En el [post anterior](/posts/una-neurona-artificial-en-go-el-perceptron/) dejamos al perceptrón intentando aprender XOR, cuatro filas que parecían poca cosa hasta que vimos que no existía una recta capaz de separar sus clases, no necesitaba más tiempo, ni otros 10k de intentos, ni que le escribiéramos en mayúsculas que esta vez tenía que hacerlo bien, le habíamos pedido algo que ese modelo no podía representar en la vida.

Ahora vamos a conectar varias neuronas y resolver ese mismo problema, pero la parte interesante será entender cómo corregimos los pesos de una neurona que está en medio cuando los datos solo nos dicen cuál debería ser la respuesta final.

Porque saber que la red se ha equivocado es fácil, lo que falta es saber qué números tenemos que tocar y en qué dirección.

Seguiremos con GO y para esto podríamos usar TensorFlow, pero no lo usaremos, no porque TensorFlow esté mal ni porque vaya a escribir mi propio framework para demostrar algo, sino porque quiero poder mostrarte exactamente donde se calcula la predicción, donde medimos el error y de donde sale la corrección. Si lo escondemos todo detrás de una llamada a `fit`, funciona igualmente, pero la idea del post es aprender.

## Volvemos a las cuatro filas

XOR devuelve `1` cuando las dos entradas binarias son distintas:

| x1  | x2  | Resultado esperado |
| --- | --- | ------------------ |
| 0   | 0   | 0                  |
| 0   | 1   | 1                  |
| 1   | 0   | 1                  |
| 1   | 1   | 0                  |

Vamos a trabajar solo con estos dos bits, sin etiquetas de RAM/CPU ni nada de eso esta vez, no lo necesitamos.

Y antes de seguir, si el requisito de una aplicación fuera calcular XOR entre dos booleanos, escribiría `a != b` y terminaría ahí. Entrenar una red para sustituir esa comparación es estúpido, aquí usamos una respuesta conocida para comprobar si sabemos construir y entrenar el modelo.

Lo que vamos a pasar al entrenamiento son las cuatro entradas y sus etiquetas, no una función que calcule XOR dentro de la predicción.

## La red: dos entradas, dos neuronas ocultas y una salida

Nuestra arquitectura será esta:

```text
[x1, x2]  ──►  [h1, h2]  ──►  [p]
 entradas      capa oculta     salida
```

Las dos neuronas ocultas reciben los mismos datos `x1` y `x2` y cada una hace sus cálculos con sus propios pesos y produce un resultado, después, la neurona de salida recibe esos dos resultados y calcula la respuesta final.

Como cada neurona está conectada con todas las de la capa siguiente, decimos que la red es densa.

La estructura se escribe `2-2-1`, dos entradas, dos neuronas ocultas y una neurona de salida, eso es lo que signfica cada número as entradas no hacen ningún cálculo, solamente son los números que le pasamos a la red.

También la llamamos _feedforward_ porque los datos avanzan en una sola dirección: de las entradas hacia la salida, sin vol_ver a una capa anterior.

La capa se llama oculta porque sus resultados no son las etiquetas que nos dan los datos, no porque no podamos verlos, de hecho, luego los imprimiremos, que para algo estamos haciendo el código nosotros, esta organización por capas está explicada en los [apuntes de Stanford sobre redes neuronales](https://cs231n.github.io/neural-networks-1/).

Ahora, cuántos números vamos a entrenar? Cada neurona oculta tiene dos pesos y un bias, eso son seis parámetros, la salida tiene otros dos pesos y otro bias, tres más.

**Nueve parámetros en total.** Nada de miles de millones, eso cuesta mucho dinero y primero tenemos que conseguir que nueve `float64` hagan lo que esperamos.

### No basta con poner más multiplicaciones

En el perceptrón usamos un escalón, un `if` que devolvía directamente cero o uno, ahora utilizaremos la sigmoide que ya conocemos de la [regresión logística](/posts/regresion-logistica-go-cuando-una-recta-tiene-que-tomar-decisiones/):

$$
\sigma(z) = \frac{1}{1 + e^{-z}}
$$

La pondremos en las dos neuronas ocultas y también en la salida, así mantenemos una sola activación y podemos seguir las cuentas sin introducir otras tres funciones a la vez.

Por qué necesitamos aplicar la sigmoide en la capa oculta? simple, porque añadir más capas que solo multiplican y suman no resuelve nuestro problema.

Podríamos juntar todas esas multiplicaciones y sumas y obtener una sola capa que hiciera exactamente lo mismo. Eso es lo que expresa esta fórmula:

$$
W_2(W_1x + b_1) + b_2 = (W_2W_1)x + (W_2b_1 + b_2)
$$

A la izquierda hacemos el cálculo en dos pasos, a la derecha hemos agrupado los números para hacerlo en uno, el resultado no cambia.

Y poner una sigmoide únicamente al final tampoco basta, si después decidimos entre 0 y 1 usando el umbral de 0.5, seguimos separando las entradas con una recta, esto es justo lo que no nos servía para XOR.

Necesitamos una transformación que no se pueda reducir a esas multiplicaciones y sumas, aquí la conseguimos aplicando la sigmoide entre las capas, no solo al final.

Además, la sigmoide cambia de forma gradual, lo que permite calcular cómo ajustar los pesos para que la red aprenda, por otro lado el escalón del perceptrón pasa directamente de 0 a 1, por lo que no nos sirve para calcular esos ajustes de la misma manera.

## Forward propagation: calcular la respuesta

Vamos a ponerle nombre a cada paso, para la neurona oculta `j`:

$$
\begin{aligned}
a_j &= w_{j1}x_1 + w_{j2}x_2 + b_j \\
h_j &= \sigma(a_j)
\end{aligned}
$$

`a` es la suma antes de aplicar la activación, `h` es lo que sale de ella, hacemos esa cuenta dos veces, con los pesos y el bias de cada neurona, y usamos los dos resultados como entradas de la siguiente:

$$
\begin{aligned}
z &= v_1h_1 + v_2h_2 + c \\
p &= \sigma(z)
\end{aligned}
$$

He llamado `v` a los pesos de la salida y `c` a su bias para que las fórmulas no sean una sopa de subíndices, en el código, los pesos y bias de la primera capa serán `W1` y `B1`, y los de la salida, `W2` y `B2`.

A este recorrido lo llamamos **forward propagation**, o propagación hacia delante, introducimos los datos, calculamos los resultados de las neuronas ocultas y usamos esos resultados para obtener la respuesta final `p`.

No estamos entrenando todavía, solo estamos ejecutando una función con unos parámetros.

### Una pasada, con números

Para seguirla a mano, vamos a inventarnos los valores, son solo para esta cuenta, no son la inicialización que utilizará después lo que haremos:

```text
Neurona oculta 1: pesos [0.2, -0.3], bias 0
Neurona oculta 2: pesos [0.4,  0.1], bias 0
Neurona de salida: pesos [0.7, -0.5], bias 0

Entrada: [1, 0]
Respuesta esperada: 1
```

La primera capa calcula:

$$
\begin{aligned}
a_1 &= 0.2 \cdot 1 - 0.3 \cdot 0 = 0.2 \\
h_1 &= \sigma(0.2) \approx 0.549834 \\
a_2 &= 0.4 \cdot 1 + 0.1 \cdot 0 = 0.4 \\
h_2 &= \sigma(0.4) \approx 0.598688
\end{aligned}
$$

Y la salida:

$$
\begin{aligned}
z &= 0.7 \cdot 0.549834 - 0.5 \cdot 0.598688 \approx 0.085540 \\
p &= \sigma(z) \approx 0.521372
\end{aligned}
$$

Con un umbral de `0.5` ya devolveríamos la clase `1`, pero eso no significa que hayamos terminado de entrenar, todavia tenemos una salida apenas por encima del umbral y solo hemos mirado una fila.

![forward_nueve_parametros](https://img.iadev.blog/posts/01_forward_nueve_parametros.png)

Otra cosa a tener en cuenta es que `h1` y `h2` estén entre cero y uno no significa que sean dos probabilidades de XOR, solo son valores intermedios, no les hemos asignado ese significado, la salida `p` sí la interpretamos como la probabilidad estimada de la clase `1`, aunque eso por sí solo tampoco demuestra que esté bien calibrada.

## La función de pérdida

Vamos a utilizar **entropía cruzada binaria**, la misma pérdida del artículo de regresión logística, para una observación:

$$
\ell(p, y) = -\left[y\ln(p) + (1-y)\ln(1-p)\right]
$$

La `y` es la etiqueta correcta y `p` es la salida de la red, si la etiqueta es `1`, queda `-ln(p)`, si es `0`, queda `-ln(1-p)`. La [documentación de Google sobre log loss](https://developers.google.com/machine-learning/crash-course/logistic-regression/loss-regularization) desarrolla esta función.

En nuestra cuenta anterior, con `y = 1` y `p ≈ 0.521372`, la pérdida es aproximadamente `0.651292`.

Aunque la clase ya sea correcta, podemos reducir esa pérdida acercando la salida a la etiqueta, una predicción de `0.51` y otra de `0.99` aciertan la misma clase cuando `y = 1`, pero no reciben la misma penalización, para entrenar queremos conservar esa diferencia, no convertirlo todo demasiado pronto en un `if`.

Por eso **el umbral no forma parte del recorrido que vamos a derivar**, entrenaremos con la salida continua y convertiremos a 0 o 1 cuando queramos contar aciertos.

Para las cuatro filas hacemos la media:

$$
J = \frac{1}{N}\sum_{i=1}^{N}\ell(p_i, y_i)
$$

Aquí `N = 4`, ese `J` es el número que intentaremos reducir, no un porcentaje de fallos ni una medida de cuánta inteligencia tiene la red.

## Backpropagation: qué cambiamos en las neuronas del medio

Ya sabemos qué ha respondido la red y qué pérdida ha producido esa respuesta, ahora toca averiguar cómo cambiar sus nueve parámetros para intentar reducirla.

El problema está en las neuronas ocultas, para la salida tenemos una respuesta correcta con la que comparar, pero aun no sabemos qué deberían haber devuelto `h1` y `h2`

No necesitamos inventarnos esas respuestas, lo que vamos a calcular es cómo cambiaría la pérdida si modificáramos un poco cada parámetro, esas variaciones se describen mediante derivadas y juntas forman el gradiente.

Eso es **backpropagation**, o retropropagación, es el procedimiento que usamos para calcularlas, empezamos en la pérdida y vamos siguiendo hacia atrás las operaciones que llevaron hasta ella, así podemos saber cómo influye un peso de la primera capa, aunque esté lejos de la salida.

Un peso no cambia la pérdida directamente, primero cambia el cálculo de su neurona, ese resultado afecta a la siguiente neurona, y así hasta llegar a la respuesta final y a la pérdida.

La regla de la cadena nos permite seguir ese recorrido entro, calculamos cuánto afecta cada paso al siguiente y multiplicamos esas derivadas para saber cómo influye el peso en la pérdida final.

Eso es lo que hacemos "hacia atrás", no intentamos recuperar las entradas a partir de la respuesta, estamos calculando cómo contribuyó cada operación al resultado.

### Empezamos por la salida

Con nuestra combinación de sigmoide y entropía cruzada, la derivada respecto a `z` queda:

$$
\delta_{\text{salida}} = \frac{\partial \ell}{\partial z} = p-y
$$

Esto ya apareció en regresión logística, la derivada de la pérdida respecto a `p` y la derivada de la sigmoide se combinan así:

$$
\frac{\partial \ell}{\partial p}\frac{\partial p}{\partial z}
= \frac{p-y}{p(1-p)}\,p(1-p)
= p-y
$$

La igualdad es la cuenta matemática con `0 < p < 1`, en el código usaremos directamente `p-y`, no calcularemos una división que podría convertirse en `0/0` al redondear una probabilidad a un extremo.

Como `z = v1*h1 + v2*h2 + c`, tenemos:

$$
\begin{aligned}
\frac{\partial \ell}{\partial v_j} &= \delta_{\text{salida}}h_j \\\\
\frac{\partial \ell}{\partial c} &= \delta_{\text{salida}}
\end{aligned}
$$

Hasta aquí es prácticamente lo que ya hacíamos con una sola neurona, solo que sus entradas ahora son las salidas de otras dos, las estamos concatenando.

Y ojo, no hay que volver a multiplicar `p-y` por `p*(1-p)`, esa derivada ya está incluida en la simplificación, tampoco estamos usando el `y - clase` de la regla del perceptrón, aquí calculamos un gradiente con otro procedimiento.

### Ahora sí, llegamos a la capa oculta

Para saber cómo cambia la pérdida al mover la suma `a_j` de una neurona oculta, seguimos este camino:

```text
suma oculta a_j → activación h_j → suma de salida z → pérdida
```

La salida depende de `h_j` a través del peso `v_j`, y la derivada de la sigmoide oculta es `h_j*(1-h_j)`. Por tanto:

$$
\delta_j = \frac{\partial \ell}{\partial a_j}
= \delta_{\text{salida}}\,v_j\,h_j(1-h_j)
$$

Después usamos que `a_j` era una suma ponderada de las entradas:

$$
\begin{aligned}
\frac{\partial \ell}{\partial w_{jk}} &= \delta_j x_k \\\\
\frac{\partial \ell}{\partial b_j} &= \delta_j
\end{aligned}
$$

Ya tenemos las derivadas de todos los pesos y todos los bias, la etiqueta solo estaba en la salida, pero la regla de la cadena nos ha permitido calcular cómo influyen también los parámetros de la primera capa.

Aquí cada neurona oculta conecta con una sola neurona de salida, si conectara con varias, habría que sumar las contribuciones de los distintos caminos, no elegir uno y olvidarnos del resto.

Fíjate también en que el signo y el tamaño de `v_j` importan, no todas las neuronas reciben la misma corrección, porque no todas están afectando de la misma forma al resultado.

### Corregimos uno de los pesos del ejemplo

Volvamos a la entrada `[1, 0]`, donde habíamos obtenido `p ≈ 0.521372` y esperábamos `1`:

$$
\delta_{\text{salida}} \approx 0.521372 - 1 = -0.478628
$$

Para la primera neurona oculta, cuyo peso hacia la salida era `0.7`:

$$
\delta_1 \approx -0.478628 \cdot 0.7 \cdot 0.549834 \cdot (1-0.549834)
\approx -0.082928
$$

El peso que multiplica a `x1` recibe ese gradiente multiplicado por `x1 = 1`, así que sigue siendo `-0.082928`.

Con una tasa de aprendizaje de `0.1`, su actualización sería:

$$
w_{11,\text{nuevo}} = 0.2 - 0.1 \cdot (-0.082928) \approx 0.208293
$$

El peso sube un poco nada más, tiene sentido con estos valores, aumentar la primera activación oculta ayuda a subir la salida, y para esta fila queremos acercarnos a `1`.

En cambio, el peso de esa misma neurona que multiplica a `x2` tiene gradiente cero para esta observación, porque `x2 = 0`. No significa que ese peso no sirva para nada, significa que esta fila concreta no aporta una corrección para él.

![backpropagation_y_actualizacion](https://img.iadev.blog/posts/02_backpropagation_y_actualizacion.png)

Esto es una cuenta de **una observación y un peso**, para poder seguirla, el programa calculará los gradientes de todos los parámetros sobre las cuatro filas antes de cambiar ninguno

## Calcular gradientes y actualizar pesos son dos cosas

Backpropagation nos devuelve las derivadas y el descenso de gradiente utiliza esas derivadas para hacer la actualización:

$$
\theta_{\text{nuevo}} = \theta - \eta\frac{\partial J}{\partial\theta}
$$

`theta` representa cualquiera de nuestros parámetros y `eta` es la tasa de aprendizaje, como `J` es una media, su gradiente también es la media de las contribuciones de cada observación.

Usaremos **lote completo**, igual que en el artículo de [descenso de gradiente](/posts/descenso-de-gradiente-go-machine-learning/), recorremos las cuatro filas, acumulamos los gradientes y después actualizamos, en este ejemplo una epoch coincide con una actualización de los parámetros, con mini-lotes no sería necesariamente así.

Tenemos que tener cuidado con un detalle importante al programar, porque lo podemos romper, el gradiente de la capa oculta necesita los pesos de salida **con los que hicimos el forward**, no unos pesos que acabemos de modificar a mitad de la cuenta.

Por eso separaremos el cálculo y la actualización, primero obtenemos todos los gradientes, después tocamos el modelo, actualizar `W2` y usar ese `W2` nuevo para calcular la corrección de `W1` sería mezclar dos estados distintos de la red.

## Esta vez no empezamos con todos los pesos a cero

En los modelos anteriores era ideal empezar con ceros, pero aquí tenemos dos neuronas ocultas que deberían poder aprender comportamientos distintos.

Si las dejamos con los mismos pesos, los mismos bias y las mismas conexiones de salida, calculan lo mismo y reciben las mismas correcciones, entonces, tener dos copias de la misma neurona no nos está dando dos comportamientos diferentes, por muchas vueltas que demos.

Es el problema de simetría que explican los [apuntes sobre inicialización de pesos](https://cs231n.github.io/neural-networks-2/), en este ejemplo pondremos los pesos en valores pseudoaleatorios entre `-1` y `1`, sin incluir el extremo superior, y dejaremos los bias a cero, no hace falta que los bias también sean aleatorios si ya hemos roto la simetría con los pesos.

Usaremos una semilla fija para repetir el arranque, la semilla no contiene la solución, pero sí decide desde dónde empezamos a buscarla, y eso puede cambiar el resultado, más abajo probaremos otro arranque para no quedarnos solo con el que sale bien.

## La implementación completa en Go

Lo dejaremos en un `main.go`, con dimensiones fijas como en el post del perceptrón, no voy a montar una interfaz de capas, un registro de activaciones y un factory de optimizadores para multiplicar nueve números, primero que se entienda lo que hace de la forma mas simple posible.

`W1[j][k]` significa el peso de la entrada `k` hacia la neurona oculta `j`, en las fórmulas empezamos a contar en uno y pero para programar claramente debemos empezar a contar desde 0, luego el resto es el mismo recorrido que acabamos de escribir.

Crea una carpeta nueva para no mezclar este `main` con el del artículo anterior:

Esto nos quedaría en `main.go`:

```go
package main

import (
	"fmt"
	"log"
	"math"
	"math/rand"
)

type Sample struct {
	X [2]float64
	Y float64
}

type Network struct {
	W1 [2][2]float64 // [neurona oculta][entrada]
	B1 [2]float64
	W2 [2]float64 // De cada neurona oculta a la salida.
	B2 float64
}

type Gradients struct {
	W1 [2][2]float64
	B1 [2]float64
	W2 [2]float64
	B2 float64
}

func finite(x float64) bool {
	return !math.IsNaN(x) && !math.IsInf(x, 0)
}

func NewNetwork(seed int64) Network {
	rng := rand.New(rand.NewSource(seed))
	var model Network
	for j := range model.W1 {
		for k := range model.W1[j] {
			model.W1[j][k] = 2*rng.Float64() - 1
		}
		model.W2[j] = 2*rng.Float64() - 1
	}

	return model // Los bias empiezan a cero, los pesos no
}

func sigmoid(z float64) float64 {
	if z >= 0 {
		return 1 / (1 + math.Exp(-z))
	}

	e := math.Exp(z)

	return e / (1 + e)
}

// Forward no modifica pesos, retorna NaN si una suma es infinita
func (model Network) Forward(x [2]float64) (h [2]float64, z, p float64) {
	for j := range h {
		a := model.B1[j]
		for k := range x {
			a += model.W1[j][k] * x[k]
		}
		if !finite(a) {
			return h, math.NaN(), math.NaN()
		}
		h[j] = sigmoid(a)
	}
	z = model.B2
	for j := range h {
		z += model.W2[j] * h[j]
	}

	if !finite(z) {
		return h, math.NaN(), math.NaN()
	}

	return h, z, sigmoid(z)
}

// Train valida los datos antes de llamar a esta función.
func (model Network) lossAndGradients(data []Sample) (float64, Gradients) {
	var total float64
	var g Gradients // Acumuladores nuevos en cada llamada.
	n := float64(len(data))

	for _, sample := range data {
		h, z, p := model.Forward(sample.X)
		total += math.Max(z, 0) - sample.Y*z + math.Log1p(math.Exp(-math.Abs(z)))

		// El /n incorpora la media en TODOS los gradientes.
		dOut := (p - sample.Y) / n
		g.B2 += dOut
		for j := range h {
			g.W2[j] += dOut * h[j]
			dHidden := dOut * model.W2[j] * h[j] * (1 - h[j])
			g.B1[j] += dHidden
			for k := range sample.X {
				g.W1[j][k] += dHidden * sample.X[k]
			}
		}
	}
	return total / n, g
}

func (model *Network) step(g Gradients, rate float64) {
	for j := range model.W1 {
		for k := range model.W1[j] {
			model.W1[j][k] -= rate * g.W1[j][k]
		}
		model.B1[j] -= rate * g.B1[j]
		model.W2[j] -= rate * g.W2[j]
	}
	model.B2 -= rate * g.B2
}

// Entrena una copia del modelo inicial; history[0] es la pérdida inicial.
func Train(initial Network, data []Sample, rate float64, epochs int) (Network, []float64, error) {
	if len(data) == 0 || epochs <= 0 || !finite(rate) || rate <= 0 {
		return Network{}, nil, fmt.Errorf("necesitamos datos, epochs positivos y una tasa positiva y finita")
	}
	for i, sample := range data {
		if sample.Y != 0 && sample.Y != 1 {
			return Network{}, nil, fmt.Errorf("muestra %d: la etiqueta debe ser 0 o 1", i)
		}
		for _, x := range sample.X {
			if !finite(x) || x < 0 || x > 1 {
				return Network{}, nil, fmt.Errorf("muestra %d: este ejemplo requiere entradas entre 0 y 1", i)
			}
		}
	}

	model := initial
	loss, g := model.lossAndGradients(data)
	if !finite(loss) {
		return Network{}, nil, fmt.Errorf("pérdida inicial no finita")
	}
	history := []float64{loss}

	for epoch := 1; epoch <= epochs; epoch++ {
		model.step(g, rate) // Todos los gradientes ya están calculados.
		loss, g = model.lossAndGradients(data)
		if !finite(loss) {
			return Network{}, nil, fmt.Errorf("cálculo no finito en epoch %d", epoch)
		}
		history = append(history, loss)
	}
	return model, history, nil
}

func xorData() []Sample {
	return []Sample{
		{X: [2]float64{0, 0}, Y: 0},
		{X: [2]float64{0, 1}, Y: 1},
		{X: [2]float64{1, 0}, Y: 1},
		{X: [2]float64{1, 1}, Y: 0},
	}
}

func main() {
	data := xorData()
	model, history, err := Train(NewNetwork(42), data, 1.0, 5000)
	if err != nil {
		log.Fatal(err)
	}
	for _, epoch := range []int{0, 1, 10, 100, 1000, 5000} {
		fmt.Printf("Epoch %4d | Loss: %.6f\n", epoch, history[epoch])
	}
	fmt.Println()
	correct := 0
	for _, sample := range data {
		h, _, p := model.Forward(sample.X)
		class := 0
		if p >= 0.5 {
			class = 1
		}
		if class == int(sample.Y) {
			correct++
		}
		fmt.Printf("x=%v -> h=[%.4f %.4f] p=%.6f clase=%d esperado=%.0f\n",
			sample.X, h[0], h[1], p, class, sample.Y)
	}
	fmt.Printf("Aciertos sobre las cuatro filas: %d/%d\n", correct, len(data))
}
```

La parte nueva está sobre todo en estas dos líneas:

```go
dOut := (p - sample.Y) / n
dHidden := dOut * model.W2[j] * h[j] * (1 - h[j])
```

La primera calcula la señal de salida, la segunda la lleva a la capa oculta, el `/n` de `dOut` ya incorpora la media en todo lo que viene después, no tenemos que volver a dividir los gradientes al actualizar.

`lossAndGradients` crea acumuladores nuevos en cada llamada y no modifica el modelo, `step` aplica la actualización y `Train` organiza las repeticiones, al terminar cada actualización volvemos a calcular la pérdida y los gradientes del estado nuevo, así el historial describe el modelo después de cada paso y ya tenemos preparada la siguiente corrección.

### La pérdida del código parece otra fórmula

En el texto la hemos escrito con `ln(p)` y `ln(1-p)`, pero el código utiliza directamente `z`, el valor anterior a la sigmoide:

$$
\ell(z,y) = \max(z,0) - yz + \ln\left(1 + e^{-|z|}\right)
$$

Es la misma entropía cruzada, escrita de una forma que evita calcular `log(0)` si una probabilidad se redondea a cero o uno, la [documentación de TensorFlow muestra cómo se obtiene esta expresión estable](https://www.tensorflow.org/api_docs/python/tf/nn/sigmoid_cross_entropy_with_logits).

`math.Log1p(v)` calcula `ln(1+v)` con más precisión cerca de cero, como indica la [documentación de Go](https://pkg.go.dev/math#Log1p), las dos ramas de `sigmoid` también evitan pedir exponenciales enormes, no son dos activaciones distintas.

Esto sigue sin hacer que cualquier cálculo sea imposible de desbordar, por eso mantenemos las comprobaciones de valores finitos.

## Vamos a ejecutarlo

Esto sería el resultado

```text
Epoch    0 | Loss: 0.692380
Epoch    1 | Loss: 0.692345
Epoch   10 | Loss: 0.692027
Epoch  100 | Loss: 0.678383
Epoch 1000 | Loss: 0.016698
Epoch 5000 | Loss: 0.002078

x=[0 0] -> h=[0.9999 0.9601] p=0.001770 clase=0 esperado=0
x=[0 1] -> h=[0.9516 0.0144] p=0.998136 clase=1 esperado=1
x=[1 0] -> h=[0.9517 0.0146] p=0.998133 clase=1 esperado=1
x=[1 1] -> h=[0.0448 0.0000] p=0.002803 clase=0 esperado=0
Aciertos sobre las cuatro filas: 4/4
```

La pérdida baja desde aproximadamente `0.692380` hasta `0.002078`, y las cuatro clases finales coinciden con la tabla de XOR ahora sí, no hemos puesto una condición especial para `[1, 1]` dentro del forward, esa respuesta sale de los parámetros que ajustó el entrenamiento.

Mira la capa oculta, para `[0, 0]` las dos activaciones son altas, para `[0, 1]` y `[1, 0]` la primera es alta y la segunda baja y para `[1, 1]` las dos son bajas. La salida ya no recibe las esquinas originales del cuadrado, recibe esa representación transformada.

Con esta inicialización, sus pesos finales son aproximadamente:

```text
W2 = [13.629155, -14.038987]
B2 = -6.484500
```

La primera activación empuja la salida hacia arriba, la segunda hacia abajo, y el bias desplaza el resultado, ahora podemos mirar las cuentas y entender por qué la combinación de activaciones de los dos casos positivos termina dando una salida alta.

No le hemos exigido a una neurona que aprenda una compuerta concreta, estos valores aparecieron al reducir la pérdida, otro entrenamiento podría encontrar una representación diferente que también separase las cuatro filas.

PD: el `0.0000` que ves en una activación está redondeado a cuatro decimales, no significa que la neurona haya devuelto exactamente cero, igual que `p = 0.998136` no es una garantía universal del 99.8136 %, es la salida de este modelo sobre esa entrada.

## Que acierte XOR no demuestra que las derivadas estén bien

Puede que un error pequeño en el entrenamiento todavía permita resolver este ejemplo, si queremos comprobar backpropagation, podemos hacer algo más directo que mirar si la salida queda bonita.

Tomamos un parámetro, lo subimos un poco, calculamos la pérdida, lo bajamos un poco desde su valor original y la calculamos otra vez, con eso aproximamos su derivada mediante diferencias finitas centradas:

$$
\frac{\partial J}{\partial\theta}
\approx \frac{J(\theta+\varepsilon)-J(\theta-\varepsilon)}{2\varepsilon}
$$

Los demás parámetros se quedan quietos, después comparamos esa pendiente con el gradiente que nos devolvió backpropagation, es una [comprobación de gradientes](https://cs231n.github.io/neural-networks-3/), no otra forma de entrenar que vayamos a utilizar aquí.

No elegimos un `epsilon` absurdamente pequeño, porque restar resultados casi iguales también tiene problemas de precisión, para estas cuentas usaremos `1e-5` y una tolerancia que combina una parte absoluta con otra relativa.

## Ahora cambiamos el arranque

En la llamada a `Train`, sustituye `NewNetwork(42)` por `NewNetwork(123)`, sin cambiar la tasa ni las 5.000 epochs, también puedes probar `Network{}`, que deja los nueve parámetros a cero.

Los resultados con este mismo código son:

| Inicialización    | Pérdida tras 5.000 epochs | Aciertos |
| ----------------- | ------------------------- | -------- |
| `NewNetwork(42)`  | 0.002078                  | 4/4      |
| `NewNetwork(123)` | 0.347817                  | 2/4      |
| `Network{}`       | 0.693147                  | 2/4      |

Con todo a cero, las activaciones ocultas y la salida valen `0.5`, los gradientes de la primera capa son cero porque sus pesos hacia la salida también son cero, y las contribuciones de las dos etiquetas positivas y las dos negativas se cancelan en la salida, con este lote completo, el modelo se queda exactamente donde empezó.

![inicializacion_cambia_el_resultado](https://img.iadev.blog/posts/03_inicializacion_cambia_el_resultado.png)

No es que haya que tener un poquito más de paciencia, es que estamos repitiendo una actualización nula.

Con la semilla `123` sí se mueve, pero al terminar no separa las cuatro filas. Para `[0, 1]` produce aproximadamente `0.499603`, y para `[1, 1]`, `0.500759`, justo al lado incorrecto del umbral en los dos casos.

Eso no demuestra que esa arquitectura sea incapaz de resolver XOR, acabamos de verla cómo si lo hacía, tampoco basta para afirmar que hemos identificado un mínimo local concreto, solo hemos comprobado que este arranque y este entrenamiento no han llegado a una solución correcta dentro del límite elegido.

**Capacidad del modelo y resultado del entrenamiento no son lo mismo.** Con el perceptrón faltaba capacidad para representar esa separación, aquí la capacidad existe, pero todavía tenemos que encontrar unos parámetros que la aprovechen.

La tasa de `1.0` también es una elección para este ejemplo y para esta pérdida media, si cambiamos la escala, la activación o la forma de acumular los gradientes, habrá que revisar cómo estamos entrenando.

Además, la sigmoide puede saturarse, por ejemplo si una activación oculta se acerca mucho a cero o a uno, `h*(1-h)` se hace pequeño y atenúa la señal que pasa hacia sus pesos, es una de las [limitaciones de esta activación](https://cs231n.github.io/neural-networks-1/).

Y no hemos añadido un criterio de convergencia, simplemente hacemos 5.000 actualizaciones, que el contador llegue al final no demuestra que hayamos encontrado el mejor ajuste posible.

## Qué queda después de entrenar

Lo aprendido está en `W1`, `B1`, `W2` y `B2`, los nueve números de `Network`, para reutilizar el modelo guardaríamos esos valores y conservaríamos también la arquitectura, la activación y la forma de representar las entradas.

El historial, como siempre, solo sirve para inspeccionar el entrenamiento, no hace falta para predecir, tampoco necesitamos las etiquetas ni volver a recorrer las 5.000 epochs cada vez que llega una entrada.

Solo hacemos el forward:

```go
_, _, p := model.Forward([2]float64{1, 0})
```

Eso es inferencia, en esta implementación no modifica ningún peso, llamar al modelo muchas veces no hace que siga aprendiendo por su cuenta.

Y qué nos ahorraría entonces un framework? Entre otras cosas, escribir estas derivadas para cada arquitectura, somos programadores, no matemáticos (aunque sea simple) por ejemplo, [el sistema de diferenciación automática de PyTorch](https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html) registra las operaciones y calcula los gradientes recorriendo ese grafo con la regla de la cadena y mucho de esto se hace agnóstico para nosotros.

Nosotros hemos dejado el grafo fijado en el código y escrito las derivadas a mano porque son pocas y podemos revisarlas, no hemos construido un motor general de diferenciación automática, y ampliar esta implementación a una red mucho mayor no sería tan simple como cambiar un `2` por un `2000`.

Ya lo comentaba al hablar de [Go, Rust, Node y Python](/posts/go-rust-node-python-para-2027-que-elegir/): elegir Go para entender un algoritmo no obliga a sustituir las herramientas científicas por utilidades propias.

Cuando lo que necesite sea trabajar con modelos más grandes, siempre prefiero dedicar el tiempo al problema, los datos y la evaluación, no a mantener mi versión artesanal de todo lo que ya existe.

## Hasta aquí este recorrido

Empezamos con una [regresión lineal](/posts/regresion-lineal-go-o-harness-de-agentes/) que ajustaba dos números, después vimos cómo encontrarlos mediante descenso de gradiente y cómo usar una sigmoide y una pérdida para clasificar, después con [K-Means](/posts/k-means-go-agrupar-datos-sin-preguntarle-a-un-llm/) nos fuimos por otra rama, agrupar sin etiquetas.

Luego construimos un perceptrón, vimos una limitación concreta y ahora hemos combinado varias neuronas para superarla, calculando también cómo corregir los parámetros que están lejos de la salida.

Con esto no hemos aprendido todo sobre ML ni hemos estado cerca de construir un modelo de lenguaje como gpt, pero sí podemos leer este recorrido sin imaginar que hay alguien pensando dentro o que es magia negra:

```text
Entradas → forward → pérdida → backpropagation → actualizar pesos
              ↑                                        |
              └──────── repetir con los nuevos pesos ───┘
```

En cada ciclo volvemos a hacer el forward con los parámetros nuevos, calculamos otra pérdida y sus gradientes, y decidimos cuánto movernos, nosotros seguimos eligiendo los datos, el modelo, la función que queremos reducir y la manera de comprobar el resultado.

A mí eso me parece bastante más interesante que conseguir que un ejemplo arranque y ya está, ahora, si la red no aprende, podemos mirar si el modelo representa lo que queremos, si los gradientes corresponden a la pérdida o si el entrenamiento se ha quedado atascado.
