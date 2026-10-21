# Plan técnico: filtro de fechas

## Cambios

- **Backend:** no requiere cambios. `/api/metrics` ya admite `start_date` y `end_date` opcionales con límites inclusivos; `/api/metrics/facets` ya devuelve `min_date` y `max_date`.
- **Frontend:**
  - `frontend/src/lib/financial-types.ts`: tipar las fechas de las facetas.
  - `frontend/src/App.tsx`: consultar las facetas y las métricas filtradas, conservar los estados de carga y error, y recalcular KPIs y gráficos con los resultados.
  - `frontend/src/components/dashboard/dashboard-header.tsx`: incorporar los campos de fecha y mostrar las fechas mínima y máxima disponibles.

## Orden recomendado

1. Añadir el tipo para la respuesta de facetas.
2. Conectar en `App.tsx` la carga de facetas y de métricas con los parámetros de fecha seleccionados.
3. Añadir los campos y las fechas disponibles al encabezado.

## Verificación básica

- Ejecutar las pruebas backend existentes para comprobar las rutas y filtros.
- Comprobar el dashboard sin fechas, solo con fecha de inicio, solo con fecha de fin y con ambas; verificar que KPIs y gráficos reflejen el rango.

## Riesgos

- Solicitudes simultáneas al cambiar las fechas podrían mostrar una respuesta anterior.
- Un rango invertido o sin movimientos produciría resultados vacíos; el spec no define un comportamiento especial para esos casos.
