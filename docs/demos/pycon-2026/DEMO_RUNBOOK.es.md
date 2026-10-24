# Runbook de presentación — impacto de `GenerationMixin.generate`

## Respuesta práctica

Con el checkout fijado, una herramienta determinista de Python localiza la definición de `GenerationMixin.generate`, una llamada desde `TextGenerationPipeline`, ejemplos de herencia, la configuración pública y referencias de pruebas. El resultado reduce el material citado a evidencia acotada y localizable; **no demuestra el impacto completo en tiempo de ejecución**.

El artefacto de evidencia informa 13 archivos citados: 3.682 bytes de metadatos frente a 816.502 bytes de archivos completos citados (99,55 % menos bytes). Esta métrica compara tamaños; no mide tokens ni equivalencia semántica. `MODEL_ANALYSIS` permanece `NOT_RUN`: el análisis con modelos locales o de frontera es la siguiente capa, no una ejecución de esta captura.

## Entorno y entradas inmutables

La validación de este runbook se realizó en macOS arm64, Python 3.14.6, Node.js 26.4.0 y npm 11.17.0. El proyecto requiere Node.js 20 o superior; el comando de evidencia usa solo la biblioteca estándar de Python. El paquete Remotion fija Remotion/CLI 4.0.537 y React 18.3.1. La vista previa y el render requieren sus dependencias ya instaladas; no instalar dependencias durante la presentación. No se necesitan pesos, GPU ni llamadas a modelos.

Al sincronizar el proyecto para la demostración, el fixture queda en `$DEMO_ROOT/transformers`. Ejecutar el bloque desde la raíz del checkout Pudu sincronizado para que `git rev-parse` establezca `PUDU_ROOT` sin asumir el nombre de su carpeta:

```sh
export DEMO_ROOT=/Volumes/KINGSTON/pudu-pycon-2026
export PUDU_ROOT="$(git rev-parse --show-toplevel)"
```

- Fixture de lectura únicamente: `$DEMO_ROOT/transformers`.
- Repositorio de la demostración: raíz Git detectada en `$PUDU_ROOT`.
- Fixture: `huggingface/transformers`, etiqueta `v5.20.2`, commit `18329f1065382e54db698e242cf98bd3f3e5a766`.
- Evidencia de implementación: `4df6d9a467c3b2ec18c35d8cf16292eb31d13947`; generador e informe: `27448a68ad4544119d4b44b8640a4aa81ca238be`; composición Remotion: `ecce5f24a991b5a0b0c659303ebaeaef996f3de9` y `a1f2f5e18b1fea60aade58016e8f74e3fd36ff11`.
- El informe y el video son artefactos de la demostración, no modificaciones del fixture.
- Interfaces auditables: [recolector](../../../python/pudu_agent/transformers_evidence.py), [generador del informe](../../../python/pudu_agent/transformers_report.py), [pruebas focalizadas](../../../python/tests/test_transformers_evidence.py) y [scripts Remotion](remotion/package.json).

## Preflight y comandos

Ejecutar desde una terminal con el disco Kingston montado. Los comandos de generación del informe escriben en `/tmp`; no sobrescriben los snapshots verificados.

- [ ] Confirmar que `$DEMO_ROOT/transformers` es el fixture de solo lectura y que `$PUDU_ROOT` contiene el proyecto sincronizado.
- [ ] Confirmar que Node/npm y las dependencias del paquete Remotion ya están disponibles.
- [ ] Mantener abiertos los snapshots y el MP4 verificados como fallback.
- [ ] No descargar pesos, instalar paquetes ni activar llamadas a modelos.

### 1. Validar identidad y estado del fixture

```sh
git -C "$DEMO_ROOT/transformers" rev-parse --show-toplevel
test "$(git -C "$DEMO_ROOT/transformers" rev-parse HEAD)" = "18329f1065382e54db698e242cf98bd3f3e5a766"
test "$(git -C "$DEMO_ROOT/transformers" describe --tags --exact-match HEAD)" = "v5.20.2"
test -z "$(git -C "$DEMO_ROOT/transformers" status --porcelain)"
```

La primera orden debe imprimir `$DEMO_ROOT/transformers`; las tres verificaciones siguientes deben terminar con código 0. Si falla cualquier verificación, **no** ejecutar el recolector ni atribuir resultados a la versión fijada.

### 2. Comprobar interfaces y recopilar evidencia

```sh
cd "$PUDU_ROOT"
PYTHONPATH=python python3 -m pudu_agent.transformers_evidence --help
PYTHONPATH=python python3 -m pudu_agent.transformers_report --help
PYTHONPATH=python python3 -m pudu_agent.transformers_evidence "$DEMO_ROOT/transformers" > /tmp/pycon-transformers-evidence.json
```

La colección valida que la ruta sea la raíz real del repositorio, verifica commit y etiqueta, y luego usa AST de Python sobre rutas concretas y árboles de modelos y pruebas con límites deterministas. No ejecuta pruebas de Transformers ni interpreta contenido del repositorio como instrucciones.

### 3. Regenerar el informe sin tocar los snapshots

```sh
mkdir -p /tmp/pycon-transformers-report
PYTHONPATH=python python3 -m pudu_agent.transformers_report "$DEMO_ROOT/transformers" --output-dir /tmp/pycon-transformers-report
cmp /tmp/pycon-transformers-report/report.json "$PUDU_ROOT/docs/demos/pycon-2026/evidence/report.json"
cmp /tmp/pycon-transformers-report/report.md "$PUDU_ROOT/docs/demos/pycon-2026/evidence/report.md"
```

Ambos `cmp` deben finalizar sin diferencias. El generador produce JSON y Markdown desde el mismo objeto de evidencia en memoria. El comando no ejecuta análisis de modelos ni pruebas del fixture.

### 4. Pruebas del recolector y del informe

```sh
cd "$PUDU_ROOT"
PYTHONPATH=python python3 -m unittest python.tests.test_transformers_evidence python.tests.test_transformers_report -v
PYTHONPATH=python python3 -m unittest discover -s python/tests -v
```

Resultado registrado: pruebas focalizadas del recolector/informe **8/8**; suite Python **45 pruebas, 1 omitida** por requerir `PUDU_INTEGRATION=1` y Ollama activo. Remotion: pruebas de timeline **11/11**, typecheck aprobado y dos composiciones descubiertas. La prueba de integración omitida no forma parte de la verificación de impacto del fixture.

### 5. Vista previa y render Remotion

```sh
cd "$PUDU_ROOT/docs/demos/pycon-2026/remotion"
npm test
npm run typecheck
npm run compositions
npm exec -- remotion studio src/index.tsx --no-open
npm run render-transformers
```

Los primeros tres comandos son las comprobaciones registradas para la composición. `npm exec ... studio` abre la vista previa local; `--no-open` evita abrir el navegador automáticamente. El último comando vuelve a renderizar y sobrescribe `../pycon-2026-transformers-demo.mp4`; ejecutarlo solo si se decidió regenerar el video. El paquete define el script `render-transformers` para la composición `PyConTransformersDemo`.

### 6. Verificar artefactos

```sh
test -s "$PUDU_ROOT/docs/demos/pycon-2026/evidence/report.json"
test -s "$PUDU_ROOT/docs/demos/pycon-2026/evidence/report.md"
test -s "$PUDU_ROOT/docs/demos/pycon-2026/pycon-2026-transformers-demo.mp4"
shasum -a 256 "$PUDU_ROOT/docs/demos/pycon-2026/pycon-2026-transformers-demo.mp4"
ffprobe -v error -show_entries format=duration -show_entries stream=codec_name,width,height,r_frame_rate -of default=noprint_wrappers=1 "$PUDU_ROOT/docs/demos/pycon-2026/pycon-2026-transformers-demo.mp4"
```

SHA-256 verificado del MP4: `16d4295188f1fca85bbaa11e1b7e116c70261d9617f971d1340f5fcd7d4e26d3`. Características verificadas: H.264, 1920×1080, 30/1 fps y 90 segundos. SHA-256 de los snapshots: JSON `e2bfdb94a2616dbc4cb13077d5cb7a1cec210db685bc6ad58879b6d95aaff5bb`; Markdown `90729d713d2f420150a0703a28cadc95112c7aed6fc24f0f14707cd992f70282`.

## Resultados observados

El [informe JSON](evidence/report.json) es la fuente estructurada; el [informe Markdown](evidence/report.md) es su proyección legible. La captura incluye:

| Grupo | Cantidad | Lectura correcta |
|---|---:|---|
| Definición de mixin y método | 2 ubicaciones | Estructura confirmada en fuente |
| Llamada de `TextGenerationPipeline` | 1 ubicación | Llamada léxica confirmada |
| Clases con herencia del mixin | 8 ubicaciones | Candidatos de impacto; participación en ejecución inferida |
| `GenerationConfig` | 1 ubicación | Contrato de configuración pública |
| Llamadas léxicas en pruebas | 8 ubicaciones | Referencias encontradas; no se ejecutaron esas pruebas |
| Impacto completo en runtime | No establecido | `UNRESOLVED` |

Medición registrada: **3.682 / 816.502 bytes**, 13 archivos citados, **99,55 %** menos bytes para los metadatos del informe frente al tamaño completo de esos archivos. Es una comparación determinista del tamaño de bytes, no una medición de tokens ni una afirmación de equivalencia semántica.

## Guion de demostración en vivo — 9 minutos

| Tiempo | Acción | Narración y resultado esperado |
|---|---|---|
| 0:00–1:00 | Plantear la pregunta | “Si cambia `GenerationMixin.generate`, ¿qué código aparece como posible superficie de impacto? No vamos a confundir candidatos estáticos con comportamiento probado.” |
| 1:00–2:00 | Ejecutar las cuatro verificaciones Git del preflight | Mostrar la ruta raíz, el commit y `v5.20.2`. Aclarar que el fixture no se modifica. |
| 2:00–3:30 | Ejecutar la colección Python | Mostrar el comando y explicar que valida raíz, commit y etiqueta antes de inspeccionar AST. La salida JSON es acotada y repetible. |
| 3:30–5:00 | Abrir el [JSON](evidence/report.json) y el [Markdown](evidence/report.md) | Recorrer las ubicaciones de definición, caller, herencia, configuración y pruebas. Leer rutas relativas y líneas, no inferir llamadas dinámicas. |
| 5:00–6:15 | Mostrar las etapas del informe | Identidad `VERIFIED`; recolección AST y medición `COMPLETED`; pruebas de runtime y `MODEL_ANALYSIS` `NOT_RUN`. Explicar qué significa cada estado. |
| 6:15–7:15 | Interpretar la medición | 3.682 bytes de metadatos frente a 816.502 bytes de los 13 archivos citados. Decir explícitamente: “bytes, no tokens; reducción de tamaño, no equivalencia semántica”. |
| 7:15–8:15 | Presentar los límites | No se ejecutó ripgrep ni ast-grep como medición comparativa; no se hizo traversal completo de grafo, prueba de runtime ni llamada a modelo. La siguiente capa puede entregar esta evidencia acotada a modelos locales o de frontera. |
| 8:15–9:00 | Cerrar o activar fallback | Si la demo en vivo sigue disponible, abrir el [MP4 verificado](pycon-2026-transformers-demo.mp4); resumir que la evidencia reduce contexto inspeccionable sin cerrar la pregunta de impacto en runtime. |

## Secuencia completa de charla — 30 minutos

| Minutos | Bloque | Objetivo |
|---|---|---|
| 0–3 | Apertura y problema | Presentar el costo de buscar impacto en un repositorio grande y formular una pregunta concreta. |
| 3–6 | Caso y límites | Presentar `GenerationMixin.generate`, el snapshot fijado y la diferencia entre evidencia de código y prueba de runtime. |
| 6–15 | Demostración | Ejecutar el guion de nueve minutos: identidad, colección, ubicaciones, estados y medición. |
| 15–20 | Lectura crítica | Distinguir `CONFIRMED`, `INFERRED` y `UNRESOLVED`; explicar por qué las ubicaciones de herencia no prueban uso dinámico. |
| 20–24 | Siguiente capa de análisis | Explicar cómo los modelos locales y de frontera podrían consumir evidencia acotada. No atribuir calidad, latencia ni resultado a una ejecución inexistente: `MODEL_ANALYSIS` está `NOT_RUN`. |
| 24–27 | Fallos y reproducibilidad | Mostrar verificaciones de identidad y comparar snapshots; cubrir fallback con los artefactos guardados. |
| 27–30 | Límites y cierre | Repetir qué se observó, qué sigue abierto y el takeaway: automatizar la recolección trazable; mantener las conclusiones bajo control humano. |

## Narración por etapa

| Etapa del informe | Estado observado | Qué decir |
|---|---|---|
| `FIXTURE_IDENTITY` | `VERIFIED` | La ruta corresponde a la raíz del checkout; commit y etiqueta coinciden con el pin. |
| `BOUNDED_PYTHON_AST_EVIDENCE` | `COMPLETED` | Se inspeccionó AST de rutas y árboles Python configurados con límites deterministas. Esto no es búsqueda semántica completa ni traversal de todo el grafo. |
| `REPORT_AND_CONTEXT_MEASUREMENT` | `COMPLETED` | JSON y Markdown se derivan de la misma evidencia; la métrica mide tamaños de bytes de metadatos y archivos citados. |
| `RUNTIME_TESTS` | `NOT_RUN` | La herramienta no ejecutó pruebas ni el modelo. Las llamadas encontradas en pruebas son referencias de código, no resultados de pruebas. |
| `MODEL_ANALYSIS` | `NOT_RUN` | La comparación de modelos locales o de frontera es una siguiente fase; no hay llamada, calidad, latencia ni telemetría que reportar aquí. |

## Plan de contingencia

- **Disco ausente, checkout distinto o fixture sucio:** no improvisar otro snapshot. Presentar el [informe Markdown](evidence/report.md) y aclarar que la ejecución viva se detuvo en preflight.
- **Python o dependencias no disponibles:** continuar desde el [JSON guardado](evidence/report.json) y sus ubicaciones relativas; no instalar paquetes durante la charla.
- **Studio, navegador o render fallan:** reproducir el [MP4 verificado](pycon-2026-transformers-demo.mp4). Confirmar su SHA-256 y describirlo como artefacto previamente verificado, no como un render recién ejecutado.
- **Diferencia entre informe regenerado y snapshot:** conservar ambos; no sobrescribir los snapshots. Investigar la diferencia después de la presentación.
- **Pregunta por análisis de modelos:** explicar que el diseño contempla esa capa, pero la captura actual dice `MODEL_ANALYSIS: NOT_RUN`.

## Verdad y límites

| Afirmación | Estado en esta captura |
|---|---|
| El informe cita definiciones, caller, configuración, herencia y referencias de pruebas | Sí; evidencia de fuente acotada con rutas y líneas |
| Existe un grafo completo de dependencias | **No.** No se demuestra traversal completo ni cobertura de enlaces dinámicos. |
| Se probó el impacto real en runtime | **No.** El impacto completo permanece `UNRESOLVED`; no se ejecutaron pruebas del fixture ni modelos. |
| Hubo una reducción medida de tokens | **No.** La métrica es solo una comparación de bytes de metadatos frente a archivos citados. |
| Se midió calidad de un modelo | **No.** `MODEL_ANALYSIS` está `NOT_RUN`; no inventar calidad, latencia o telemetría. |
| Se midió ripgrep, ast-grep o análisis local | **No.** No hay resultados comparativos de ripgrep/ast-grep ni ejecución de modelo local en este artefacto. El recolector usa AST de Python. |
| El análisis estático prueba uso de cada clase heredera | **No.** La herencia es una relación estructural observada; su participación en una ejecución concreta es inferida. |

## Lista breve del presentador

- [ ] Confirmar `$DEMO_ROOT/transformers` y `$PUDU_ROOT` antes de la charla.
- [ ] Validar HEAD, etiqueta y estado limpio del fixture.
- [ ] Tener abiertos el [informe](evidence/report.md), el [JSON](evidence/report.json) y el [video](pycon-2026-transformers-demo.mp4).
- [ ] Tener preparada la terminal en `$PUDU_ROOT`; no instalar dependencias ni descargar pesos.
- [ ] Nombrar cada estado con precisión, en especial `NOT_RUN`.
- [ ] No convertir ubicaciones candidatas en afirmaciones de runtime ni bytes en tokens.

## Cierre

La herramienta hace que la evidencia candidata sea pequeña, determinista y revisable. La ganancia no es una respuesta infalible: es poder mostrar exactamente qué se encontró, dónde está y qué continúa sin demostrarse.
