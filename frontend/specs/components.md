# Especificación de componentes

## Alcance y decisión aprobada

Este documento especifica la capa frontend; no implementa componentes React ni llamadas a la API. Los bloques TypeScript describen contratos propuestos de props, no archivos de implementación.

Decisión humana aprobada: **Opción A — documentar el comportamiento actual de la API y registrar explícitamente sus discrepancias con los requisitos del PM**. También están aprobados permitir fechas fuera de los extremos informativos, conservar datos anteriores durante la recarga, mostrar `—` para porcentajes indefinidos y cero en el gráfico, y disponer de una página `/business-comparison` enlazada desde el dashboard que conserve el rango al navegar hacia ella. Estas decisiones se detallan abajo; no implican equivalencia entre media acumulada y media móvil ni autorizan implementación. La Fase 3 queda sujeta a revisión humana final.

### Estados compartidos
- Carga inicial: todavía no existe una respuesta válida para la consulta activa; diferenciarla de una respuesta vacía. El contenedor mantiene estados independientes para facetas, métricas, alertas y cada consulta de la comparación.
- Error: una solicitud fallida muestra un mensaje claro y un botón «Reintentar» únicamente en la sección afectada, nunca el mensaje de ausencia de datos. El reintento es manual y repite solo la consulta fallida con los filtros activos válidos; no realizar reintentos automáticos ni recargar fuentes que ya respondieron correctamente. En la comparación, identificar qué grupo o fuente ha fallado; no convertir un total desconocido en cero.
- Resultados parciales: mantener visibles las secciones cargadas correctamente; no sustituir toda la página por un error global. Si falla una fuente compartida, señalar las secciones que dependen de ella sin invalidar las fuentes correctas. Un dato derivado que dependa de una fuente fallida no se presenta como completo ni se calcula con un cero ficticio.
- Éxito vacío: mostrar el estado vacío solo después de una respuesta correcta sin resultados y sin una solicitud pendiente para esa consulta. Cuando se confirme que no existen movimientos financieros en el período seleccionado, mostrar los KPI numéricos en cero, los gráficos en estado vacío sin datos ficticios y el mensaje exacto «No hay movimientos para el período seleccionado». Conservar los filtros seleccionados, incluidos los límites ausentes; no ampliar ni reiniciar el rango automáticamente.
- Éxito con datos: presentar únicamente resultados correspondientes a los filtros de la consulta identificada; una respuesta anterior no debe sustituir la de filtros más recientes.
- Recarga: distinguir una nueva solicitud de la carga inicial. Decisión aprobada: conservar temporalmente los últimos datos correctos y mostrar «Actualizando datos…», identificándolos como datos anteriores y no como resultados de los nuevos filtros. Cuando la consulta activa termine correctamente, sustituirlos por los nuevos resultados, incluido el estado vacío si la respuesta es `[]`. Si falla, mostrar claramente el error, retirar el mensaje de actualización e identificar los datos conservados como anteriores, nunca como actuales.
- El mensaje claro de error, el botón «Reintentar», la ausencia de reintentos automáticos, la conservación de éxitos parciales y los datos anteriores durante recarga están aprobados. Los detalles puramente visuales de carga y los textos secundarios no aprobados quedan para la implementación futura; el mensaje de ausencia de movimientos ya está aprobado. Las props `loading` indican solicitud en curso; el contenedor distingue carga inicial y recarga mediante la existencia de una respuesta anterior, incluso si esa respuesta fue `[]`. Los callbacks `onRetry` notifican al contenedor un reintento manual de la fuente fallida; no son parámetros API. El contenedor también presenta y gestiona el reintento de facetas o métricas, sin añadirlo a las props del filtro de fechas.

## Funcionalidad 1: Filtros de fechas

La especificación funcional de referencia está en `specs/001 title-search/spec.md`; este documento describe solo los componentes y su contrato propuesto.

### Componentes y responsabilidades
- `DashboardDateRangeFilter`: presenta las fechas opcionales de inicio y fin y las fechas disponibles `min_date` y `max_date` recibidas de `/api/metrics/facets`.
- `Dashboard`: conserva el rango seleccionado y solicita `/api/metrics` con las fechas no vacías. Los KPIs y gráficos existentes deben actualizarse a partir del mismo conjunto de movimientos filtrado.

Props propuestas para `DashboardDateRangeFilter`:

```ts
import type { FacetsResponse } from './api-types';
import type { DateRangeFilter } from './param-types';

interface DashboardDateRangeFilterProps {
	startDate?: DateRangeFilter['start_date'];
	endDate?: DateRangeFilter['end_date'];
	minDate: FacetsResponse['min_date'];
	maxDate: FacetsResponse['max_date'];
	onStartDateChange: (value?: DateRangeFilter['start_date']) => void;
	onEndDateChange: (value?: DateRangeFilter['end_date']) => void;
}
```

Los callbacks reciben respectivamente `DateRangeFilter['start_date']` y `DateRangeFilter['end_date']`. La API de facetas no recibe filtros y entrega fechas límite para el dataset global. `Dashboard` es el contenedor sin props externas propuestas: conserva el rango y los estados de solicitudes, y controla el renderizado condicional; el filtro recibe las fechas de facetas solo cuando están disponibles.

### Mapeo de contratos
- `startDate` corresponde a `DateRangeFilter.start_date`; `endDate`, a `DateRangeFilter.end_date`. Una fecha vacía se representa como `undefined` y se omite de los parámetros API, no se envía como cadena vacía.
- `minDate` y `maxDate` proceden de `FacetsResponse.min_date` y `FacetsResponse.max_date`. Son límites globales informativos, no parámetros de consulta.
- `onStartDateChange` y `onEndDateChange` notifican cambios al contenedor; no representan campos de la API.
- Los movimientos de `/api/metrics` conservan el tipo existente `FinancialMovement[]` de `frontend/src/lib/financial-types.ts`; el mismo resultado alimenta KPIs y gráficos.

### Estados y validación
- Diferenciar la carga de facetas y métricas, el error de cualquiera de esas solicitudes y una respuesta de métricas sin datos.
- Enviar las fechas seleccionadas en formato `YYYY-MM-DD`; cuando ambos campos estén vacíos, solicitar todos los movimientos.
- Con solo fecha inicial, incluir movimientos desde esa fecha; con solo fecha final, incluir movimientos hasta esa fecha. Ambos límites son inclusivos y el parámetro ausente se omite.
- Los límites del rango son inclusivos. Validar que, si ambas fechas están presentes, `startDate` no sea posterior a `endDate`.
- El backend no restringe las fechas a los extremos de facetas: aplica los límites recibidos y puede devolver `[]`. Si inicio es posterior a fin, ningún movimiento satisface ambos límites; esto describe el backend, no el comportamiento aprobado para el control frontend.
- Rango invertido: si `start_date` es posterior a `end_date`, mostrar «La fecha inicial no puede ser posterior a la fecha final» y no iniciar consultas a la API ni reintentos hasta corregirlo. No intercambiar fechas automáticamente. Conservar los resultados anteriores identificados como tales; no presentarlos como resultados del rango inválido. Este error es de validación local, no un error de solicitud ni una respuesta vacía. Aplicar también esta validación al rango restaurado tras navegar o recargar la página.
- Decisión aprobada: permitir fechas anteriores a `min_date` o posteriores a `max_date`. Las fechas de facetas son referencias informativas, no límites obligatorios de los controles ni motivos para recortar o rechazar el rango. Mostrar los resultados disponibles para el rango solicitado o un estado vacío explícito si no hay movimientos.
- Aplicar los estados compartidos. Si `/api/metrics` responde correctamente con `[]` para el rango activo, mostrar en cero los cuatro KPI numéricos, incluido el porcentaje de beneficio, y los gráficos sin series ni puntos ficticios, con el mensaje «No hay movimientos para el período seleccionado». Mantener las fechas seleccionadas. Si esa respuesta corresponde a una recarga, sustituir los datos anteriores por este estado vacío; una solicitud fallida no activa esta regla. Ante facetas pendientes o fallidas, no inventar límites de fecha.

## Funcionalidad 2: Alertas de anomalías

### Ubicación y contenido
- Mostrar la sección de alertas debajo de los gráficos existentes del dashboard.
- Incluir una tabla con las columnas: período, outcome registrado, media histórica acumulada de períodos anteriores e incremento porcentual. No etiquetar el baseline actual como media móvil de tres períodos.
- La respuesta se tipa con `AlertsResponse`, equivalente a `AlertEntry[]`. El modelo Python se llama `MetricsAlert`; cada entrada contiene los campos obligatorios `period: string`, `outcome_total: number`, `baseline_average: number` e `increase_ratio: number`.
- Presentar `period` como período; `outcome_total` como outcome registrado; `baseline_average` como referencia; e `increase_ratio` como porcentaje. La API entrega `increase_ratio` como proporción, por lo que la presentación porcentual corresponde a esa proporción multiplicada por 100.
- La agrupación predeterminada es mensual, según OpenAPI.

### Umbral
- Incluir un input numérico configurable con valor predeterminado `0.3` y rango permitido de `0.01` a `1.0`, ambos inclusive.
- El frontend debe validar ese rango. El contrato actual de OpenAPI solo declara mínimo `0` y no declara máximo; por tanto, los límites del input no están garantizados por la API.

### Estados
- Diferenciar visualmente el estado de carga, el error de la solicitud y la ausencia de anomalías.
- Cuando la API responda con `[]`, mostrar un mensaje explícito de que no hay anomalías.
- Un error de solicitud no debe presentarse como una respuesta vacía.
- Aplicar los estados compartidos de carga inicial y recarga. El vacío significa que no hay alertas devueltas para la consulta, no que no existan gastos: también puede resultar de histórico insuficiente, baseline cero o incrementos que no superan el umbral. El texto literal del mensaje queda pendiente de revisión humana.

### Componente y props propuestas
- `AnomalyAlertsSection`: presenta el input de umbral y la tabla de alertas.
- Props propuestas:

```ts
import type { AlertsResponse } from './api-types';
import type { AlertsParams } from './param-types';

interface AnomalyAlertsSectionProps {
	alerts: AlertsResponse;
	threshold: NonNullable<AlertsParams['threshold']>;
	loading: boolean;
	error: string | null;
	onThresholdChange: (value: NonNullable<AlertsParams['threshold']>) => void;
	onRetry: () => void;
}
```

`AlertsResponse` reutiliza `AlertEntry` sin duplicar su estructura. Las props son de presentación y no necesitan añadirse a los contratos API de Fase 2. `threshold` corresponde a `AlertsParams.threshold`; `loading`, `error` y `onThresholdChange` no son parámetros API. El contenedor compone `AlertsParams` con `startDate → start_date` y `endDate → end_date`; `group_by` y `business_type`, si se usan, conservan sus nombres y valores del contrato. El rango de fechas se mantiene en el dashboard; no se propone un segundo control de fechas.

### Filtros de fecha
- Enviar con la consulta de alertas los valores opcionales `start_date` y `end_date` seleccionados en la Funcionalidad 1, para mantener sincronizado el período consultado.
- El contrato actual aplica el filtro de fechas antes de calcular el baseline. Conforme a la Opción A, la especificación refleja ese comportamiento y conserva su discrepancia respecto a usar histórico externo al rango.

### Discrepancias del backend actual
- El backend calcula una media histórica acumulada de períodos anteriores, no la media móvil de los tres períodos anteriores exigida por el Product Manager.
- OpenAPI permite `threshold` desde `0` y no declara máximo; el rango requerido por el Product Manager es `0.01`–`1.0`.
- El backend filtra los datos por fecha antes de calcular el baseline, por lo que el rango puede excluir períodos históricos necesarios para la referencia.

### Comportamiento real del backend bajo la Opción A
- La agrupación genera solo períodos con movimientos; no rellena períodos ausentes. Su `outcome` puede ser cero si solo hubo ingresos. La media usa esos períodos anteriores representados, no una ventana fija ni períodos vacíos añadidos por el frontend.
- El primer período no genera alerta porque aún no tiene histórico. Desde el segundo, basta un período anterior; no se espera a disponer de tres.
- El baseline es la suma de gastos de todos los períodos anteriores representados dividida por su cantidad. El período evaluado no forma parte de su propio baseline.
- Si el baseline es cero o negativo, no se genera alerta para ese período; su gasto se incorpora después al histórico para evaluar los siguientes.
- Con baseline positivo, calcular `(outcome - baseline) / baseline` y generar alerta solo si el resultado es estrictamente mayor que `threshold`; la igualdad no genera alerta. El backend devuelve importes y baseline redondeados a dos decimales y ratio a cuatro, tras realizar la comparación.
- Los filtros de fechas y negocio se aplican antes del resumen y de la detección. No se recupera histórico anterior al inicio seleccionado. Acortar el rango puede cambiar el baseline y las alertas, no solo ocultar filas.
- La Opción A no aprueba cambiar el backend para obtener una media móvil de tres períodos. Se conserva esa petición del PM como discrepancia; la apariencia del input y los mensajes siguen sujetos a revisión humana.

## Funcionalidad 3: Comparativa B2B vs B2C

### Página y composición
- Decisión aprobada: página independiente en `/business-comparison`, accesible mediante un enlace visible desde el dashboard principal. Esta especificación no implementa el enlace ni un mecanismo de navegación.
- Persistencia aprobada: conservar el rango de fechas seleccionado al navegar desde el dashboard principal a `/business-comparison`, al regresar al dashboard y al recargar completamente cualquiera de ambas páginas. Reflejar el rango conservado en los controles y, si es válido, en las consultas de la vista activa; no sustituirlo temporalmente por un rango vacío ni consultar con filtros por defecto antes de restaurarlo. Conservar también los límites ausentes: solo inicio, solo fin o ambos vacíos mantienen su significado. Se documenta el comportamiento esperado, sin elegir ni implementar almacenamiento o enrutamiento.
- Presentar dos tablas en paralelo: una para B2B y otra para B2C. Cada una muestra hasta cinco categorías principales de ingresos, con nombre de categoría, importe total y porcentaje sobre los ingresos totales de ese grupo.
- En pantallas pequeñas, reorganizar las tablas en una sola columna, primero B2B y después B2C; el gráfico permanece debajo de ambas.
- Presentar un único gráfico comparativo de ingresos totales B2B y B2C debajo de las tablas.
- Reutilizar el filtro opcional de fechas de la Funcionalidad 1 y obtener el catálogo global de categorías desde `/api/metrics/facets`.

### Datos y cálculos
- Solicitar `/api/metrics/categories/top` con `operation_type=income`, `limit=5`, el `business_type` correspondiente y el mismo rango de fechas para cada grupo. La respuesta `TopCategoryItem[]` contiene `category`, `operation_type` y `total_amount`; no contiene porcentaje.
- Calcular el porcentaje de cada fila con `total_amount / ingreso_total_del_grupo * 100` cuando el ingreso total del grupo sea distinto de cero. Si es cero, no dividir: usar `percentageOfGroup: null` y mostrar `—`, conforme a la decisión aprobada.
- Obtener el ingreso total completo por grupo desde `/api/metrics/summary`, filtrando por `business_type` y las mismas fechas, y sumar `income` de todos los períodos. No usar la suma del top cinco como denominador ni como total del gráfico.
- `/api/metrics/facets` devuelve `operation_types`, `business_types`, `categories`, `min_date` y `max_date`. `categories` es global, no está separada por grupo.
- Los tipos existentes `Category` y `BusinessType` están definidos en `frontend/src/lib/financial-types.ts`. El modelo Python `TopCategoryItem[]` corresponde a `TopCategoriesResponse` (`CategoryEntry[]`); `MetricsFacets` corresponde a `FacetsResponse`. El modelo Python `MetricsSummaryItem` no tiene un contrato compartido equivalente en los archivos de Fase 2 revisados: contiene `period: string`, `income: number`, `outcome: number` y `net: number`. Esta descripción documenta el backend, sin modificar los contratos TypeScript.

### Componentes y props propuestas
Estas props son propuestas documentales y no implementación:

```ts
import type { CategoryEntry } from './api-types';
import type { TopCategoriesParams } from './param-types';

interface CategoryIncomeRow {
	category: CategoryEntry['category'];
	totalAmount: CategoryEntry['total_amount'];
	percentageOfGroup: number | null;
}

interface BusinessCategoryTableProps {
	businessType: NonNullable<TopCategoriesParams['business_type']>;
	rows: CategoryIncomeRow[];
	loading: boolean;
	error: string | null;
	onRetry: () => void;
}

interface BusinessIncomeComparisonChartProps {
	b2bTotalIncome: number;
	b2cTotalIncome: number;
	loading: boolean;
	error: string | null;
	onRetry: () => void;
}
```

`BusinessCategoryTable` se presenta una vez por grupo; ambas instancias y el gráfico reciben datos calculados con el mismo rango de fechas.

### Mapeo de contratos
- El contenedor compone `TopCategoriesParams`: `businessType → business_type`, `startDate → start_date`, `endDate → end_date`, con `operation_type=income` y `limit=5`.
- Cada entrada de `TopCategoriesResponse` se transforma en una fila: `category → category`, `total_amount → totalAmount`. `operation_type` permanece en el contrato de origen, pero no necesita una columna porque la consulta es de ingresos.
- `percentageOfGroup` no viene de la API: se deriva del importe de la categoría y el ingreso completo de su grupo. No renombrar campos del contrato API para adaptarlos a las props.
- `b2bTotalIncome` y `b2cTotalIncome` son sumas de `income` de `/api/metrics/summary` para el negocio y rango respectivos, no parámetros de API ni sumas del top cinco. Esa consulta usa `business_type`, `start_date` y `end_date`; `group_by` mantiene el valor mensual predeterminado.
- `rows`, `loading` y `error` son props de presentación. Los estados del gráfico dependen de ambas consultas de summary; los de cada tabla, de su top y del total necesario para calcular porcentajes. No calcular porcentajes con una fuente fallida o pendiente.
- `onRetry` es una acción de presentación, sin equivalente API: el contenedor conserva qué fuente falló y reintenta solo esa fuente. Si hay varias fuentes fallidas para una sección, la acción reintenta únicamente esas fuentes, sin volver a solicitar las que ya se cargaron correctamente. Un summary recuperado puede actualizar la tabla y el gráfico que dependen de él, sin repetir los top correctos.
- Los totales numéricos y `rows` representan datos completos de las fuentes necesarias. Si faltan fuentes por error o carga, el contenedor mantiene visibles las secciones independientes correctas y renderiza el estado local de la parte afectada sin inventar props con ceros ni porcentajes. Si existen datos completos anteriores, puede conservarlos identificados como anteriores según la regla de recarga. Las interfaces no usan valores ficticios para sustituir fuentes desconocidas.

### Estados y casos sin datos
- Diferenciar carga, error de solicitud y ausencia de datos.
- Si el rango de fechas no produce resultados, mostrar un estado vacío explícito y distinto del estado de error de API.
- Si un grupo no tiene categorías de ingreso, su tabla recibe una lista vacía; el estado visual correspondiente debe ser explícito.
- El endpoint devuelve hasta cinco resultados y no rellena categorías ausentes. El generador actual asigna a los ingresos solo las categorías `sales` y `others`, por lo que no garantiza cinco filas.
- Si el ingreso total del grupo es cero, el porcentaje no está definido. Decisión aprobada: usar `percentageOfGroup: null` y mostrar `—`, no `0 %`. El gráfico debe representar el ingreso total de ese grupo como cero. Esta regla no convierte un total pendiente o fallido en cero ni añade categorías ausentes.
- Aplicar los estados compartidos de carga inicial, error y recarga. Una respuesta correcta de summary sin períodos aporta una suma de ingresos cero; una respuesta fallida no equivale a esa suma. Si solo un grupo queda vacío, mantener diferenciados los resultados del otro.
- No confundir ingreso cero con ausencia de movimientos: puede haber gastos sin ingresos. Si los summary de ambos grupos responden correctamente sin períodos para el rango activo, no hay movimientos en la comparación: mantener los totales calculados en cero, presentar el gráfico en estado vacío sin añadir barras o puntos ficticios y mostrar «No hay movimientos para el período seleccionado», conservando los filtros. Esta regla concreta la presentación cuando ambos grupos carecen de movimientos; con movimientos existentes, el ingreso cero de un grupo conserva su representación de cero y el porcentaje `—`. Una lista vacía de alertas o del top de ingresos no demuestra por sí sola que no haya movimientos.

## Decisiones de interfaz pendientes de aprobación humana

- Los detalles puramente visuales de carga y los textos secundarios no aprobados pueden decidirse durante la implementación futura. No quedan pendientes los KPI numéricos en cero, los gráficos vacíos sin datos ficticios, el mensaje «No hay movimientos para el período seleccionado» ni la conservación de filtros ante ausencia de movimientos: están aprobados. El mensaje de rango invertido, «Actualizando datos…» y el botón «Reintentar» también tienen texto aprobado.
- El bloqueo de consultas por rango invertido, sin intercambiar fechas, el reintento exclusivamente manual y local y la conservación de secciones correctas ante resultados parciales ya están aprobados; no se incluyen como decisiones pendientes.
- La ruta `/business-comparison`, su enlace visible y la conservación del rango al ir, volver y recargar completamente ambas páginas ya están aprobados. No se especifica ni implementa un mecanismo de navegación o almacenamiento.
- La representación `—` para porcentajes indefinidos y el ingreso total cero en el gráfico ya están aprobados; no se incluyen como decisiones pendientes.
- Estos pendientes no autorizan implementar componentes ni modificar la API. Las decisiones humanas de esta actualización y las anteriores están incorporadas; la revisión humana de este documento y el cierre de la Fase 3 siguen pendientes.
