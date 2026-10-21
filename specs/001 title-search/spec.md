# Filtro de rango de fechas del dashboard

## Objetivo
Permitir consultar los datos del dashboard principal dentro de un rango de fechas opcional.

## Usuario
Persona que consulta el dashboard financiero.

## Historias de usuario
- Como usuario, quiero indicar una fecha de inicio y una fecha de fin para consultar los datos de ese período.
- Como usuario, quiero conocer las fechas más antigua y más reciente disponibles para elegir un período.

## Requisitos funcionales
- El dashboard debe ofrecer campos opcionales para la fecha de inicio y la fecha de fin.
- Las fechas seleccionadas deben enviarse en formato `YYYY-MM-DD`.
- El rango debe afectar a todos los datos presentados actualmente en el dashboard.
- La fecha más antigua y la más reciente del dataset deben mostrarse cerca de los campos.
- Si no se selecciona ninguna fecha, deben mostrarse todos los datos disponibles.

## Criterios de aceptación
1. El dashboard presenta campos para fecha de inicio y fecha de fin, ambos opcionales.
2. Al seleccionar fechas, estas se envían en formato `YYYY-MM-DD`.
3. Si solo se indica fecha de inicio, se muestran los datos desde esa fecha, inclusive.
4. Si solo se indica fecha de fin, se muestran los datos hasta esa fecha, inclusive.
5. Si se indican ambas fechas, se muestran los datos comprendidos entre ellas, incluyendo ambos límites.
6. Si ambos campos están vacíos, se muestran todos los datos disponibles.
7. Los indicadores y gráficos del dashboard reflejan el mismo rango aplicado; las fechas mínima y máxima disponibles aparecen cerca de los campos.

## Fuera de alcance
- Filtros distintos del rango de fechas.
- Funcionalidades 2 y 3 del ejercicio.

## Reglas
- La fecha de inicio establece el límite inferior del rango y la fecha de fin establece el límite superior; ambos límites son inclusivos.
- Las fechas mostradas como mínima y máxima corresponden al dataset disponible, no al rango seleccionado.

## Casos de prueba
1. Con ambos campos vacíos, se muestran todos los datos disponibles.
2. Con solo fecha de inicio, se incluyen los datos de esa fecha y posteriores.
3. Con solo fecha de fin, se incluyen los datos de esa fecha y anteriores.
4. Con ambas fechas, se incluyen los datos entre ellas, incluyendo ambas fechas.
5. Al seleccionar fechas, se envían con formato `YYYY-MM-DD`.
6. Al cambiar el rango, todos los indicadores y gráficos reflejan los datos del mismo rango.
