# language: es
Característica: Proceso de Gestión de Incidencias
  Como usuario del sistema RentaCar
  Quiero poder reportar y consultar incidencias durante el alquiler
  Para documentar cualquier problema con el vehículo durante el uso

  Antecedentes:
    Dado que la base de datos está limpia
    Y existe un administrador autenticado
    Y existe un cliente autenticado
    Y existe un vehículo disponible con idAuto 20
    Y existe una reserva activa en estado Alquilado con idReserva 300

  Escenario: Reporte exitoso de incidencia tipo accidente
    Cuando el cliente reporta una incidencia de tipo "Accidente" con descripción "Golpe en parachoques" y costo estimado 600
    Entonces el sistema debe responder con estado 201
    Y la incidencia debe quedar registrada con tipo "Accidente"
    Y el costo estimado debe ser 600

  Escenario: Reporte exitoso de incidencia tipo avería
    Cuando el cliente reporta una incidencia de tipo "Avería mecánica" con descripción "Motor no arranca"
    Entonces el sistema debe responder con estado 201
    Y la incidencia debe quedar registrada con tipo "Avería mecánica"

  Escenario: Reporte exitoso con observaciones adicionales
    Cuando el cliente reporta una incidencia con observaciones "Ocurrió en zona de aparcamiento"
    Entonces el sistema debe responder con estado 201
    Y las observaciones deben estar registradas

  Escenario: Rechazo de incidencia sin tipo
    Cuando el cliente intenta reportar una incidencia sin tipo
    Entonces el sistema debe responder con estado 400
    Y el mensaje debe indicar que tipo es requerido

  Escenario: Rechazo de incidencia sin descripción
    Cuando el cliente intenta reportar una incidencia sin descripción
    Entonces el sistema debe responder con estado 400
    Y el mensaje debe indicar que descripción es requerida

  Escenario: Rechazo de incidencia en reserva no activa
    Dado que existe una reserva con idReserva 301 en estado Pendiente
    Cuando el cliente intenta reportar incidencia en la reserva 301
    Entonces el sistema debe responder con estado 400
    Y el mensaje debe indicar que solo se pueden reportar incidencias en reservas activas

  Escenario: Listado de incidencias de una reserva
    Dado que existen 3 incidencias registradas para la reserva 300
    Cuando el cliente consulta las incidencias de la reserva 300
    Entonces el sistema debe responder con estado 200
    Y la lista debe contener 3 incidencias

  Escenario: Listado vacío cuando no hay incidencias
    Cuando el cliente consulta las incidencias de la reserva 300 sin incidencias previas
    Entonces el sistema debe responder con estado 200
    Y la lista debe estar vacía

  Escenario: Registro de múltiples incidencias en el mismo alquiler
    Cuando el cliente reporta 3 incidencias distintas en la reserva 300
    Y consulta las incidencias de la reserva 300
    Entonces la lista debe contener las 3 incidencias registradas

  Escenario: Incidencia requiere autenticación
    Cuando un usuario no autenticado intenta reportar una incidencia en la reserva 300
    Entonces el sistema debe responder con estado 401

  Escenario: Costo estimado es opcional en incidencia
    Cuando el cliente reporta una incidencia sin especificar costo estimado
    Entonces el sistema debe responder con estado 201
    Y el costo estimado debe ser 0 por defecto
