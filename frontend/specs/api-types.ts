import type { BusinessType, Category, OperationType } from '../src/lib/financial-types'

/** Respuesta del endpoint GET /api/metrics/facets. */
export interface FacetsResponse {
  /** Tipos de operación disponibles. */
  operation_types: OperationType[]
  /** Tipos de negocio disponibles. */
  business_types: BusinessType[]
  /** Categorías disponibles. */
  categories: Category[]
  /** Fecha más antigua del dataset, en formato YYYY-MM-DD. */
  min_date: string
  /** Fecha más reciente del dataset, en formato YYYY-MM-DD. */
  max_date: string
}

/** Una alerta de anomalía devuelta por GET /api/metrics/alerts. */
export interface AlertEntry {
  /** Período de la alerta. */
  period: string
  /** Importe total de gastos del período. */
  outcome_total: number
  /** Media de referencia de gastos. */
  baseline_average: number
  /** Incremento relativo como proporción, no como porcentaje multiplicado por 100. */
  increase_ratio: number
}

/** Respuesta de GET /api/metrics/alerts. */
export type AlertsResponse = AlertEntry[]

/** Una categoría agregada devuelta por GET /api/metrics/categories/top. */
export interface CategoryEntry {
  /** Categoría del importe agregado. */
  category: Category
  /** Tipo de operación agregado. */
  operation_type: OperationType
  /** Importe total de la categoría. */
  total_amount: number
}

/** Respuesta de GET /api/metrics/categories/top. */
export type TopCategoriesResponse = CategoryEntry[]
