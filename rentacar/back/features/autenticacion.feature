# language: es
Característica: Gestión de Usuario y Autenticación
  Como usuario del sistema RentaCar
  Quiero poder registrarme e iniciar sesión
  Para acceder a los servicios de renta de vehículos

  Antecedentes:
    Dado que la base de datos está limpia

  Escenario: Registro exitoso de nuevo usuario
    Dado que no existe un usuario con el email "nuevo@test.com"
    Cuando envío una solicitud de registro con nombre "Carlos López" email "nuevo@test.com" y contraseña "Segura123"
    Entonces el sistema debe responder con estado 201
    Y el mensaje de respuesta debe contener "éxito"

  Escenario: Registro fallido por email duplicado
    Dado que ya existe un usuario con email "duplicado@test.com"
    Cuando envío una solicitud de registro con nombre "Otro Usuario" email "duplicado@test.com" y contraseña "Otra123"
    Entonces el sistema debe responder con estado 400
    Y el mensaje de respuesta debe contener "registrado"

  Escenario: Registro fallido por campos faltantes
    Cuando envío una solicitud de registro sin nombre con email "incompleto@test.com" y contraseña "Pwd123"
    Entonces el sistema debe responder con estado 400
    Y el body de respuesta debe tener success en false

  Escenario: Login exitoso con credenciales correctas
    Dado que existe un usuario con email "usuario@test.com" y contraseña "MiClave123"
    Cuando envío una solicitud de login con email "usuario@test.com" y contraseña "MiClave123"
    Entonces el sistema debe responder con estado 200
    Y la respuesta debe contener un token JWT
    Y los datos del usuario deben contener el email "usuario@test.com"

  Escenario: Login fallido por contraseña incorrecta
    Dado que existe un usuario con email "usuario@test.com" y contraseña "MiClave123"
    Cuando envío una solicitud de login con email "usuario@test.com" y contraseña "Incorrecta"
    Entonces el sistema debe responder con estado 401
    Y el body de respuesta debe tener success en false

  Escenario: Login fallido por usuario inexistente
    Cuando envío una solicitud de login con email "noexiste@test.com" y contraseña "Cualquiera123"
    Entonces el sistema debe responder con estado 401

  Escenario: Acceso a ruta protegida sin token
    Cuando realizo una solicitud GET a "/api/usuarios" sin token
    Entonces el sistema debe responder con estado 401

  Escenario: Cliente intenta acceder a recurso de administrador
    Y existe un cliente autenticado
    Cuando el cliente realiza una solicitud GET a "/api/usuarios"
    Entonces el sistema debe responder con estado 403
    Y el mensaje debe indicar que se requiere rol de administrador

  Escenario: Administrador accede a lista de usuarios
    Y existe un administrador autenticado
    Cuando el administrador realiza una solicitud GET a "/api/usuarios"
    Entonces el sistema debe responder con estado 200
    Y la respuesta debe ser una lista de usuarios
