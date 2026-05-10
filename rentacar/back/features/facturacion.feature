# language: es
Característica: Facturación y Gestión de Pagos
  Como cliente del sistema RentaCar
  Quiero recibir facturas detalladas por mis alquileres
  Para tener control de mis gastos y pagos

  Antecedentes:
    Dado que la base de datos está limpia
    Y existe un vehículo disponible con idAuto 10 y precio por día de 100
    Y existe un cliente autenticado
    Y existe un administrador autenticado

  Escenario: Cálculo de precio base para alquiler de 3 días
    Cuando calculo el precio para el vehículo 10 por 3 días
    Entonces el precio base debe ser 300
    Y el descuento debe ser 5
    Y el precio total debe ser 360 para tipo Sedan con modificador 1.2

  Escenario: Descuento automático para alquiler de 7 días
    Cuando calculo el precio para el vehículo 10 por 7 días
    Entonces el descuento debe ser 15
    Y el precio total debe ser mayor a 0

  Escenario: Descuento automático para alquiler de 30 días
    Cuando calculo el precio para el vehículo 10 por 30 días
    Entonces el descuento debe ser 30
    Y el precio total debe ser menor al precio base

  Escenario: Factura contiene información completa del cliente
    Dado que existe una reserva completada con idReserva 200
    Cuando genero la factura de la reserva 200
    Entonces la factura debe contener nombre del cliente
    Y la factura debe contener email del cliente

  Escenario: Factura contiene información del vehículo
    Dado que existe una reserva completada con idReserva 201
    Cuando genero la factura de la reserva 201
    Entonces la factura debe contener marca y modelo del vehículo
    Y la factura debe contener precio por día

  Escenario: Factura incluye desglose de cargos
    Dado que existe una reserva completada con idReserva 202
    Cuando genero la factura de la reserva 202
    Entonces la factura debe incluir subtotal
    Y la factura debe incluir impuestos
    Y la factura debe incluir total final

  Escenario: Cargo adicional por combustible faltante en devolución
    Dado que existe una reserva activa con checkout registrado al 100 por ciento de combustible
    Cuando se registra el checkin con 50 por ciento de combustible
    Entonces los cargos adicionales deben incluir cargo por combustible
    Y el monto de combustible debe ser mayor a 0

  Escenario: Cargo adicional por retraso en devolución
    Dado que existe una reserva con fecha de fin vencida
    Cuando se registra el checkin con fecha posterior a la prevista
    Entonces los cargos adicionales deben incluir cargo por retraso
    Y el monto por retraso debe ser mayor a 0

  Escenario: Cargo adicional por accesorio faltante
    Dado que al checkout se registró un gato hidráulico presente
    Cuando se registra el checkin sin el gato hidráulico
    Entonces los cargos adicionales deben incluir cargo por accesorio faltante

  Escenario: Cargo adicional por daño nuevo
    Dado que existe una reserva activa en checkout
    Cuando se registra el checkin con un daño nuevo de costo 800
    Entonces los cargos adicionales deben incluir cargo por daño
    Y el monto del daño debe ser 800

  Escenario: Número de factura es único
    Dado que existen 2 reservas completadas
    Cuando genero la factura de la primera reserva y la segunda
    Entonces los números de factura deben ser diferentes
