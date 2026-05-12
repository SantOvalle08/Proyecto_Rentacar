export const sessionTestSummary = {
  suites: 5,
  tests: 63,
  passed: 63,
  successRate: '100%'
};

export const rnfResults = [
  {
    id: 'RNF-02',
    title: 'Tiempo de respuesta en verificacion de disponibilidad',
    process: 'Control de Flota y Disponibilidad',
    bucket: 'missing',
    statusLabel: 'Sin evidencia',
    summary: 'No existe una medicion ejecutada ni una captura de rendimiento para este flujo.',
    steps: [
      'Revisar el requisito de tiempo de respuesta y definir el umbral esperado.',
      'Ejecutar una prueba tipo Lighthouse o medicion de latencia sobre el flujo de disponibilidad.',
      'Guardar captura o reporte para comparar contra el umbral.'
    ],
    evidence: [
      { label: 'Referencia', value: 'analisis-rnf/INFORME_RNF_SISTEMA_RENTACAR.md' },
      { label: 'Estado actual', value: 'Requiere evidencia dinamica y captura adjunta.' }
    ]
  },
  {
    id: 'RNF-03',
    title: 'Tiempo de procesamiento de pago',
    process: 'Facturacion y Gestion de Pagos',
    bucket: 'missing',
    statusLabel: 'Sin evidencia',
    summary: 'No hay un test automatizado que mida el tiempo de procesamiento de pagos.',
    steps: [
      'Tomar el flujo de pago y fijar la operacion exacta a medir.',
      'Ejecutar un benchmark con varios intentos y registrar promedio y desviacion.',
      'Adjuntar el resultado como captura o reporte exportado.'
    ],
    evidence: [
      { label: 'Referencia', value: 'Sin suite especifica de tiempo para pagos.' }
    ]
  },
  {
    id: 'RNF-04',
    title: 'Actualizacion de estado de vehiculos',
    process: 'Control de Flota y Disponibilidad',
    bucket: 'evidence',
    statusLabel: 'Con evidencia de test',
    summary: 'Las pruebas de entrega y devolucion confirman cambios de estado a alquilado, disponible y mantenimiento.',
    steps: [
      'Ejecutar checkout sobre una reserva confirmada.',
      'Verificar que el auto pase a alquilado y deje de estar disponible.',
      'Ejecutar checkin y comprobar que el estado vuelva a disponible o mantenimiento segun la entrada.'
    ],
    evidence: [
      { label: 'Test ejecutado', value: 'rentacar/back/tests/integration/entregas.test.js' },
      { label: 'Resultado', value: 'Incluido en la corrida verde de 57 tests de integracion.' }
    ]
  },
  {
    id: 'RNF-05',
    title: 'Tiempo de generacion de factura',
    process: 'Facturacion y Gestion de Pagos',
    bucket: 'partial',
    statusLabel: 'Evidencia parcial',
    summary: 'Existe validacion funcional de factura, pero no una medicion de tiempo de generacion.',
    steps: [
      'Verificar que el endpoint de factura responda con numero, cliente, detalle y total.',
      'Medir la latencia de la generacion si se requiere evidencia de performance.',
      'Agregar una captura temporal si el requisito exige tiempo de ejecucion.'
    ],
    evidence: [
      { label: 'Test funcional', value: 'rentacar/back/tests/integration/reservas.test.js' },
      { label: 'Nota', value: 'La factura se valida, pero no el tiempo de respuesta.' }
    ]
  },
  {
    id: 'RNF-08',
    title: 'Proteccion de datos en transito',
    process: 'Comunicacion Frontend-Backend',
    bucket: 'partial',
    statusLabel: 'Evidencia parcial',
    summary: 'Hay autenticacion y headers protegidos, pero no una prueba automatica de HTTPS extremo a extremo.',
    steps: [
      'Validar que las rutas protegidas requieran token.',
      'Comprobar que el flujo use encabezados de autorizacion y CORS controlado.',
      'Completar con una captura de HTTPS o inspeccion de entorno productivo.'
    ],
    evidence: [
      { label: 'Test de soporte', value: 'rentacar/back/tests/integration/auth.test.js' },
      { label: 'Cobertura actual', value: 'Proteccion de rutas, no verificacion TLS.' }
    ]
  },
  {
    id: 'RNF-10',
    title: 'Confidencialidad de datos de clientes',
    process: 'Facturacion y Gestion de Pagos',
    bucket: 'partial',
    statusLabel: 'Evidencia parcial',
    summary: 'La salida de factura esta controlada, pero no existe una prueba dedicada de confidencialidad en pagos.',
    steps: [
      'Revisar los campos expuestos por el flujo de factura.',
      'Confirmar que no salgan credenciales ni datos sensibles innecesarios.',
      'Agregar evidencia especifica si se exige auditoria de privacidad.'
    ],
    evidence: [
      { label: 'Referencia', value: 'analisis-rnf/INFORME_RNF_SISTEMA_RENTACAR.md' },
      { label: 'Nota', value: 'No hay test automatizado exclusivo para confidencialidad en pagos.' }
    ]
  },
  {
    id: 'RNF-11',
    title: 'Completitud funcional de reservas',
    process: 'Gestion de Reservas de Vehiculos',
    bucket: 'evidence',
    statusLabel: 'Con evidencia de test',
    summary: 'El flujo de reservas cubre alta, lectura, cancelacion y consultas por usuario.',
    steps: [
      'Crear una reserva valida con usuario, auto y fechas correctas.',
      'Verificar que el sistema acepte, liste y recupere la reserva.',
      'Cancelar o consultar por usuario para confirmar el flujo completo.'
    ],
    evidence: [
      { label: 'Test ejecutado', value: 'rentacar/back/tests/integration/reservas.test.js' },
      { label: 'Resultado', value: 'Parte de la corrida verde de 57 tests.' }
    ]
  },
  {
    id: 'RNF-12',
    title: 'Calculos correctos de tarifa',
    process: 'Facturacion y Gestion de Pagos',
    bucket: 'evidence',
    statusLabel: 'Con evidencia de test',
    summary: 'La calculadora de precio responde con total y descuento esperados para distintos rangos de dias.',
    steps: [
      'Ejecutar el calculo de precio para una reserva corta.',
      'Validar que el total sea positivo y que el numero de dias sea correcto.',
      'Comprobar el descuento cuando la reserva supera el umbral configurado.'
    ],
    evidence: [
      { label: 'Test ejecutado', value: 'rentacar/back/tests/integration/reservas.test.js' },
      { label: 'Cobertura', value: 'Calcula total y descuento del 15% para 7 dias o mas.' }
    ]
  },
  {
    id: 'RNF-13',
    title: 'Pertinencia de funciones del catalogo',
    process: 'Control de Flota y Disponibilidad',
    bucket: 'evidence',
    statusLabel: 'Con evidencia de test',
    summary: 'Las rutas del catalogo responden a filtros, busqueda, detalle y errores controlados.',
    steps: [
      'Probar GET /api/catalogo con filtros y ordenamiento.',
      'Probar la busqueda textual con query y filtros combinados.',
      'Comprobar detalle, 404 y error 500 para cerrar el ciclo de uso.'
    ],
    evidence: [
      { label: 'Test ejecutado', value: 'rentacar/back/tests/catalogo.routes.test.js' },
      { label: 'Resultado', value: '1 suite, 6 tests, 100% aprobados.' }
    ]
  },
  {
    id: 'RNF-14',
    title: 'Integridad de las transacciones de reserva',
    process: 'Gestion de Reservas de Vehiculos',
    bucket: 'evidence',
    statusLabel: 'Con evidencia de test',
    summary: 'Las transacciones de checkout, checkin y cancelacion dejan el sistema en estados coherentes.',
    steps: [
      'Ejecutar checkout de una reserva confirmada.',
      'Verificar que la entidad relacionada cambie de forma consistente.',
      'Comprobar que cancelacion o checkin restauren disponibilidad cuando corresponde.'
    ],
    evidence: [
      { label: 'Test ejecutado', value: 'rentacar/back/tests/integration/entregas.test.js' },
      { label: 'Resultado', value: 'Validacion cruzada con reservas e incidencias en la corrida verde.' }
    ]
  },
  {
    id: 'RNF-15',
    title: 'Generacion de comprobantes fiscales',
    process: 'Facturacion y Gestion de Pagos',
    bucket: 'evidence',
    statusLabel: 'Con evidencia de test',
    summary: 'El endpoint de factura responde con numeroFactura, cliente, detalles y total.',
    steps: [
      'Solicitar la factura de una reserva existente.',
      'Verificar que el payload entregue los campos fiscales basicos.',
      'Diferenciar la factura funcional del timbrado fiscal si el negocio lo exige.'
    ],
    evidence: [
      { label: 'Test ejecutado', value: 'rentacar/back/tests/integration/reservas.test.js' },
      { label: 'Nota', value: 'Existe comprobante funcional; el timbrado fiscal no se valida aqui.' }
    ]
  },
  {
    id: 'RNF-16',
    title: 'Modularidad de la arquitectura',
    process: 'Desarrollo y Mantenimiento del Sistema',
    bucket: 'partial',
    statusLabel: 'Evidencia parcial',
    summary: 'La separacion por controladores, rutas, modelos y servicios es visible, pero no existe un test automatizado directo.',
    steps: [
      'Revisar la estructura de carpetas y responsabilidades por capa.',
      'Confirmar que la logica de negocio no quede acoplada a la presentacion.',
      'Documentar el criterio arquitectonico con evidencia de repositorio.'
    ],
    evidence: [
      { label: 'Referencia', value: 'rentacar/back/src/' },
      { label: 'Nota', value: 'Es una validacion de estructura, no un test automatizado.' }
    ]
  },
  {
    id: 'RNF-17',
    title: 'Uso de patrones de diseno',
    process: 'Desarrollo de Logica de Negocio',
    bucket: 'evidence',
    statusLabel: 'Con evidencia de test',
    summary: 'Las pruebas muestran comportamientos coherentes con separacion de responsabilidades y flujo controlado.',
    steps: [
      'Revisar la capa de controladores y helpers reutilizables.',
      'Validar que el comportamiento cambie segun estado y contexto.',
      'Confirmar que el flujo de negocio se mantenga estable en pruebas de integracion.'
    ],
    evidence: [
      { label: 'Tests base', value: 'reservas, entregas e incidencias en backend.' },
      { label: 'Resultado', value: 'Comportamiento consistente en la corrida verde.' }
    ]
  },
  {
    id: 'RNF-18',
    title: 'Analizabilidad del codigo',
    process: 'Revision y Control de Calidad',
    bucket: 'evidence',
    statusLabel: 'Con evidencia de test',
    summary: 'La suite de autenticacion deja trazas claras y validaciones observables para revisar el sistema.',
    steps: [
      'Ejecutar login valido e invalido para ver trazabilidad de respuestas.',
      'Comprobar que los errores quedan explicitados con status y mensaje.',
      'Usar los reportes generados por Jest como evidencia de control de calidad.'
    ],
    evidence: [
      { label: 'Test ejecutado', value: 'rentacar/back/tests/integration/auth.test.js' },
      { label: 'Reporte', value: 'Jest HTML generado en rentacar/back/reports/jest-report.html' }
    ]
  },
  {
    id: 'RNF-19',
    title: 'Pruebas unitarias e integracion',
    process: 'Revision y Control de Calidad',
    bucket: 'evidence',
    statusLabel: 'Con evidencia de test',
    summary: 'Existen suites unitarias y de integracion ejecutadas con exito en esta sesion.',
    steps: [
      'Ejecutar las suites de integracion principales del backend.',
      'Ejecutar la suite unitaria de catalogo.',
      'Consolidar el total de tests verdes para reportar cobertura funcional.'
    ],
    evidence: [
      { label: 'Corrida actual', value: '5 suites, 63 tests, 63 aprobados.' },
      { label: 'Suites', value: 'auth, reservas, entregas, incidencias y catalogo.' }
    ]
  },
  {
    id: 'RNF-20',
    title: 'Documentacion tecnica del codigo',
    process: 'Desarrollo y Mantenimiento',
    bucket: 'partial',
    statusLabel: 'Evidencia parcial',
    summary: 'Hay documentacion tecnica en Markdown, pero no una prueba automatizada que la verifique.',
    steps: [
      'Localizar los informes y README tecnicos del proyecto.',
      'Confirmar que describen arquitectura, despliegue y resultados RNF.',
      'Agregar evidencia si se requiere validacion formal de documentacion.'
    ],
    evidence: [
      { label: 'Docs', value: 'analisis-rnf/README.md y resultados relacionados.' },
      { label: 'Nota', value: 'No existe test automatizado para este RNF.' }
    ]
  },
  {
    id: 'RNF-22',
    title: 'Tolerancia a fallos en transacciones',
    process: 'Gestion de Reservas y Pagos',
    bucket: 'partial',
    statusLabel: 'Evidencia parcial',
    summary: 'Los flujos responden con errores controlados, pero no hay pruebas de inyeccion de fallos transitorios.',
    steps: [
      'Validar que entradas invalidas devuelvan status adecuados.',
      'Confirmar que los estados de reserva y vehiculo no queden corruptos.',
      'Preparar una prueba de resiliencia si se requiere tolerancia real a fallos.'
    ],
    evidence: [
      { label: 'Base tecnica', value: 'reservas, entregas e incidencias integradas.' },
      { label: 'Nota', value: 'Falta fault injection o retry test especifico.' }
    ]
  },
  {
    id: 'RNF-23',
    title: 'Recuperacion ante fallos transitorios',
    process: 'Operacion del Sistema',
    bucket: 'missing',
    statusLabel: 'Sin evidencia',
    summary: 'No existe una suite que valide reintentos, recuperacion o fallback ante fallos breves.',
    steps: [
      'Definir el fallo transitorio a simular.',
      'Ejecutar la operacion con una interrupcion controlada.',
      'Guardar una captura que demuestre recuperacion exitosa.'
    ],
    evidence: [
      { label: 'Estado actual', value: 'Sin prueba automatizada ni captura.' }
    ]
  },
  {
    id: 'RNF-24',
    title: 'Ausencia de fallos en procesos criticos',
    process: 'Reservas, Control de Flota y Pagos',
    bucket: 'evidence',
    statusLabel: 'Con evidencia de test',
    summary: 'Los procesos criticos ejecutados en esta sesion terminaron sin fallos.',
    steps: [
      'Correr las suites de autenticacion, reservas, entregas e incidencias.',
      'Confirmar que checkout, checkin, factura y catalogo no rompen el flujo principal.',
      'Usar el resultado verde como evidencia de estabilidad funcional.'
    ],
    evidence: [
      { label: 'Corrida actual', value: '63 tests aprobados.' },
      { label: 'Cobertura critica', value: 'Reservas, flota, incidencias y catalogo.' }
    ]
  },
  {
    id: 'RNF-25',
    title: 'Consistencia de datos en la base de datos',
    process: 'Todos los Procesos Transaccionales',
    bucket: 'evidence',
    statusLabel: 'Con evidencia de test',
    summary: 'Las pruebas verifican cambios de estado coherentes sobre MongoDB en memoria y sobre entidades relacionadas.',
    steps: [
      'Levantar una base de datos de prueba en memoria.',
      'Crear, actualizar y limpiar entidades relacionadas en una misma transaccion funcional.',
      'Comprobar que los estados finales coinciden con las reglas de negocio.'
    ],
    evidence: [
      { label: 'Suites', value: 'reservas, entregas, incidencias y auth.' },
      { label: 'Evidencia', value: 'Persistencia coherente en MongoMemoryServer.' }
    ]
  },
  {
    id: 'RNF-26',
    title: 'Aprendizabilidad de la interfaz',
    process: 'Interaccion de Clientes con la Plataforma Web',
    bucket: 'missing',
    statusLabel: 'Sin evidencia',
    summary: 'No existe evaluacion con usuarios o test de usabilidad para medir aprendizaje.',
    steps: [
      'Definir una tarea de usuario y un grupo de prueba.',
      'Observar si pueden completar el flujo sin ayuda.',
      'Adjuntar captura o informe de usabilidad.'
    ],
    evidence: [
      { label: 'Estado actual', value: 'Sin test de usuarios ni captura.' }
    ]
  },
  {
    id: 'RNF-27',
    title: 'Operabilidad en dispositivos moviles',
    process: 'Interaccion del Usuario con el Catalogo y Reservas',
    bucket: 'missing',
    statusLabel: 'Sin evidencia',
    summary: 'No se ejecuto una validacion automatica o manual con captura movil.',
    steps: [
      'Abrir el catalogo y el flujo de reserva en una resolucion movil.',
      'Verificar navegacion, lectura y accion de formularios.',
      'Guardar captura de pantalla o video corto.'
    ],
    evidence: [
      { label: 'Estado actual', value: 'Sin captura responsive asociada a este reporte.' }
    ]
  },
  {
    id: 'RNF-28',
    title: 'Claridad en la presentacion de costos',
    process: 'Gestion de Reservas y Pagos',
    bucket: 'partial',
    statusLabel: 'Evidencia parcial',
    summary: 'La interfaz de checkin muestra preview de cargos, pero no hay captura formal que lo documente.',
    steps: [
      'Revisar el bloque de preview de cargos en checkin.',
      'Confirmar que el usuario vea combustible, retraso y danos en formato entendible.',
      'Anexar captura de interfaz si el requisito exige evidencia visual.'
    ],
    evidence: [
      { label: 'Pantalla', value: 'rentacar/front/files/src/app/dashboard/entregas/checkin/[reservaId]/page.js' },
      { label: 'Nota', value: 'La presentacion existe, falta captura de validacion.' }
    ]
  },
  {
    id: 'RNF-29',
    title: 'Proteccion contra errores de usuario',
    process: 'Registro, Reservas y Pagos',
    bucket: 'partial',
    statusLabel: 'Evidencia parcial',
    summary: 'Las validaciones de campos y estados rechazan entradas invalidas, aunque no existe test UX dedicado.',
    steps: [
      'Probar formularios con datos faltantes o incoherentes.',
      'Verificar que el backend devuelva error claro.',
      'Registrar una captura de la validacion si se requiere evidencia formal.'
    ],
    evidence: [
      { label: 'Base de test', value: 'reservas.test, entregas.test e incidencias.test.' },
      { label: 'Nota', value: 'No hay prueba de experiencia de usuario como tal.' }
    ]
  },
  {
    id: 'RNF-30',
    title: 'Accesibilidad basica de la interfaz',
    process: 'Interaccion General con el Sistema',
    bucket: 'missing',
    statusLabel: 'Sin evidencia',
    summary: 'No existe captura de contraste, teclado, lector o auditoria de accesibilidad basica.',
    steps: [
      'Ejecutar una auditoria de accesibilidad basica sobre la web.',
      'Corregir etiquetas, contraste y foco si aparece una alerta.',
      'Guardar la captura del reporte de accesibilidad.'
    ],
    evidence: [
      { label: 'Estado actual', value: 'Sin prueba de accesibilidad automatizada.' }
    ]
  }
];
