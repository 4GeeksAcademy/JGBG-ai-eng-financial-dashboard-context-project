
# Verificacion

| Afirmación original | Archivos revisados | Resultado | Corrección |
|---|---|---|---|
| El backend entrega datos sintéticos y no depende de una base de datos persistente. | `backend/app/routes.py`, `backend/requirements.txt`, `docker-compose.yml` | Confirmado | Ninguna según los archivos revisados. |
| El frontend consume las rutas de análisis disponibles y presenta sus resultados. | `frontend/src/App.tsx`, `backend/app/routes.py` | Incorrecta | La interfaz consulta `/api/metrics`; los demás endpoints no se observaron conectados a esta pantalla. |
| El período que muestra el encabezado coincide con las fechas de los datos. | `frontend/src/App.tsx`, `frontend/src/components/dashboard/dashboard-header.tsx`, `backend/app/routes.py` | Incorrecta | El encabezado usa el texto fijo `2024 - Full Year`; las fechas generadas dependen de la fecha actual. |
| La configuración para apuntar a otro backend descrita en el README existe y se aplica. | `README.md`, `README.es.md`, `frontend/.env.example`, `frontend/src/App.tsx`, `frontend/vite.config.ts` | Parcial | `frontend/.env.example` define `VITE_API_BASE_URL` y el frontend la lee; Vite mantiene el proxy `/api` por defecto. La configuración está confirmada estáticamente, pero no se comprobó en ejecución el cambio de backend. |
| Compose inicia ambos servicios y permite acceder a la API mediante el proxy del frontend. | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/vite.config.ts` | Parcial | La configuración define los servicios y el proxy; no se verificó su funcionamiento en ejecución. |

## Tarea piloto de documentación

- **Tarea:** contrastar la instrucción de configuración de un backend alternativo con el archivo de ejemplo, el consumidor frontend y el proxy; completar la evidencia de la fila correspondiente.
- **Regla aplicada:** `documentation.md`; confirmar archivos y variables contra el código, y distinguir la inspección estática de una prueba en ejecución.
- **Resultado:** satisfactorio para la revisión estática: el archivo de ejemplo, la variable y su lectura están presentes, y el proxy `/api` está configurado. El cambio de backend no se probó en ejecución.

## Revisión humana y validación

- **Contenido generado con ayuda de IA:** Esta sección y la propuesta anterior fueron redactadas con ayuda de IA.
- **Comprobación estática:** Se contrastaron afirmaciones sobre el consumo de `/api/metrics`, el período mostrado y la variable `VITE_API_BASE_URL` con el código. `frontend/.env.example` existe y está registrado en Git.
- **Correcciones humanas:** El usuario está revisando la documentación y corrigiendo afirmaciones incorrectas del agente, incluida la afirmación previa de que faltaba `frontend/.env.example`. La revisión humana está en curso; esto no equivale a una aprobación final.
- **Ejecución de servicios:** Se ejecutó correctamente `docker compose up -d`. Con `docker compose ps` se comprobó que frontend y backend estaban en estado `Up`, en los puertos 5173 y 8000.
- **Verificación visual:** Se abrió correctamente el Dashboard Financiero desde el puerto 5173.
- **Pruebas automatizadas:** No se han aportado resultados de suites de pruebas automatizadas; no se afirma que se hayan ejecutado.

## Verificación del ejercicio SDD — Dashboard financiero

### Estructura del proyecto y especificaciones

| Ruta | Estado y propósito |
|---|---|
| `frontend/specs/` | Existe; contiene contratos TypeScript y especificaciones de componentes. |
| `frontend/specs/api-types.ts` | Existe; declara tipos de respuestas de facetas, alertas y categorías. |
| `frontend/specs/param-types.ts` | Existe; declara parámetros para fechas, alertas y categorías. |
| `frontend/specs/components.md` | Existe; documenta las tres funcionalidades, props propuestas, estados y discrepancias. Su revisión final y alineación con Fase 2 están pendientes. |
| `frontend/specs/README.md` | No existe; README del contrato pendiente. |
| `frontend/specs/001 title-search/` | Existe y está vacía; no se le atribuye documentación. |
| `specs/001 title-search/spec.md` | Existe; especificación funcional de Fase 1, filtro por rango de fechas. |
| `specs/001-title-search/plan.md` | Existe; plan técnico de Fase 1. Su carpeta usa guiones, a diferencia de `001 title-search`. |
| `specs/spec.md` y `specs/plan.md` | No existen. |
| `README.md` y `README.es.md` | Existen en la raíz; documentan el proyecto y ejecución, no los contratos completos de estas funcionalidades. |

La existencia actual de los archivos se comprobó en el árbol. `api-types.ts`, `param-types.ts` y `components.md` se crearon o ampliaron durante el ejercicio en esta sesión; no se afirma que se hayan creado `frontend/specs/README.md`, `specs/spec.md` o `specs/plan.md`.

### Fase 1 — Exploración de la API

Se consultó en ejecución `http://localhost:8000/openapi.json` mediante Python y `urllib` para `/api/metrics/alerts`, `/api/metrics/categories/top`, `/api/metrics/facets` y `/api/metrics/summary`. El 21/10/2026 se volvió a consultar el documento OpenAPI y se obtuvo `HTTP 200 OK`; su esquema de `GET /api/metrics` declara los parámetros opcionales `start_date`, `end_date`, `category` y `operation_type`, y la respuesta `FinancialMovement[]`. Consultar OpenAPI verifica el contrato servido, pero no equivale a ejecutar cada endpoint y comprobar sus datos de respuesta ni demuestra que se hayan ejecutado pruebas funcionales o automatizadas.

| Endpoint | Funcionalidad y parámetros | Respuesta | Evidencia y diferencias respecto al PM |
|---|---|---|---|
| `GET /api/metrics` | Movimientos filtrados. En código y OpenAPI: `start_date`, `end_date`, `category` y `operation_type`, todos opcionales; las fechas son `date`, categoría admite `suppliers`, `sales`, `operational`, `administrative`, `others`, y operación admite `income`/`outcome`. | `FinancialMovement[]`: `create_date`, `amount`, `operation_type`, `category`, `business_type`. | OpenAPI consultado el 21/10/2026 con respuesta `HTTP 200 OK`; confirma el contrato, no la ejecución funcional de esta ruta. Inspección adicional de `backend/app/routes.py`; existe `test_metrics_endpoint_respects_date_filters` en `backend/tests/test_routes.py`, pero no se afirma que se ejecutara. El frontend actual consulta `/api/metrics` sin parámetros (`frontend/src/App.tsx`). |
| `GET /api/metrics/facets` | Sin parámetros. | `MetricsFacets`: `operation_types[]`, `business_types[]`, `categories[]`, `min_date`, `max_date`; las fechas usan formato `date`. | OpenAPI, modelo y prueba existentes inspeccionados. Las categorías y los tipos de negocio son globales, no separados por grupo. |
| `GET /api/metrics/alerts` | `threshold`: number, opcional, default `0.3`, mínimo `0`, sin máximo; `group_by`: `day`/`week`/`month`, default `month`; `start_date` y `end_date` fechas opcionales; `business_type`: `B2B`/`B2C`, opcional. | `MetricsAlert[]`; propiedades requeridas `period: string`, `outcome_total: number`, `baseline_average: number`, `increase_ratio: number`. | OpenAPI y código inspeccionados. Discrepa del PM: el backend usa media histórica acumulada y no impone el máximo `1.0` ni el mínimo `0.01`; filtra fechas antes de calcular el baseline. |
| `GET /api/metrics/categories/top` | `operation_type`: `income`/`outcome`, opcional, default `outcome`; `limit`: integer entre 1 y 20, default `5`; fechas opcionales; `business_type`: `B2B`/`B2C`, opcional. | `TopCategoryItem[]`; propiedades requeridas `category`, `operation_type`, `total_amount`. | OpenAPI y código inspeccionados. Devuelve hasta `limit` resultados ordenados por importe descendente; no incluye porcentaje ni garantiza cinco categorías. La consulta de ingresos debe enviar `operation_type=income`. |
| `GET /api/metrics/summary` | `group_by`: `day`/`week`/`month`, default `month`; fechas, `category`, `operation_type` y `business_type` opcionales. | `MetricsSummaryItem[]`; propiedades requeridas `period`, `income`, `outcome`, `net`. | OpenAPI y código inspeccionados. Permite obtener ingresos por grupo y período; el total completo del grupo se calcula sumando `income`, no sumando el top cinco. |

Los modelos y funciones se inspeccionaron en `backend/app/routes.py`; existen pruebas relacionadas en `backend/tests/test_routes.py`. No se declara ejecución de pruebas unitarias, de integración ni de interfaz. La consulta OpenAPI confirma parámetros y esquemas, no resultados de negocio de una petición a cada ruta.

### Procedimiento de las funcionalidades

#### Funcionalidad 1 — Filtro por rango de fechas

`specs/001 title-search/spec.md` documenta fechas inicial y final opcionales `YYYY-MM-DD`, sin fechas como dataset completo, fechas inclusivas y efecto sobre métricas y gráficos. `specs/001-title-search/plan.md` propone consultar `/api/metrics/facets` para `min_date`/`max_date` y `/api/metrics` para los movimientos. El spec incluye el caso de una sola fecha; `components.md` propone validar que inicio no sea posterior a fin y distingue carga, error y ausencia de datos. No define qué hacer con fechas fuera de los extremos. La integración frontend sigue sin implementar y no se presenta como verificada.

#### Funcionalidad 2 — Alertas de anomalías

`frontend/specs/components.md` documenta la tabla bajo los gráficos, `period`, `outcome_total`, `baseline_average` e `increase_ratio`, el umbral configurable, estado vacío, carga/error y fechas compartidas. Los contratos `AlertEntry`, `AlertsResponse` y `AlertsParams` están en `frontend/specs/api-types.ts` y `frontend/specs/param-types.ts`. Se mantienen explícitas la discrepancia entre media móvil de tres períodos y media acumulada, la diferencia de límites de `threshold` y el efecto del filtro temporal. Los casos de períodos iniciales, baseline cero y semántica de fechas quedan pendientes.

#### Funcionalidad 3 — Comparación B2B y B2C

`frontend/specs/components.md` documenta dos tablas, hasta cinco categorías por grupo, gráfico comparativo, filtros compartidos y categorías globales de facetas. `categories/top` proporciona datos de categoría; `summary` permite obtener totales completos por grupo y período. Los porcentajes se calculan sobre el ingreso total completo, nunca sobre la suma del top cinco. Se documentan carga, error, estados vacíos y menos de cinco categorías. La ruta de navegación es provisional y el caso de denominador cero tiene una propuesta visual pendiente de aprobación. La integración no está implementada.

### Fase 2 — Contratos TypeScript

Existen `frontend/specs/api-types.ts` y `frontend/specs/param-types.ts`. El primero exporta `FacetsResponse`, `AlertEntry`, `AlertsResponse`, `CategoryEntry` y `TopCategoriesResponse`; el segundo exporta `DateRangeFilter`, `AlertsParams` y `TopCategoriesParams`. Reutilizan `Category`, `BusinessType` y `OperationType` desde `frontend/src/lib/financial-types.ts`, conservan los nombres de propiedades de la API y documentan propiedades con JSDoc. Fechas y parámetros con valor por defecto son opcionales; unions restringen valores, y `limit` es `number` con límites documentados.

Se reportó que este comando terminó sin errores; se ejecutó desde `frontend`:

```sh
npx --no-install tsc --ignoreConfig --noEmit --strict --skipLibCheck --moduleResolution bundler --module esnext --target es2020 specs/api-types.ts specs/param-types.ts
```

La comprobación cubre esos dos archivos de forma estricta, no la aplicación completa ni sus pruebas.

### Fase 3 — Especificaciones de componentes

`frontend/specs/components.md` propone componentes, props tipadas y estados para las tres funcionalidades. Incluye filtros/facetas/métricas para F1, alertas y discrepancias para F2, y tablas/gráfico/totales/filtros para F3. La revisión final y la alineación de props con los contratos de Fase 2 siguen pendientes; la Fase 3 no se considera terminada.

### Pruebas y verificaciones realizadas

| Comprobación | Comando o procedimiento | Resultado observado | Alcance y limitaciones |
|---|---|---|---|
| Inspección de contratos API | Consulta Python `urllib` a `http://localhost:8000/openapi.json`; lectura estática de rutas/modelos. | El 21/10/2026 OpenAPI devolvió `HTTP 200 OK`; se consultaron los parámetros y esquemas de `/api/metrics`, alerts, categories/top, facets y summary. | OpenAPI verifica contratos, no resultados de negocio; no se afirma que cada endpoint se ejecutara con peticiones de datos ni que se hayan ejecutado pruebas funcionales o automatizadas. |
| Revisión de tipos | Lectura de `frontend/src/lib/financial-types.ts`, `api-types.ts` y `param-types.ts`. | Confirmadas las aliases compartidas y las declaraciones de los contratos del ejercicio. | Inspección estática; no valida toda la aplicación. |
| Instalación de dependencias | `npm ci` desde `frontend` (resultado reportado durante el ejercicio). | Instalados 266 paquetes; npm notificó 13 vulnerabilidades. | No se ejecutó automáticamente `npm audit fix`; no se afirma que las vulnerabilidades se hayan corregido. |
| Comprobación TypeScript del proyecto | `npx --no-install tsc --noEmit -p tsconfig.app.json` desde `frontend`. | Ejecutado correctamente. | Usa `tsconfig.app.json`, cuyo `include` solo contiene `src`; no comprueba archivos de `frontend/specs/`. |
| Comprobación estricta TypeScript | Comando `npx --no-install tsc --ignoreConfig ...` desde `frontend`. | Reportada sin errores. | Solo `specs/api-types.ts` y `specs/param-types.ts`. |
| Archivos y Git | Inspección de directorios; `git status --short` desde `frontend`. | Rama observada: `feature/frontend-specs`; salida: `?? specs/` y `?? ../specs/`. | El árbol no estaba limpio en esa inspección; esos directorios preexistentes se conservaron. Desde entonces, la rama recibió un commit de avances y fue publicada en GitHub. |
| Suites de pruebas | No hay comando ni salida de ejecución registrados en la evidencia disponible. | Sin resultado. | No se afirma que se ejecutaran pruebas unitarias, integración o interfaz. |

Los resultados de `npm ci`, sus incidencias y la comprobación estricta se registran como resultados reportados durante el ejercicio; no se repitieron durante esta actualización documental.

### Dificultades encontradas y soluciones

1. `npx` intentó instalar `tsc@2.0.4` porque no encontraba dependencias locales disponibles. Posteriormente se instaló el conjunto del proyecto mediante `npm ci`.
2. `npm install` falló con `EACCES` al acceder a `node_modules`, por permisos. Desde `frontend`, se corrigieron con `sudo chown -R "$(id -un):$(id -gn)" node_modules`. Después, `npm ci` instaló 266 paquetes.
3. `npm ci` notificó 13 vulnerabilidades. No se ejecutó `npm audit fix`; su resolución queda pendiente.
4. `frontend/tsconfig.app.json` incluye `src`, no `specs`, por lo que los contratos no entran en la comprobación de aplicación configurada allí.
5. La comprobación directa inicial dio `TS5112` al combinar opciones CLI con la configuración detectada. Se resolvió con `--ignoreConfig` en el comando individual.
6. La comprobación estricta final terminó sin errores según el resultado reportado.

### Estado actual del ejercicio

| Fase | Estado |
|---|---|
| Fase 1 — API | Investigación estática y OpenAPI realizada para las rutas indicadas; documentación de verificación añadida. Pruebas automatizadas no declaradas como ejecutadas. |
| Fase 2 — Tipos | Contratos creados, revisados y validados técnicamente con la comprobación estricta individual; la rama ya tiene un commit de avances y fue publicada en GitHub. |
| Fase 3 — Componentes | `frontend/specs/components.md` documenta propuestas de las tres funcionalidades; revisión final y alineación con tipos pendientes. |
| Fase 4 — README | `frontend/specs/README.md` pendiente y no existente. |
| GitHub | La rama `feature/frontend-specs` tiene un commit de avances y fue publicada en GitHub. |

### Datos pendientes de verificación

- El 21/10/2026 se consultó `http://localhost:8000/openapi.json` y se obtuvo `HTTP 200 OK`.
- OpenAPI declara que `GET /api/metrics` acepta cuatro parámetros opcionales: `start_date`, `end_date`, `category` y `operation_type`; devuelve `FinancialMovement[]`.
- OpenAPI verifica el contrato (parámetros y esquema de respuesta), pero no demuestra que se hayan ejecutado pruebas funcionales o automatizadas ni que se hayan comprobado los datos devueltos por la ruta.
- No se ejecutaron durante esta actualización las suites de backend/frontend ni pruebas de interfaz.
- Siguen pendientes la revisión humana de `components.md`, la aprobación de decisiones abiertas y la integración de funcionalidades en el frontend.

# Verificación del proyecto