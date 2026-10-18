# IADev Terminal Art — SVG ultraminimalista optimizado

Genera una ilustración vectorial minimalista para una miniatura del blog tecnológico satírico.

## 1. Estilo visual obligatorio

Arte ASCII geométrico inspirado en terminales Unix clásicas de los años 80 y 90.

La ilustración debe parecer un **pictograma construido con caracteres de terminal**, pero implementado mediante geometría SVG optimizada.

**Paleta estricta:**

- Fondo: `#0D0F14`.
- Principal: `#B8B8B5`.
- Secundario: `#777777`.
- Acento opcional: `#4FC3F7`.

**Estética:**

- Diseño plano, bidimensional y geométrico.
- Trazos gruesos, rectos y pixelados.
- Sin sombras, degradados, brillos ni texturas.
- Sin antialiasing decorativo.
- Sin efectos visuales complejos.
- Muchísimo espacio negativo.
- Estilo retrocomputación y terminal ASCII.

## 2. Composición

**Minimalismo extremo.**

- Un único símbolo protagonista, centrado.
- Máximo 1–2 elementos visuales.
- Inspiración en caracteres ASCII: `#`, `/`, `\`, `|`, `_`, `+`, `>`, `{}`, `[]`.
- Silueta reconocible incluso a 32 × 32 píxeles.
- Sin elementos decorativos ni símbolos flotantes.
- Sin textos, títulos ni etiquetas.
- Sin perspectiva 3D.
- El protagonista ocupa aproximadamente el 70 % del lienzo.
- Priorizar una metáfora visual sencilla, ingeniosa y satírica.

## 3. Concepto del artículo

**Título:** [post.title]

**Idea:** [post.description]

Representa la ironía del artículo mediante una única metáfora visual extremadamente sencilla.

Evita escenas narrativas, ilustraciones detalladas y representaciones literales.

## 4. Implementación SVG obligatoria

Genera **código SVG real**, no una imagen rasterizada ni una representación visual del código.

**Especificaciones:**

- Dimensiones: `100 × 100`.
- `viewBox="0 0 100 100"`.
- Fondo opaco `#0D0F14`.
- SVG autónomo, sin dependencias externas.
- Geometría vectorial nativa.
- Preferir `<path>` y `<rect>`.
- Usar `shape-rendering="crispEdges"` cuando corresponda.
- No utilizar fuentes, elementos `<text>` ni caracteres Unicode renderizados.
- Construir los símbolos ASCII mediante trazados geométricos.

## 5. Optimización extrema

**El tamaño del archivo es una prioridad absoluta.**

Aplicar estas reglas:

1. Minimizar el número de nodos SVG.
2. Combinar formas del mismo color en un único `<path>` siempre que sea posible.
3. Reducir la precisión numérica de las coordenadas.
4. Eliminar grupos `<g>` innecesarios.
5. Eliminar atributos redundantes y valores predeterminados.
6. Evitar `defs`, `clipPath`, `mask`, `filter`, `pattern`, gradientes y transformaciones innecesarias.
7. No incluir comentarios, metadatos, identificadores ni atributos de editores gráficos.
8. No incluir CSS, JavaScript ni animaciones.
9. No incrustar imágenes rasterizadas, Base64 ni fuentes.
10. Minificar el XML eliminando espacios y saltos de línea innecesarios.

**Objetivo de tamaño:**

- Ideal: menos de 500 bytes.
- Preferible: menos de 1 KB.
- Máximo orientativo: 2 KB.

Simplificar la ilustración antes de superar estos límites. No sacrificar la legibilidad del icono únicamente para reducir unos pocos bytes.

## 6. Exportación y verificación obligatorias

1. Generar el SVG vectorial original.
2. Guardarlo como `thumbnail.svg`.
3. Optimizarlo con SVGO o una herramienta equivalente, si está disponible.
4. Verificar programáticamente que:
   - Es XML/SVG válido.
   - Tiene `viewBox="0 0 100 100"`.
   - No contiene imágenes rasterizadas.
   - No contiene dependencias externas.
   - No contiene metadatos ni elementos innecesarios.
   - Utiliza únicamente los colores permitidos.
5. Comprobar el tamaño final en bytes.
6. Entregar el archivo SVG real descargable.

**No entregar únicamente una previsualización, código sin guardar o un PNG renombrado como SVG.**

## 7. Resultado esperado

Un pictograma ASCII vectorial, geométrico, satírico y reconocible, con un peso mínimo y una identidad visual consistente con IADev.

**Prioridad:** claridad visual → simplicidad geométrica → optimización del SVG → fidelidad al concepto del artículo.

Entregar exclusivamente el archivo `thumbnail.svg` y una confirmación breve de su tamaño en bytes y validación.
