# Estado actual

Este documento separa lo que muestran los archivos de lo que se ha ejecutado. Las observaciones de esta memoria proceden de inspección estática; no se ejecutaron las suites de prueba ni los servicios al redactarla.

## Funcionalidades observadas

- El backend genera datos sintéticos de movimientos, ordenados por fecha; el test correspondiente espera 360 elementos cuando se usa una semilla (`../backend/app/routes.py`, `../backend/tests/test_routes.py`).
- `/api/metrics` acepta filtros de fecha, categoría y tipo de operación. También hay rutas declaradas para salud, facetas, resúmenes, categorías principales, comparación, alertas y segmentos B2B/B2C (`../backend/app/routes.py`).
- El frontend consume `/api/metrics`, calcula ingresos, gastos, beneficio, porcentaje de beneficio y agregados mensuales, y presenta cuatro KPIs y dos gráficos (`../frontend/src/App.tsx`, `../frontend/src/lib/financial-utils.ts`, `../frontend/src/components/dashboard/kpi-row.tsx`, `../frontend/src/components/dashboard/income-outcome-chart.tsx`, `../frontend/src/components/dashboard/profit-percent-chart.tsx`).
- La interfaz modela carga y error al solicitar datos (`../frontend/src/App.tsx`).

## Limitaciones y riesgos conocidos

- El encabezado usa la etiqueta fija `2024 - Full Year`, mientras las fechas del generador dependen de `date.today()` (`../frontend/src/App.tsx`, `../backend/app/routes.py`). La discrepancia estática también está registrada en `../verification.md`.
- `computeMonthlyData` convierte `create_date` con `new Date(...)` y obtiene el año/mes mediante getters locales; como el backend puede generar movimientos el día 1, en zonas horarias al oeste de UTC una fecha ISO como `2026-03-01` puede interpretarse localmente como el día anterior y agregarse al mes previo (`../frontend/src/lib/financial-utils.ts`, `../backend/app/routes.py`). En una comprobación puntual de auditoría con `TZ=America/Los_Angeles`, `2026-03-01` se interpretó como 28 de febrero; no es una prueba permanente. Posible solución, no implementada ni aprobada: tratar `create_date` como fecha de calendario (por ejemplo, extraer los componentes ISO o agrupar con UTC de forma consistente) y añadir una prueba para el primer día del mes en una zona horaria negativa.
- `generate_mock_movements` llama a `random.seed(seed)`, lo que modifica el estado aleatorio global del proceso (`../backend/app/routes.py`).
- `build_metrics_facets` indexa el primer y último elemento de la lista ordenada; no define un resultado para una lista vacía (`../backend/app/routes.py`).
- La prueba de comparación usa fechas fijas de marzo de 2025 y verifica las claves de la respuesta, no los valores calculados (`../backend/tests/test_routes.py`).
- `CORSMiddleware` permite cualquier origen, método y encabezado junto con credenciales (`../backend/app/main.py`). Compose declara `depends_on` para el backend, pero no un healthcheck (`../docker-compose.yml`); el backend sí declara `/health` (`../backend/app/routes.py`).
- El frontend revisado solo consume `/api/metrics`; las demás rutas backend no se observaron conectadas a esta pantalla (`../frontend/src/App.tsx`, `../backend/app/routes.py`).

## Pruebas declaradas y verificaciones

- Vitest contiene pruebas de valores de KPIs, porcentaje sin ingresos, agregación cronológica cruzando años y formatos (`../frontend/src/lib/financial-utils.test.ts`).
- Pytest con `TestClient` contiene pruebas de endpoints, filtros y algunos valores/ordenamientos; la prueba de comparación mencionada arriba comprueba solo el conjunto de claves (`../backend/tests/test_routes.py`).
- Los manifiestos declaran `npm test` para Vitest y las dependencias de pytest (`../frontend/package.json`, `../backend/requirements.txt`). No se ejecutaron esos comandos ni Docker Compose al crear esta memoria; por tanto, no se reportan resultados de ejecución.

## Prioridades derivadas de la evidencia

Estas prioridades describen riesgos observados, no un roadmap aprobado:

1. Corregir la etiqueta del período para que no contradiga las fechas generadas (`../frontend/src/App.tsx`, `../backend/app/routes.py`).
2. Aislar la aleatoriedad del generador y definir/probar el comportamiento de facetas vacías (`../backend/app/routes.py`, `../backend/tests/test_routes.py`).
3. Fortalecer la prueba de comparación con entradas controladas y aserciones numéricas (`../backend/tests/test_routes.py`).
4. Antes de desplegar con una configuración de producción, revisar CORS y readiness de los servicios (`../backend/app/main.py`, `../docker-compose.yml`).