import type { BusinessType, Category, OperationType } from '../src/lib/financial-types'

/** Respuesta del endpoint GET /api/metrics/facets. */
export interface FacetsResponse {
  /** Tipos de operación disponibles: income o outcome. */
  operation_types: OperationType[]
  /** Tipos de negocio disponibles: B2B o B2C. */
  business_types: BusinessType[]
  /** Categorías disponibles: suppliers, sales, operational, administrative u others. */
  categories: Category[]
  /** Fecha más antigua del dataset, en formato YYYY-MM-DD. */
  min_date: string
  /** Fecha más reciente del dataset, en formato YYYY-MM-DD. */
  max_date: string
}

/** Una alerta de anomalía devuelta por GET /api/metrics/alerts. */
export interface AlertEntry {
  /** Período agrupado por group_by: día YYYY-MM-DD, semana YYYY-Www (año y semana ISO) o mes YYYY-MM. */
  period: string
  /** Importe total de gastos del período, redondeado por el backend a 2 decimales. */
  outcome_total: number
  /** Media histórica de gastos usada como referencia, redondeada por el backend a 2 decimales. */
  baseline_average: number
  /** Incremento relativo (gasto del período menos baseline, dividido por baseline), no porcentaje x 100; redondeado por el backend a 4 decimales. */
  increase_ratio: number
}

/** Respuesta de GET /api/metrics/alerts. */
export type AlertsResponse = AlertEntry[]

/** Una categoría agregada devuelta por GET /api/metrics/categories/top. */
export interface CategoryEntry {
  /** Categoría del importe agregado: suppliers, sales, operational, administrative u others. */
  category: Category
  /** Tipo de operación agregado: income o outcome. */
  operation_type: OperationType
  /** Importe total de la categoría, redondeado por el backend a 2 decimales. */
  total_amount: number
}

/** Respuesta de GET /api/metrics/categories/top. */
export type TopCategoriesResponse = CategoryEntry[]
