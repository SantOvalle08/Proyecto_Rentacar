# language: es
Característica: Gestión de Reservas de Vehículos
  Como cliente del sistema RentaCar
  Quiero poder gestionar mis reservas de vehículos
  Para planificar mis alquileres de forma anticipada

  Antecedentes:
    Dado que la base de datos está limpia
    Y existe un vehículo disponible con idAuto 1 y precio por día de 100
    Y existe un cliente autenticado

  Escenario: Creación exitosa de reserva
    Cuando el cliente crea una reserva para el vehículo 1 del día siguiente por 3 días
    Entonces el sistema debe responder con estado 201
    Y la reserva debe tener estado "Pendiente"
    Y el precio total debe ser mayor a 0

  Escenario: Creación de reserva aplica descuento por semana
    Cuando el cliente crea una reserva para el vehículo 1 del día siguiente por 7 días
    Entonces el sistema debe responder con estado 201
    Y el descuento aplicado debe ser 15

  Escenario: Creación de reserva aplica descuento mensual
    Cuando el cliente crea una reserva para el vehículo 1 del día siguiente por 30 días
    Entonces el sistema debe responder con estado 201
    Y el descuento aplicado debe ser 30

  Escenario: Rechazo de reserva para vehículo no disponible
    Dado que el vehículo 1 no está disponible
    Cuando el cliente intenta reservar el vehículo 1 por 2 días
    Entonces el sistema debe responder con estado 400
    Y el mensaje debe indicar que el auto no está disponible

  Escenario: Rechazo de reserva con fechas inválidas
    Cuando el cliente intenta crear una reserva con fecha de inicio posterior a fecha de fin
    Entonces el sistema debe responder con estado 400
    Y el mensaje debe indicar error en las fechas

  Escenario: Obtener detalles de una reserva existente
    Dado que existe una reserva con idReserva 100
    Cuando el cliente solicita los detalles de la reserva 100
    Entonces el sistema debe responder con estado 200
    Y los detalles deben incluir fechas, estado y precio total

  Escenario: Cancelación exitosa de una reserva
    Dado que existe una reserva con idReserva 101
    Cuando el cliente cancela la reserva 101
    Entonces el sistema debe responder con estado 200
    Y la reserva debe tener estado "Cancelada"
    Y el vehículo debe quedar disponible nuevamente

  Escenario: Cálculo de precio de reserva
    Cuando el cliente solicita calcular el precio para el vehículo 1 por 5 días
    Entonces el sistema debe responder con estado 200
    Y la respuesta debe incluir precio base, descuento y precio total

  Escenario: Generación de factura para reserva
    Dado que existe una reserva con idReserva 102
    Cuando el cliente solicita la factura de la reserva 102
    Entonces el sistema debe responder con estado 200
    Y la factura debe incluir número, datos del cliente y monto total

  Escenario: Listado de reservas de un usuario
    Dado que el cliente tiene 2 reservas registradas
    Cuando el cliente solicita ver sus reservas
    Entonces el sistema debe responder con estado 200
    Y la lista debe contener exactamente 2 reservas
