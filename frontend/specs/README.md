# Contrato de datos del Dashboard Financiero

## Alcance y fuentes

**«Estás especificando la capa frontend, no implementándola. No construyas componentes React ni conectes llamadas a la API».**

Este documento reúne los contratos y el comportamiento esperado de filtros de fechas, alertas y comparación B2B/B2C. No implementa consultas, navegación, almacenamiento ni componentes.

Fuentes contrastadas:
- [api-types.ts](api-types.ts): respuestas de facetas, alertas y categorías.
- [param-types.ts](param-types.ts): fechas y parámetros de alertas y categorías.
- [components.md](components.md): decisiones humanas y estados de interfaz; referencia para los requisitos del PM recogidos en el proyecto.
- [financial-types.ts](../src/lib/financial-types.ts): movimientos y unions compartidas.
- [Rutas y modelos del backend](../../backend/app/routes.py): métodos, parámetros, respuestas y cálculos reales.
- [verification.md](../../verification.md): evidencia histórica, no garantía del estado actual.

**Evidencia de esta redacción (21/10/2026):** contratos confirmados mediante lectura del código. Se intentó acceder a `http://localhost:8000/docs` con `curl --max-time 5`; falló la conexión, código de salida 7 y HTTP `000`. No se verificaron `/docs` ni el OpenAPI servido en esta revisión. Las consultas OpenAPI anteriores registradas en `verification.md` no se presentan como comprobaciones nuevas. No se ejecutaron endpoints de datos, pruebas funcionales ni compilación TypeScript durante esta redacción.

Para decisiones posteriores, prevalece lo aprobado en `components.md` sobre descripciones históricas desactualizadas de `verification.md`, como navegación provisional, porcentajes pendientes o alineación de props pendiente. Esto no afirma una aprobación final de fases ni una verificación funcional de la interfaz.

## Convenciones del contrato

Todas las rutas documentadas son `GET`, sin cuerpo de petición. Los parámetros viajan en la consulta. Ninguno es obligatorio en estas cinco rutas. Las propiedades de los objetos de respuesta descritas aquí son obligatorias según sus modelos; las respuestas de listados pueden ser `[]`.

| Concepto | Tipo y valores | Ausencia, predeterminado o restricción |
|---|---|---|
| `start_date` | Fecha de calendario; interfaz `YYYY-MM-DD`; TypeScript `string` | Opcional, sin límite inferior si se omite; comparación inclusiva |
| `end_date` | Fecha de calendario; interfaz `YYYY-MM-DD`; TypeScript `string` | Opcional, sin límite superior si se omite; comparación inclusiva |
| `OperationType` | `'income' \| 'outcome'` | Solo en rutas que lo declaran; los defaults varían por ruta |
| `BusinessType` | `'B2B' \| 'B2C'` | Filtro opcional en alertas, top y summary; omitido incluye ambos negocios |
| `Category` | `'suppliers' \| 'sales' \| 'operational' \| 'administrative' \| 'others'` | Filtro opcional en metrics y summary; omitido incluye todas las categorías |
| `group_by` | `'day' \| 'week' \| 'month'` | Opcional en alertas y summary; default `'month'` |
| `period` | `string`: día `YYYY-MM-DD`, semana ISO `YYYY-Www`, mes `YYYY-MM` | Campo de respuesta, no parámetro; formato según `group_by` |

Los tipos `string` y `number` no validan fechas reales, enteros ni rangos por sí solos. Las restricciones numéricas de la API se declaran en FastAPI; las reglas adicionales de interfaz se especifican por separado. Los filtros vacíos se omiten, no se serializan como cadena vacía ni como texto `undefined` o `null`.

### Estados y reglas comunes de interfaz

- Carga inicial: distinguir solicitud pendiente de respuesta vacía; mantener estados independientes para cada fuente. No inventar datos ni límites de facetas.
- Recarga: conservar temporalmente los últimos resultados correctos, identificados como anteriores, y mostrar «Actualizando datos…». Al recibir la respuesta activa, sustituirlos, también si es vacía. No aceptar que una respuesta antigua sustituya resultados de filtros más recientes.
- Error: mostrar un mensaje claro y «Reintentar» solo en la sección afectada. No realizar reintentos automáticos. El reintento manual solicita solo las fuentes fallidas con filtros válidos; conservar visibles las secciones correctas. Un error no equivale a `[]` ni a un total cero.
- Si falla la recarga, retirar el mensaje de actualización, mostrar el error e identificar cualquier resultado conservado como anterior, nunca como actual.
- Rango invertido: mostrar «La fecha inicial no puede ser posterior a la fecha final» y no iniciar consultas ni reintentos hasta corregirlo. No intercambiar fechas automáticamente. Es validación local, no error de API; mantener identificados como anteriores los resultados previos.
- Ausencia confirmada de movimientos: KPI numéricos cero, incluidos ingresos, gastos, beneficio y porcentaje de beneficio; gráficos vacíos sin series, barras o puntos ficticios; mensaje «No hay movimientos para el período seleccionado». Conservar las fechas, incluidos límites ausentes.
- No deducir ausencia de movimientos de un top de ingresos vacío o de una lista de alertas vacía. Puede haber gastos sin ingresos o movimientos sin anomalías.
- Detalles puramente visuales y textos secundarios no aprobados quedan para implementación futura; no sustituyen los mensajes literales ya aprobados.

## A. Filtros de fechas

### Endpoints y tipos existentes

| Método y ruta | Petición y parámetros opcionales | Respuesta TypeScript |
|---|---|---|
| `GET /api/metrics/facets` | Sin parámetros declarados | `FacetsResponse` |
| `GET /api/metrics` | `DateRangeFilter` cubre `start_date` y `end_date`; la ruta también admite `category: Category` y `operation_type: OperationType`, ambos omitidos por defecto | `FinancialMovement[]` |

No existe en los contratos revisados un tipo de petición completo que reúna todos los filtros de metrics. `DateRangeFilter` describe solo el rango de fechas. `/api/metrics` no declara `business_type`; no atribuirle ese filtro.

`FacetsResponse` contiene `operation_types: OperationType[]`, `business_types: BusinessType[]`, `categories: Category[]`, `min_date: string` y `max_date: string`, ambas fechas `YYYY-MM-DD`. Las facetas son globales y no cambian con el rango; las categorías no están separadas por negocio.

Cada `FinancialMovement` contiene `create_date: string` (fecha), `amount: number`, `operation_type: OperationType`, `category: Category` y `business_type: BusinessType`. Los movimientos se devuelven ordenados cronológicamente. Los importes no incluyen un campo de moneda; no atribuir una divisa al contrato sin otra fuente.

### Reglas aprobadas y mapeos

`Dashboard` conserva el rango y los estados; `DashboardDateRangeFilter` presenta controles y referencias de facetas. `startDate → start_date`, `endDate → end_date`, `minDate ← min_date` y `maxDate ← max_date`. Los callbacks de cambio son props de interfaz, no parámetros HTTP.

Sin fechas, consultar el dataset completo. Con solo inicio, incluir esa fecha y las posteriores; con solo fin, incluir esa fecha y las anteriores. Con ambas, incluir ambos extremos. El mismo conjunto filtrado alimenta todos los KPI y gráficos del dashboard.

Permitir fechas anteriores a `min_date` o posteriores a `max_date`: las facetas son referencias informativas, no restricciones de selección. No recortar ni reiniciar el rango. El backend no valida el orden entre fechas; el bloqueo del rango invertido es una decisión frontend.

### Casos límite A

Los resultados de API de esta tabla se deducen del código; no son respuestas observadas en ejecución durante esta fase.

| Caso | Entrada | Comportamiento API confirmado por código | Interfaz y estado esperado |
|---|---|---|---|
| A1 | Solo `start_date` o solo `end_date` | Filtra desde/hasta el límite inclusivo; el otro no restringe | Conservar el campo ausente; carga/recarga y después datos o vacío según respuesta |
| A2 | `start_date > end_date` | Una petición directa válida como fechas no encuentra movimientos que satisfagan ambos límites | No enviar la petición; mensaje exacto de rango invertido, sin intercambio automático |
| A3 | Rango exterior sin movimientos | metrics devuelve `[]`; facetas siguen siendo globales | KPI cero, gráficos vacíos, mensaje exacto de ausencia de movimientos y filtros intactos |
| A4 | Recarga de un rango válido que queda vacío | metrics devuelve `[]` si no hay coincidencias | Conservar datos anteriores solo mientras carga; sustituirlos por el vacío aprobado al terminar |
| A5 | Error de metrics o facetas | No se observó una respuesta de error; las fuentes son distintas | Error y reintento manual local; no convertir el fallo en vacío ni inventar extremos de fecha |

## B. Alertas de anomalías

### Endpoint, parámetros y tipos

`GET /api/metrics/alerts`: petición `AlertsParams`, que extiende `DateRangeFilter`; respuesta `AlertsResponse = AlertEntry[]`.

| Parámetro | Tipo y valores válidos | Obligatorio | Default y restricciones backend | Regla frontend |
|---|---|---|---|---|
| `start_date`, `end_date` | Fechas según convenciones | No | Omitidos: sin límite respectivo | Rango compartido del dashboard; validar orden |
| `threshold` | `number` | No | `0.3`; mínimo `0`; sin máximo declarado | Input inicial `0.3`; admitir solo `0.01` a `1.0`, inclusive |
| `group_by` | `'day' \| 'week' \| 'month'` | No | `'month'` | Agrupación mensual predeterminada; no se exige un selector adicional |
| `business_type` | `BusinessType` | No | Omitido: ambos negocios | Filtro disponible en el contrato; no implica un control nuevo obligatorio |

`AlertEntry` contiene `period: string`, `outcome_total: number`, `baseline_average: number` e `increase_ratio: number`. El modelo Python se llama `MetricsAlert`; no es un export TypeScript adicional. Los importes y baseline se redondean a dos decimales y el ratio a cuatro. `increase_ratio` es una proporción: para mostrar porcentaje se multiplica por 100.

`AnomalyAlertsSection` se sitúa bajo los gráficos: período, gasto registrado, media histórica acumulada e incremento porcentual. Sus props reutilizan `AlertsResponse` (y por tanto `AlertEntry`) y `AlertsParams`; `loading`, `error`, `onRetry` y `onThresholdChange` son presentación, no parámetros API. `threshold` conserva su nombre; las fechas usan el mapeo compartido.

### Backend real, PM y decisión humana

El PM solicita una **media móvil de tres períodos anteriores**. El backend implementa una **media histórica acumulada de todos los períodos anteriores representados**. No son equivalentes. La Opción A aprobada documenta y presenta el cálculo actual, conserva esta discrepancia y no autoriza modificar el algoritmo.

Orden real: generar movimientos, filtrar negocio y fechas, agrupar y detectar alertas cronológicamente. El resumen solo contiene períodos con movimientos; no rellena huecos. Un período con solo ingresos tiene gasto cero y sí participa en el histórico.

El primer período no genera alerta. Desde el segundo basta un período previo, sin esperar tres. El baseline excluye el período evaluado y es la suma de los gastos anteriores dividida por su cantidad. Si no hay histórico o el baseline no es positivo, no se genera alerta; el gasto actual se incorpora al histórico para los siguientes períodos.

Con baseline positivo, el incremento es `(outcome - baseline) / baseline`. Se genera alerta solo si es **estrictamente mayor** que `threshold`; la comparación precede al redondeo de salida.

Otras diferencias: el backend no impone el rango de input `0.01–1.0`; además, filtrar fechas antes del cálculo puede excluir histórico necesario para una referencia exterior al rango. No afirmar que las fechas solo ocultan alertas ya calculadas. No hay otro control temporal: se reutiliza el rango compartido.

### Casos límite B

| Caso | Entrada o condición | Comportamiento API confirmado por código | Interfaz y estado esperado |
|---|---|---|---|
| B1 | Primer período o rango con un único período representado | No genera alerta por falta de histórico | Si la respuesta es `[]`, mensaje explícito de ausencia de anomalías; no inferir ausencia de movimientos |
| B2 | Baseline cero o negativo | Omite la alerta de ese período y añade su gasto al histórico | Mostrar solo alertas recibidas; nunca calcular una división por cero ni presentar un error por esta omisión |
| B3 | Incremento igual a `threshold` | No genera alerta: exige `>` | Resultado válido, posiblemente vacío; no añadir una fila manualmente |
| B4 | Inicio seleccionado excluye períodos previos | Recalcula baseline solo con el histórico filtrado | Recarga con datos anteriores identificados y posterior sustitución; no conservar el baseline de otra consulta |
| B5 | Umbral fuera de `0.01–1.0` pero aceptable por backend | `0` o valores mayores que `1` no están excluidos por los límites declarados | Validar el input conforme al rango frontend; no atribuir ese rechazo a la API |
| B6 | Respuesta vacía o fallo de solicitud | `[]` es un resultado válido; no se observaron fallos HTTP en esta redacción | Vacío: mensaje explícito de que no hay anomalías; fallo: error y «Reintentar», sin reintentos automáticos |

## C. Comparación B2B/B2C

### Endpoints, parámetros y tipos

| Método y ruta | Tipo de petición existente | Tipo de respuesta existente | Uso |
|---|---|---|---|
| `GET /api/metrics/categories/top` | `TopCategoriesParams`, extiende `DateRangeFilter` | `TopCategoriesResponse = CategoryEntry[]` | Una consulta por grupo para hasta cinco categorías de ingresos |
| `GET /api/metrics/summary` | No existe tipo compartido completo en Fase 2 | No existe tipo compartido en Fase 2 | Una consulta por grupo para sumar el ingreso total completo |
| `GET /api/metrics/facets` | Sin parámetros | `FacetsResponse` | Catálogo global de categorías y referencias de fechas |

| Ruta | Parámetro opcional | Tipo y valores | Default y restricciones backend | Uso aprobado |
|---|---|---|---|---|
| top y summary | `start_date`, `end_date` | Fechas | Sin límites si se omiten; inclusivos | Mismo rango en ambos grupos y fuentes |
| top y summary | `business_type` | `BusinessType` | Omitido: ambos negocios | Enviar `B2B` o `B2C` en su consulta respectiva |
| top | `operation_type` | `OperationType` | `'outcome'` | Enviar explícitamente `'income'` |
| top | `limit` | `number`; entero | `5`, mínimo `1`, máximo `20` | Enviar `5`; no implica cinco resultados garantizados |
| summary | `group_by` | `'day' \| 'week' \| 'month'` | `'month'` | Conservar mensual; sumar `income` de todos los períodos |
| summary | `category` | `Category` | Omitida: todas | Omitir para el total completo del grupo |
| summary | `operation_type` | `OperationType` | Omitido: ambas operaciones | La consulta especificada omite el filtro y suma solo el campo `income` |

Top no declara `category` ni `group_by`. Facetas no declara parámetros. Los valores válidos de las unions están en las convenciones; no añadir filtros basándose en el nombre de otra ruta.

Cada `CategoryEntry` contiene `category: Category`, `operation_type: OperationType` y `total_amount: number`, redondeado a dos decimales. El backend ordena por importe descendente y devuelve como máximo `limit` entradas, sin rellenar categorías ausentes. El generador actual asigna ingresos solo a `sales` y `others`; no garantiza cinco filas por grupo.

La respuesta de summary es una lista del modelo Python `MetricsSummaryItem`, con propiedades obligatorias `period: string`, `income: number`, `outcome: number`, `net: number`. Los importes se redondean a dos decimales y `net = income - outcome`, calculado antes de redondear la salida. Este es un esquema descrito desde el backend, **no un export TypeScript existente**. No importar tipos de summary ficticios ni confundirlo con `MetricsComparison`.

La ruta real `/api/metrics/comparison` compara netos entre períodos, no ingresos B2B frente a B2C; no sustituye las fuentes anteriores. Las rutas de movimientos `/api/metrics/b2b` y `/api/metrics/b2c` existen, pero no son las fuentes elegidas en esta especificación.

### Cálculos, composición y persistencia

Presentar dos `BusinessCategoryTable`, una por negocio, en paralelo; en pantalla pequeña, B2B primero y B2C después. Un único `BusinessIncomeComparisonChart` aparece debajo con los ingresos completos de ambos grupos.

Para cada negocio, sumar `income` de todos los períodos de summary sin limitar categorías. Por fila, calcular `total_amount / ingreso_total_del_grupo * 100`. No usar la suma del top cinco como denominador ni como total del gráfico. El porcentaje no viene en la respuesta API.

Mapeos: `businessType → business_type`, fechas según la convención compartida, `total_amount → totalAmount`, `category → category`. `percentageOfGroup` es derivado; si el ingreso total es cero, usar `null` y mostrar `—`, nunca dividir por cero ni mostrar `0 %` como cociente definido. `b2bTotalIncome` y `b2cTotalIncome` proceden de summary. `rows`, `loading`, `error` y `onRetry` son props, no parámetros HTTP.

Ingreso cero no equivale a ausencia de movimientos: puede haber gastos. Con movimientos existentes, el gráfico representa el ingreso cero del grupo. Si los summary de ambos grupos responden correctamente sin períodos, mostrar gráfico vacío sin datos ficticios, totales calculados cero y «No hay movimientos para el período seleccionado». No deducir vacío global solo del top.

La tabla depende de su top y del total necesario para porcentajes; el gráfico depende de ambos summary. Ante fuentes pendientes o fallidas, renderizar el estado local correspondiente sin inventar números; conservar las secciones independientes correctas. No pasar ceros ficticios para satisfacer props numéricas. El reintento recupera solo fuentes fallidas; recuperar summary puede actualizar tabla y gráfico sin repetir un top correcto.

Página independiente `/business-comparison`, con enlace visible desde el dashboard. Conservar el rango al ir, volver y recargar completamente cualquiera de ambas páginas, incluidos límites ausentes. Restaurarlo antes de consultar: no emitir primero una consulta de rango vacío por defecto. Si es invertido, aplicar la validación compartida. Este documento no elige ni implementa router o almacenamiento.

### Casos límite C

| Caso | Entrada o condición | Comportamiento API confirmado por código | Interfaz y estado esperado |
|---|---|---|---|
| C1 | Un negocio no tiene categorías de ingreso | Su top devuelve `[]`; no rellena hasta cinco | Tabla vacía explícita de ese negocio; conservar los resultados correctos del otro |
| C2 | Solo hay una o dos categorías de ingresos | Top devuelve únicamente las existentes, hasta `limit` | Mostrar esas filas sin categorías ficticias; porcentajes sobre el ingreso completo |
| C3 | Ingreso total cero con movimientos de gastos | Summary puede contener períodos con `income=0`; top de ingresos vacío | Total del gráfico cero; porcentajes indefinidos como `—` si corresponde mostrarlos, sin crear filas |
| C4 | Ningún movimiento en ambos negocios para el rango | Ambos summary devuelven `[]`; top también queda vacío | Totales cero, gráfico vacío, mensaje exacto aprobado, filtros intactos |
| C5 | Falla top o summary de un grupo | No se observó la respuesta HTTP; son consultas independientes | Error y «Reintentar» local, secciones correctas visibles; no calcular porcentajes con fuentes desconocidas |
| C6 | Navegación de ida/vuelta o recarga completa | La API solo conoce los parámetros recibidos; no conserva filtros de interfaz | Restaurar el mismo rango antes de consultar; mantener semántica de una sola fecha y bloquear rangos invertidos |

## Limitaciones y verificación pendiente

- Los comportamientos de API de los casos límite son deducciones del código, no resultados de peticiones ejecutadas durante esta fase. Los estados frontend son especificaciones, no funcionalidades probadas o implementadas.
- Falta comprobar el OpenAPI servido y sus respuestas de validación en ejecución. No se documenta como observado un código HTTP ni un cuerpo de error de las rutas de datos. No confundir el fallo de conexión a `/docs` con una respuesta de negocio.
- No existen contratos compartidos completos de petición/respuesta de summary ni de todos los filtros de metrics; se describen las estructuras reales sin modificar los ocho tipos requeridos de Fase 2.
- El generador utiliza la fecha actual y datos sintéticos; no fijar fechas de ejemplo como extremos permanentes. El constructor de facetas indexa el primer y último movimiento y no define una respuesta para un dataset global vacío; el generador actual sí produce movimientos. No confundir esa limitación con un rango filtrado sin resultados.
- La diferencia entre media móvil solicitada y media acumulada actual, los límites de umbral y el efecto del filtro temporal permanecen explícitos. Los porcentajes y totales completos de comparación requieren transformación frontend, no campos nuevos de la API.
- Los detalles visuales y textos secundarios no aprobados pueden decidirse al implementar, conservando todos los mensajes y reglas aprobados. La revisión humana del README sigue pendiente.
- Por instrucción humana, no se ejecuta `npx tsc --noEmit` en este paso ni otra comprobación del compilador. Los resultados históricos de compilación en `verification.md` no se presentan como resultados de esta fase.

## Evidencia humana adicional de Swagger (Fase 4)

- El usuario informa que la documentación Swagger del backend se ha abierto en `/docs` y que se han revisado sus rutas y esquemas. Se registra como evidencia de revisión humana, no como una comprobación directa del asistente ni como ejecución de endpoints de datos.
- Esta evidencia es distinta del intento de conexión fallido documentado al inicio y de la verificación en ejecución que figura como pendiente. Se conservan esas anotaciones históricas sin modificarlas; la revisión humana comunicada no demuestra por sí sola respuestas de validación ni resultados de pruebas funcionales.
- En esta fase, el asistente contrastó estáticamente las fuentes obligatorias, incluidos los modelos de respuesta de `backend/app/routes.py`. No abrió `/docs`, no consultó el OpenAPI servido ni ejecutó endpoints, pruebas funcionales o compilación TypeScript.
