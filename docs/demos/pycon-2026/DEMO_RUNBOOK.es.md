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

## Presentación web local — pasos de lanzamiento

Esta interfaz agrega una navegación de navegador al informe determinista y una ejecución opcional con modelos que ya estén instalados. No requiere cambios en el fixture ni en los informes guardados. El servidor web no inicia ni detiene Ollama y tampoco descarga modelos.

### Terminal 1 — Ollama aislado

Confirme primero que el puerto `11435` esté libre. En la Terminal 1, inicie una instancia separada; no reconfigure ni detenga el daemon compartido:

```sh
OLLAMA_HOST=127.0.0.1:11435 OLLAMA_NO_CLOUD=1 ollama serve
```

`OLLAMA_NO_CLOUD=1` es configuración solicitada por el operador, no una atestación de la API. No ejecute `ollama pull`; esta instancia solo sirve para comprobar los modelos que ya estén disponibles para ella.

### Terminal 2 — preflight y servidor web

Desde la raíz `$PUDU_ROOT`, compruebe la instancia aislada y arranque la web apuntándola explícitamente al puerto `11435`:

```sh
OLLAMA_HOST=127.0.0.1:11435 ollama list
PYTHONPATH=python python3 -m pudu_agent.pycon_web --ollama-url http://127.0.0.1:11435 --port 8765
```

`ollama list` debe devolver el inventario de esta instancia; reutilice solo modelos ya presentes. La web valida que `--ollama-url` sea un endpoint HTTP de loopback sin ruta, credenciales, query ni fragmento. No admite URL arbitraria. El preflight de la propia interfaz consulta el fixture fijado y el inventario de modelos, sin ejecutar una generación.

Abra `http://127.0.0.1:8765` en el navegador. La página carga el informe y sus estados deterministas; revise la secuencia, los límites de evidencia y los enlaces al runbook, informe, subtítulos y video. Si el video no está en este checkout, use el fallback visible y confirme antes de la charla que el MP4 está disponible en el equipo de presentación.

### Recorrido del navegador y corrida local

1. En **Evidencia determinista**, recorra las etapas del informe: identidad `VERIFIED`; recolección acotada de AST e informe `COMPLETED`; `RUNTIME_TESTS` y el análisis del modelo del snapshot como `NOT_RUN`.
2. En el panel de análisis local, pulse **Actualizar modelos**. El preflight debe indicar disponibilidad y el selector debe mostrar tags instalados con sus digests; el servidor revalida la identidad exacta antes de aceptar la corrida.
3. Seleccione un modelo de esa lista y pulse **Iniciar análisis local**. La interfaz muestra eventos observados (recolección de evidencia, verificación de modelo/servidor, generación y validación estructural), estado, resumen y hallazgos proyectados/redactados. Una respuesta estructuralmente válida no demuestra que sus afirmaciones sean ciertas.
4. Si el sondeo llega a su horizonte sin estado terminal, la corrida queda pendiente y puede reanudarse con el mismo ID desde el control de continuación. El horizonte de polling no cancela ni termina el trabajo del servidor.

En éxito, el endpoint ofrece un enlace a un manifiesto redactado dentro de `.pudu-ai/pycon-demo/`, ignorado por Git. Los snapshots deterministas no se reescriben: el estado guardado `MODEL_ANALYSIS: NOT_RUN` sigue describiendo esa captura, no la corrida viva.

### Fallback, cierre y salida directa

Si el navegador, el preflight o la ejecución falla, vuelva al [informe Markdown](evidence/report.md), al [JSON](evidence/report.json), al [video verificado](pycon-2026-transformers-demo.mp4) si está disponible, o al CLI directo de la sección siguiente. No instale dependencias, no descargue modelos ni altere servicios para rescatar la presentación.

Para cerrar la web, use `Ctrl-C` en la Terminal 2. Cierre la instancia Ollama de la Terminal 1 con `Ctrl-C` solo si corresponde al proceso aislado que usted acaba de iniciar; no detenga el daemon compartido. El servidor web no administra el ciclo de vida de Ollama.

## Fallback: Ollama por CLI directa — 3 minutos, sin descargas

El guion de nueve minutos anterior sigue siendo el demo determinista completo. Si ya hay un servidor Ollama local activo y un modelo instalado, se puede sumar esta capa al bloque de demostración; no instale ni descargue nada durante la charla. Si no están disponibles, conserve los snapshots `MODEL_ANALYSIS: NOT_RUN` y el MP4 como fallback.

### Preparar un servidor local-only separado

Para evitar reconfigurar o detener el daemon compartido, confirme que el puerto `11435` esté libre y ejecute en una terminal separada un servidor Ollama local-only:

```sh
OLLAMA_HOST=127.0.0.1:11435 OLLAMA_NO_CLOUD=1 ollama serve
```

Esta configuración es una afirmación del operador al iniciar el proceso; la API no ofrece una atestación que pruebe que el servidor no reenviará solicitudes a la nube. No detenga ni reconfigure el daemon compartido. Reutilice únicamente modelos ya instalados y visibles para esta instancia: no ejecute `ollama pull`.

Desde `$PUDU_ROOT`, comprobar el cliente y los modelos visibles para el servidor aislado:

```sh
ollama --version
OLLAMA_HOST=127.0.0.1:11435 ollama list
```

`ollama list` muestra los nombres/tags locales en la columna `NAME` y un ID de digest abreviado. Copie el `NAME` exacto para el modo automático. El modo interactivo consulta los metadatos locales y muestra cada tag elegible junto con su digest completo antes de elegir. La ejecución consulta además `/api/version`; el manifiesto registra esa versión del servidor, mientras `ollama --version` identifica el cliente CLI. No utilice tags `:cloud` ni ejecute `ollama pull`.

### Ejecutar (elegir una modalidad)

Automático, con el tag exacto copiado de `ollama list`:

```sh
PYTHONPATH=python python3 -m pudu_agent.transformers_ollama_demo --ollama-url http://127.0.0.1:11435 --ollama-timeout-seconds 120 --model 'TAG_LOCAL_EXACTO'
```

O interactivo, para revisar tag y digest antes de seleccionar:

```sh
PYTHONPATH=python python3 -m pudu_agent.transformers_ollama_demo --ollama-url http://127.0.0.1:11435 --ollama-timeout-seconds 120 --interactive
```

Ambas modalidades exigen el fixture fijado en `$DEMO_ROOT/transformers`, que es la ruta predeterminada del CLI. El comando valida identidad/commit/etiqueta, prepara evidencia acotada, selecciona un modelo local elegible, consulta la versión del servidor, genera con formato JSON y valida el contrato estructural. El timeout predeterminado es 120 segundos (`--ollama-timeout-seconds`, rango `>0` a `600`); los arranques en frío pueden superar los 10 segundos. Este valor limita operaciones de socket, no garantiza una duración total máxima. En éxito muestra el resumen interpretativo, la ruta del manifiesto y una advertencia de que validez JSON no significa corrección factual. `temperature=0` y `seed=20260520` fijan opciones, pero no garantizan texto idéntico entre versiones o hardware.

El manifiesto redactado se escribe atómicamente en `.pudu-ai/pycon-demo/` (ignorado por Git). Registra hashes y metadatos —incluidos tag, digest, versiones, opciones, métricas observadas y estado de validación—, no el prompt, la evidencia ni la respuesta completos. Los informes deterministas comprometidos siguen diciendo `MODEL_ANALYSIS: NOT_RUN`: una corrida viva crea un registro separado e ignorado y **no reescribe esos snapshots**.

### Confianza, fallos y fallback

El cliente usa el endpoint loopback explícito `http://127.0.0.1:11435` y rechaza tags cloud; eso define el límite de transporte de esta demo, no una garantía general sobre la configuración de todo servidor Ollama. `OLLAMA_NO_CLOUD=1` expresa la configuración solicitada por quien opera el proceso, no una atestación entregada por la API. El timeout no es un deadline extremo a extremo: una generación puede tardar más mientras haya progreso en las operaciones de socket. El texto del modelo es dato no confiable: JSON válido no equivale a hechos correctos, y la herramienta nunca ejecuta comandos, parches ni llamadas sugeridas por el modelo.

Si el servidor no está activo, no hay modelo local elegible, el tag no coincide exactamente, el fixture falla su verificación o la respuesta no cumple el contrato, el proceso informa el error y termina con código distinto de cero; no crea un manifiesto de éxito. No inicie ni detenga servicios ni descargue modelos para rescatar la charla. Vuelva a los informes deterministas y al video previamente verificado (`pycon-2026-transformers-demo.mp4`); confirme antes que el MP4 esté disponible en el equipo de presentación: este checkout de trabajo no incluye el archivo ignorado. La limitación debe seguir nombrándose como `MODEL_ANALYSIS: NOT_RUN` en esos snapshots.

La secuencia combinada conserva los nueve minutos deterministas y añade, si el preflight ya está disponible, 3 minutos: 0:00–0:30 mirar versión/lista; 0:30–1:00 ejecutar una modalidad; 1:00–2:00 leer etapas/salida y el manifiesto; 2:00–3:00 explicar el límite de confianza y volver al fallback si algo falla.

## Secuencia completa de charla — 30 minutos

| Minutos | Bloque | Objetivo |
|---|---|---|
| 0–3 | Apertura y problema | Presentar el costo de buscar impacto en un repositorio grande y formular una pregunta concreta. |
| 3–6 | Caso y límites | Presentar `GenerationMixin.generate`, el snapshot fijado y la diferencia entre evidencia de código y prueba de runtime. |
| 6–18 | Demostración | Mantener los nueve minutos deterministas: identidad, colección, ubicaciones, estados y medición; añadir hasta tres minutos de Ollama solo si el servidor y un modelo ya están disponibles. |
| 18–21 | Lectura crítica | Distinguir `CONFIRMED`, `INFERRED` y `UNRESOLVED`; explicar por qué las ubicaciones de herencia no prueban uso dinámico. |
| 21–24 | Siguiente capa de análisis | Explicar cómo modelos locales y de frontera podrían consumir evidencia acotada. Si no se ejecutó Ollama, no atribuir calidad, latencia ni resultado: `MODEL_ANALYSIS` está `NOT_RUN`. |
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
