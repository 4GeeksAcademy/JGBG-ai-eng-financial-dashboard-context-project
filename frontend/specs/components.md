# Especificación de componentes

## Funcionalidad 1: Filtros de fechas

La especificación funcional de referencia está en `specs/001 title-search/spec.md`; este documento describe solo los componentes y su contrato propuesto.

### Componentes y responsabilidades
- `DashboardDateRangeFilter`: presenta las fechas opcionales de inicio y fin y las fechas disponibles `min_date` y `max_date` recibidas de `/api/metrics/facets`.
- `Dashboard`: conserva el rango seleccionado y solicita `/api/metrics` con las fechas no vacías. Los KPIs y gráficos existentes deben actualizarse a partir del mismo conjunto de movimientos filtrado.

Props propuestas para `DashboardDateRangeFilter`:

```ts
type IsoDate = string; // YYYY-MM-DD

interface DashboardDateRangeFilterProps {
	startDate?: IsoDate;
	endDate?: IsoDate;
	minDate: IsoDate;
	maxDate: IsoDate;
	onStartDateChange: (value?: IsoDate) => void;
	onEndDateChange: (value?: IsoDate) => void;
}
```

Estas props son propuestas y quedan pendientes de alineación con los tipos compartidos de la Fase 2. La API de facetas no recibe filtros y entrega fechas límite para el dataset global.

### Estados y validación
- Diferenciar la carga de facetas y métricas, el error de cualquiera de esas solicitudes y una respuesta de métricas sin datos.
- Enviar las fechas seleccionadas en formato `YYYY-MM-DD`; cuando ambos campos estén vacíos, solicitar todos los movimientos.
- Los límites del rango son inclusivos. Validar que, si ambas fechas están presentes, `startDate` no sea posterior a `endDate`.
- El comportamiento para fechas seleccionadas fuera de `min_date` y `max_date` no está definido en el spec funcional.

## Funcionalidad 2: Alertas de anomalías

### Ubicación y contenido
- Mostrar la sección de alertas debajo de los gráficos existentes del dashboard.
- Incluir una tabla con las columnas: período, outcome registrado, media móvil de los tres períodos anteriores e incremento porcentual.
- La respuesta de la API es `MetricsAlert[]`. Cada alerta contiene los campos obligatorios `period: string`, `outcome_total: number`, `baseline_average: number` e `increase_ratio: number`.
- Presentar `period` como período; `outcome_total` como outcome registrado; `baseline_average` como referencia; e `increase_ratio` como porcentaje. La API entrega `increase_ratio` como proporción, por lo que la presentación porcentual corresponde a esa proporción multiplicada por 100.
- La agrupación predeterminada es mensual, según OpenAPI.

### Umbral
- Incluir un input numérico configurable con valor predeterminado `0.3` y rango permitido de `0.01` a `1.0`, ambos inclusive.
- El frontend debe validar ese rango. El contrato actual de OpenAPI solo declara mínimo `0` y no declara máximo; por tanto, los límites del input no están garantizados por la API.

### Estados
- Diferenciar visualmente el estado de carga, el error de la solicitud y la ausencia de anomalías.
- Cuando la API responda con `[]`, mostrar un mensaje explícito de que no hay anomalías.
- Un error de solicitud no debe presentarse como una respuesta vacía.

### Componente y props propuestas
- `AnomalyAlertsSection`: presenta el input de umbral y la tabla de alertas.
- Props propuestas:

```ts
interface MetricsAlert {
	period: string;
	outcome_total: number;
	baseline_average: number;
	increase_ratio: number;
}

interface AnomalyAlertsSectionProps {
	alerts: MetricsAlert[];
	threshold: number;
	loading: boolean;
	error: string | null;
	onThresholdChange: (value: number) => void;
}
```

Los tipos son propuestas documentales: `MetricsAlert` y sus props aún no están definidos en los tipos TypeScript compartidos. El rango de fechas se mantiene en el dashboard y se reutiliza en la solicitud de alertas; no se propone un segundo control de fechas.

### Filtros de fecha
- Enviar con la consulta de alertas los valores opcionales `start_date` y `end_date` seleccionados en la Funcionalidad 1, para mantener sincronizado el período consultado.
- El contrato actual aplica el filtro de fechas antes de calcular el baseline; el efecto de este orden se registra como discrepancia y decisión pendiente.

### Discrepancias del backend actual
- El backend calcula una media histórica acumulada de períodos anteriores, no la media móvil de los tres períodos anteriores exigida por el Product Manager.
- OpenAPI permite `threshold` desde `0` y no declara máximo; el rango requerido por el Product Manager es `0.01`–`1.0`.
- El backend filtra los datos por fecha antes de calcular el baseline, por lo que el rango puede excluir períodos históricos necesarios para la referencia.

### Decisiones pendientes
- Definir el tratamiento de los períodos iniciales que todavía no tienen tres períodos anteriores.
- Definir el tratamiento de un baseline igual a cero.
- Definir si el filtro de fechas limita solo las alertas mostradas o también el histórico utilizado para calcular el baseline.

## Funcionalidad 3: Comparativa B2B vs B2C

### Página y composición
- Propuesta provisional de ruta: `/business-comparison`. El usuario accederá desde un enlace o elemento de navegación visible en el dashboard; la ruta y el mecanismo quedan pendientes de confirmación.
- Presentar dos tablas en paralelo: una para B2B y otra para B2C. Cada una muestra hasta cinco categorías principales de ingresos, con nombre de categoría, importe total y porcentaje sobre los ingresos totales de ese grupo.
- En pantallas pequeñas, reorganizar las tablas en una sola columna, primero B2B y después B2C; el gráfico permanece debajo de ambas.
- Presentar un único gráfico comparativo de ingresos totales B2B y B2C debajo de las tablas.
- Reutilizar el filtro opcional de fechas de la Funcionalidad 1 y obtener el catálogo global de categorías desde `/api/metrics/facets`.

### Datos y cálculos
- Solicitar `/api/metrics/categories/top` con `operation_type=income`, `limit=5`, el `business_type` correspondiente y el mismo rango de fechas para cada grupo. La respuesta `TopCategoryItem[]` contiene `category`, `operation_type` y `total_amount`; no contiene porcentaje.
- Calcular el porcentaje de cada fila con `total_amount / ingreso_total_del_grupo * 100`.
- Obtener el ingreso total completo por grupo desde `/api/metrics/summary`, filtrando por `business_type` y las mismas fechas, y sumar `income` de todos los períodos. No usar la suma del top cinco como denominador ni como total del gráfico.
- `/api/metrics/facets` devuelve `operation_types`, `business_types`, `categories`, `min_date` y `max_date`. `categories` es global, no está separada por grupo.
- Los tipos existentes `Category` y `BusinessType` están definidos en `frontend/src/lib/financial-types.ts`. Los tipos de respuestas `TopCategoryItem`, `MetricsFacets` y `MetricsSummaryItem` no están definidos en TypeScript; quedan pendientes de alineación con la Fase 2.

### Componentes y props propuestas
Estas props son propuestas documentales y no implementación:

```ts
interface CategoryIncomeRow {
	category: Category;
	totalAmount: number;
	percentageOfGroup: number | null;
}

interface BusinessCategoryTableProps {
	businessType: BusinessType;
	rows: CategoryIncomeRow[];
	loading: boolean;
	error: string | null;
}

interface BusinessIncomeComparisonChartProps {
	b2bTotalIncome: number;
	b2cTotalIncome: number;
	loading: boolean;
	error: string | null;
}
```

`BusinessCategoryTable` se presenta una vez por grupo; ambas instancias y el gráfico reciben datos calculados con el mismo rango de fechas.

### Estados y casos sin datos
- Diferenciar carga, error de solicitud y ausencia de datos.
- Si el rango de fechas no produce resultados, mostrar un estado vacío explícito y distinto del estado de error de API.
- Si un grupo no tiene categorías de ingreso, su tabla recibe una lista vacía; el estado visual correspondiente debe ser explícito.
- El endpoint devuelve hasta cinco resultados y no rellena categorías ausentes. El generador actual asigna a los ingresos solo las categorías `sales` y `others`, por lo que no garantiza cinco filas.
- Si el ingreso total del grupo es cero, el porcentaje no está definido. Propuesta visual pendiente de aprobación: mostrar `—` en el porcentaje en vez de `0 %`. El total del gráfico puede ser cero.
