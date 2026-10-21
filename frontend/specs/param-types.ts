import type { BusinessType, OperationType } from '../src/lib/financial-types'

/** Fecha de calendario serializada como YYYY-MM-DD. */
type ISODate = string

/** Límites de fecha opcionales compartidos por endpoints de métricas. */
export interface DateRangeFilter {
  /** Fecha inicial opcional, formato YYYY-MM-DD. */
  start_date?: ISODate
  /** Fecha final opcional, formato YYYY-MM-DD. */
  end_date?: ISODate
}

/** Parámetros de GET /api/metrics/alerts. */
export interface AlertsParams extends DateRangeFilter {
  /** Umbral numérico; valor predeterminado real del backend: 0.3. OpenAPI declara mínimo 0 y no declara máximo. */
  threshold?: number
  /** Agrupación temporal; valores permitidos: day, week o month. Predeterminado real: month. */
  group_by?: 'day' | 'week' | 'month'
  /** Filtro opcional por tipo de negocio: B2B o B2C. */
  business_type?: BusinessType
}

/** Parámetros de GET /api/metrics/categories/top. */
export interface TopCategoriesParams extends DateRangeFilter {
  /** Tipo de operación: income u outcome. Predeterminado real: outcome. */
  operation_type?: OperationType
  /** Cantidad entera de resultados, entre 1 y 20. Predeterminado real: 5. */
  limit?: number
  /** Filtro opcional por tipo de negocio: B2B o B2C. */
  business_type?: BusinessType
}
