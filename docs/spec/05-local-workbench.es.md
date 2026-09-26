# Banco local — Gemma 4, Antigravity, grafos y Obsidian

[English](05-local-workbench.md) · [Español](05-local-workbench.es.md)

Estado: solo spec. No es un release. No se publica hasta que el corte tenga pruebas y se acepte la costura de abajo.

Relacionados (no reemplazar):

- `00-overview.md` — laboratorio de hardware, estimado vs medido
- `03-scoring.md` — Pudu-AI Score es solo hardware
- `04-privacy.md` — local-first, `--no-network`
- `agent-lab.md` — grafo de código y task score; más allá de search/graph/harness no está implementado

## Problem Statement

Quien opera en local quiere el siguiente corte de Pudu-AI para tres trabajos, sin convertir el lab en otro agente de código:

1. Ver si **Gemma 4** cabe **en esta máquina** para una tarea local, y conectar **Antigravity** a ese modelo solo si pasa la compuerta de hardware.
2. Mantener un **grafo local** del repo (ya empezado) y de una bóveda de notas, con aristas parseadas, nunca inventadas.
3. Dejar ese grafo en **Obsidian** como archivos que ya son suyos, sin subir notas ni inventar un puntaje de calidad.

Hoy el lab puede lanzar OpenCode, OpenClaw, Hermes y Claude Code vía Ollama, pero solo como compuerta que explica primero. Conoce tags de Gemma 3, no de Gemma 4. El grafo de código es AST de Python más un Graphify opcional. Las tasks imprimen prompts; no ejecutan un modelo. No hay grafo de bóveda ni export a Obsidian.

## Solution

Una decisión de elegibilidad y un export de grafo. Nada más.

- Clasificar un tag como local, cloud o desconocido. Los tags cloud de Gemma 4 nunca son "locales".
- Recomendar un tamaño de Gemma 4 que quepa en memoria unificada. Explicar Antigravity como cliente OpenAI-compatible de loopback contra Ollama, o como solo-detección para un checkpoint LiteRT. No fingir que `ollama launch` conoce Antigravity.
- El default sigue siendo solo explicar. `--yes` puede escribir un snippet local o imprimir el endpoint. No instala Antigravity, no hace `pip install` y no descarga un checkpoint.
- Construir un grafo de bóveda desde wikilinks de markdown igual que el grafo de código construye aristas EXTRACTED. Exportar cualquiera de los dos a markdown de Obsidian solo con directorio explícito y `--yes`.

Pudu-AI Score sigue siendo un puntaje de hardware. La calidad de la tarea sigue en `N/A` hasta que exista un trace real.

## User Stories

1. Como operador local, quiero que `tasks` y `launch` reconozcan tags de Gemma 4 (`gemma4:e2b`, `e4b`, `12b`, `26b`, `31b` y variantes MLX), para que un nombre de catálogo no se trate como no descargable si Ollama tiene tag real.
2. Como operador local, quiero los tags cloud (`gemma4:cloud`, `gemma4:31b-cloud`) marcados cloud y bloqueados como destino local, para que `--no-network` no se salte con un tag.
3. Como operador local, quiero una recomendación de tamaño según memoria unificada, para que un tag 26B / 31B no se ofrezca en una máquina que no lo sostiene.
4. Como operador local, quiero detectar Antigravity (`agy` o la app) sin instalarlo, para que una herramienta ausente sea `no detectado` y no un crash.
5. Como operador local, quiero una decisión solo-explicación para Antigravity, para ver modelo, nota, origen (medido o estimado) y la URL de loopback antes de escribir nada.
6. Como operador local, quiero que `--yes` escriba solo una config local que apunte a `http://127.0.0.1:11434/v1` y a un tag Gemma 4 no-cloud, para que Antigravity use el Ollama de esta máquina.
7. Como operador local, quiero LiteRT / `.litertlm` como solo-detección, para que Pudu-AI no descargue el checkpoint de ~17 GB ni ejecute `pip install`.
8. Como operador local, quiero que el instalador de Antigravity no se toque, para que Pudu-AI no haga curl-pipe de `antigravity.google`.
9. Como operador local, quiero el launch bloqueado si la nota está bajo el conjunto permitido o los t/s medidos están bajo el piso de agente, para que una estimación débil no haga pull ni arranque un agente.
10. Como operador local, quiero las integraciones Ollama actuales intactas, para que OpenCode / OpenClaw / Hermes / Claude conserven sus compuertas.
11. Como operador local, quiero que `repo graph` siga escribiendo un grafo de código con aristas EXTRACTED / RESOLVED / INFERRED, para que los repos Python no regresionen.
12. Como operador local, quiero un grafo de bóveda de notas markdown (wikilinks, encabezados, adjuntos que existen en disco), para que una bóveda Obsidian no pase por el AST de Python.
13. Como operador local, quiero los wikilinks rotos reportados como no resueltos, no inventados como aristas, para que una nota ausente no sea una relación.
14. Como operador local, quiero fuera de este corte las aristas semánticas de "nota relacionada", para que un LLM no cuele enlaces INFERRED en el conteo EXTRACTED.
15. Como operador local, quiero que `repo graph --vault RUTA` (o equivalente) se niegue a salir de esa raíz, para que `~` o `/` no se indexen en silencio.
16. Como operador local, quiero un export Obsidian del grafo como notas markdown más un índice de enlaces, para abrir una carpeta como bóveda.
17. Como operador local, quiero que el export no haga nada salvo que estén `--out` y `--yes`, para que mi bóveda no se pise por sorpresa.
18. Como operador local, quiero que el export ignore `.obsidian/` y no escriba plugins, para que Pudu-AI no sea un instalador de plugins.
19. Como operador local, quiero JSON de elegibilidad, grafo y export, para verificar el corte sin TUI.
20. Como operador local, quiero cadenas nuevas en español e inglés, para que `--lang` siga siendo locale de UI y no idioma del grafo.
21. Como operador local, quiero métricas ausentes como `N/A` / `null`, para que un bench faltante no se rellene con los puntajes publicados de Gemma 4.
22. Como operador local, quiero que los comandos de hardware sigan funcionando si faltan Python, Antigravity u Obsidian, para que el lab no gane una dependencia dura.

## Implementation Decisions

- **Una costura.** Extender la decisión de integración para que un host sea `ollama-launch` (las cuatro herramientas actuales), `openai-compatible-local` (Antigravity contra Ollama en loopback) o `detect-only` (checkpoint LiteRT, app de Obsidian). No agregar Antigravity como quinto id de `ollama launch`. La lista de aplicaciones de Gemma 4 en Ollama no incluye Antigravity.
- **Tabla de tags, no scrape del catálogo.** Agregar tags locales de Gemma 4 junto a las reglas de Gemma 3. Un tag que termina en `-cloud` o es `gemma4:cloud` es cloud. Un tag desconocido queda sin resolver; el CLI imprime `N/A` y no inventa un pull.
- **Cabe antes de recomendar.** Gemma 4 E2B / E4B son los candidatos default para tarea local. 12B es opcional si hay margen de memoria. 26B (MoE, checkpoint ~17 GB, ~24 GB de memoria unificada recomendados en las notas LiteRT de Antigravity) y 31B no son elegibles por debajo de ese margen. Ese encaje es nota de compatibilidad, no Pudu-AI Score.
- **Endpoint solo loopback.** La config escrita usa `127.0.0.1:11434` (Ollama) o el puerto de LM Studio ya detectado. Se rechazan base URLs que no sean loopback. `--no-network` sigue permitiendo loopback y prohíbe tags cloud.
- **Sin instalador y sin arrancar el SDK.** Este corte no ejecuta `agy`, no importa `google.antigravity` y no aplica `policy.allow_all()`. Imprimir un ejemplo está permitido. Ejecutar un agente que edita el repo no.
- **Dos productores de grafo, un contrato de arista.** El grafo de código sigue siendo AST de Python más Graphify opcional. El grafo de bóveda es otro productor sobre markdown. Ambos emiten nodos, aristas, confianza y evidencia. Una arista de bóveda es EXTRACTED solo si ambas notas existen y el wikilink se parseó. Los destinos ausentes se cuentan, no se enlazan.
- **El export es una función pura de ese JSON.** La entrada es el documento del grafo. La salida es el directorio de markdown que nombró el usuario. Sin red. No se escribe en la bóveda fuente salvo que `--out` sea esa bóveda y haya `--yes`. Se niega a pisar una nota cuyo contenido no sea un export previo de Pudu.
- **Las tasks siguen siendo un plan.** Gemma 4 puede aparecer en el plan como modelo instalado o de catálogo. Ese plan sigue sin llamar al modelo. Correr una task por Antigravity es una fase posterior de Agent Lab.
- **i18n.** Cadenas nuevas en ambos catálogos. Las claves JSON siguen en camelCase inglés.
- **Privacidad.** Rutas de bóveda, títulos y archivos de grafo se quedan en disco. Nada se sube. El export no incrusta identificadores de máquina.

### Composición de métricas (vinculante)

Tres números no se suman.

| Cantidad | Origen | Puede entrar en |
| --- | --- | --- |
| `ollama list` muestra un tag Gemma 4 | MEASURED | solo elegibilidad |
| sufijo `:cloud` / `-cloud` | MEASURED | bloquea elegibilidad local |
| parámetros y ventana de contexto de la tabla de tags | ESTIMATED | solo nota de compatibilidad |
| t/s de generación de llama-bench | MEASURED | dimensión de velocidad del Pudu-AI Score |
| potencia, térmicos, swap durante un bench | MEASURED o `N/A` | Pudu-AI Score, pesos actuales |
| MMLU, LiveCodeBench, Tau2 u otros publicados por Google | externo, no medido aquí | ningún score |
| binario de Antigravity presente | MEASURED | solo elegibilidad |
| conteo de archivos, aristas y duración del grafo | MEASURED | no es un score |
| conteo de notas y wikilinks resueltos | MEASURED | no es un score |
| pass/fail de tarea, tokens, reintentos | ausente en este corte | Task Score queda `N/A` |
| baseline humano | ausente salvo que el usuario lo pase | `N/A` |

Pudu Task Effort podrá ser DERIVED más adelante a partir del tamaño medido del grafo. No se recalcula con la calidad anunciada de Gemma 4. Una nota S de compatibilidad no significa que la tarea salió bien.

Si no hay bench del tag Gemma 4 elegido, la velocidad es `N/A` y la elegibilidad solo puede usar el encaje, etiquetado como estimado. Una estimación débil sigue sin poder hacer pull ni launch, igual que la compuerta actual.

## Testing Decisions

Una buena prueba afirma el comportamiento externo de funciones puras: clase de tag, razones de elegibilidad, aristas de bóveda, archivos de export. No arranca Ollama, Antigravity, Ink ni la red.

- Resolver de tags: los tags locales de Gemma 4 resuelven; los cloud se clasifican cloud; los de Gemma 3 siguen resolviendo; un nombre de catálogo sin tag queda sin resolver.
- Elegibilidad: Antigravity es elegible solo con tag local, nota en el conjunto permitido, endpoint de loopback y — si hay bench — t/s en o sobre el piso de agente actual. Tag cloud, Ollama ausente, nota F y URL no-loopback bloquean. `--yes` no hace falta para *explicar*; hace falta para *escribir*.
- Grafo de bóveda: un fixture de tres notas con un wikilink real y uno colgante produce una arista EXTRACTED y un conteo de no resueltos. No se inventa una arista. Las rutas fuera de la raíz se ignoran.
- Export: sin `--yes` el escritor informa el plan y no escribe. Con `--yes` y `--out` escribe markdown y una segunda corrida no destruye una nota editada a mano.
- Arte previo: pruebas de decisión de launch, de tags Ollama y del fixture de grafo Python. Los casos nuevos van junto a esas, no en un snapshot de TUI.

## Out of Scope

- Implementar este spec en el mismo cambio que publica un release.
- Correr un agente Antigravity, un server LiteRT o `litert-lm import`.
- `pip install`, instaladores por curl-pipe, u `ollama pull` sin la compuerta `--yes` actual.
- Tratar Antigravity como `ollama launch antigravity`.
- Meter las tablas publicadas de Gemma 4 en el Pudu-AI Score o en un Task Score.
- Grafos AST de TypeScript / JavaScript. Eso es un backend posterior del grafo de código, no este corte de bóveda.
- "Notas relacionadas" por LLM, embeddings o Smart Connections de Obsidian.
- Plugins de Obsidian, Sync, Publish, o leer secretos de `.obsidian/`.
- Fases de Agent Lab ya diferidas: context packs, mini-agentes, experiment, task score.
- Expansión de hardware Linux/Windows.

## Further Notes

### Por qué esta forma

El contrato local de Antigravity es `LocalOpenAIAgentConfig` (Ollama / LM Studio en loopback) o `LiteRTAgentConfig` (checkpoint en el dispositivo). El primero cabe en el adaptador Ollama de Pudu. El segundo es un runtime nuevo y queda en solo-detección hasta que otro spec diga lo contrario. Copiar el camino `ollama launch` de OpenCode reportaría un comando que Ollama no documenta para Antigravity.

Obsidian es un visor de markdown local. Pudu debe entregarle una carpeta, no un segundo producto de grafos. El grafo de código y el de bóveda comparten el contrato de arista para que export y métricas sean una función. No comparten un score.

### Riesgos de composición rechazados

- Un score de "inteligencia local" que sume t/s, conteo de wikilinks y la accuracy publicada de Gemma 4. Son orígenes distintos. Sumarlos esconde una tarea fallida detrás de un chip rápido.
- Lanzar Antigravity con `policy.allow_all()` desde un comando del lab. Eso es un agente con shell y derecho a editar, y este CLI no lo es.
- Indexar una bóveda Obsidian con el walker AST de Python. Markdown no es Python. El resultado sería un grafo vacío presentado como éxito.
- Usar el planificador de tasks como prueba de que el modelo hizo la tarea. Un prompt impreso no es un trace.

### Compuerta de publicación

Este documento es el spec. Un release de funcionalidad ocurre solo después de que pasen las pruebas de Testing Decisions, el typecheck siga verde, y el usuario pida publicar. Hasta entonces la versión sigue en 0.2.23 y el changelog no se toca.

### Costura a confirmar

La costura más alta que ya existe es la decisión de integración más el documento JSON del grafo. Antigravity cuelga de la decisión. Obsidian cuelga del documento. Si ese corte está mal — por ejemplo si Antigravity debe ser una sesión real de `agy` en el corte 1 — hay que parar y revisar este spec antes de escribir código.
