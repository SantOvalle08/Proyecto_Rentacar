# language: es
Característica: Control de Flota y Disponibilidad
  Como administrador del sistema RentaCar
  Quiero gestionar la flota de vehículos
  Para mantener el catálogo actualizado y controlar la disponibilidad

  Antecedentes:
    Dado que la base de datos está limpia
    Y existe un administrador autenticado

  Escenario: Agregar nuevo vehículo a la flota
    Cuando el administrador agrega un vehículo con marca "Chevrolet" modelo "Spark" año 2023 tipo "Compacto" y precio 75 por día
    Entonces el sistema debe responder con estado 201
    Y el vehículo debe estar registrado en el sistema
    Y el vehículo debe estar disponible por defecto

  Escenario: Rechazo de vehículo sin marca
    Cuando el administrador intenta agregar un vehículo sin marca
    Entonces el sistema debe responder con estado 400

  Escenario: Rechazo de tipo de vehículo inválido
    Cuando el administrador intenta agregar un vehículo con tipo "Deportivo Extremo"
    Entonces el sistema debe responder con estado 400

  Escenario: Listar todos los vehículos de la flota
    Y existen 3 vehículos en el sistema
    Cuando el administrador solicita la lista de todos los vehículos
    Entonces el sistema debe responder con estado 200
    Y la lista debe contener 3 vehículos

  Escenario: Obtener detalles de un vehículo específico
    Y existe un vehículo con idAuto 50
    Cuando solicito los detalles del vehículo 50
    Entonces el sistema debe responder con estado 200
    Y los detalles deben incluir marca, modelo, año, tipo y precio

  Escenario: Actualizar precio de un vehículo
    Y existe un vehículo con idAuto 51 y precio de 80 por día
    Cuando el administrador actualiza el precio del vehículo 51 a 120 por día
    Entonces el sistema debe responder con estado 200
    Y el precio del vehículo 51 debe ser 120

  Escenario: Eliminar vehículo de la flota
    Y existe un vehículo con idAuto 52
    Cuando el administrador elimina el vehículo 52
    Entonces el sistema debe responder con estado 200
    Y el vehículo 52 no debe existir en el sistema

  Escenario: Buscar vehículos disponibles
    Y existen 2 vehículos disponibles y 1 no disponible
    Cuando busco vehículos con filtro disponible igual a true
    Entonces el sistema debe responder con estado 200
    Y todos los vehículos en el resultado deben estar disponibles

  Escenario: Buscar vehículos por tipo
    Y existen 2 vehículos SUV y 1 Sedan en el sistema
    Cuando busco vehículos de tipo "SUV"
    Entonces el sistema debe responder con estado 200
    Y todos los vehículos en el resultado deben ser de tipo SUV

  Escenario: Catálogo público accesible sin autenticación
    Y existen 2 vehículos disponibles en el catálogo
    Cuando solicito el catálogo público sin autenticación
    Entonces el sistema debe responder con estado 200
    Y la lista del catálogo debe ser accesible

  Escenario: Estado de vehículo cambia a alquilado tras checkout
    Y existe una reserva confirmada para el vehículo 53
    Cuando el administrador realiza el checkout de esa reserva
    Entonces el vehículo 53 debe tener estado "alquilado"
    Y el vehículo 53 no debe estar disponible

  Escenario: Estado de vehículo regresa a disponible tras checkin
    Y existe una reserva activa para el vehículo 54 en estado alquilado
    Cuando el administrador realiza el checkin sin daños
    Entonces el vehículo 54 debe tener estado "disponible"
    Y el vehículo 54 debe estar disponible
