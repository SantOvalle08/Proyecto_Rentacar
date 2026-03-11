# 🧪 Tests de Requisitos No Funcionales (RNF) - RentaCar

Este directorio contiene la suite completa de tests para validar los Requisitos No Funcionales del Sistema RentaCar basados en la norma **ISO/IEC 25010**.

## 📁 Estructura

```
tests/
├── package.json                    # Dependencias del proyecto de tests
├── config.js                       # Configuración centralizada
├── run-all-tests.js               # Script principal para ejecutar todos los tests
├── README.md                       # Este archivo
│
├── performance/                    # Tests de Eficiencia de Desempeño
│   ├── api-response-time.test.js  # RNF-001, RNF-005
│   ├── load-test.js               # RNF-003, RNF-004
│   └── memory-leak.test.js        # RNF-004
│
├── security/                       # Tests de Seguridad
│   ├── auth.test.js               # RNF-018, RNF-019
│   ├── vulnerabilities.test.js    # RNF-020
│   └── password.test.js           # RNF-018
│
├── compatibility/                  # Tests de Compatibilidad
│   └── rest-api.test.js           # RNF-008
│
├── reliability/                    # Tests de Fiabilidad
│   ├── error-handling.test.js     # RNF-015
│   └── data-integrity.test.js     # RNF-017
│
└── maintainability/                # Tests de Mantenibilidad
    └── code-quality.test.js       # RNF-023, RNF-024, RNF-025
```

## 🚀 Instalación

### 1. Navegar al directorio de tests

```powershell
cd analisis-rnf/tests
```

### 2. Instalar dependencias

```powershell
npm install
```

## ▶️ Ejecución de Tests

### Prerequisitos

**IMPORTANTE:** El backend de RentaCar debe estar ejecutándose antes de correr los tests.

```powershell
# En una terminal separada
cd ../../rentacar/back
npm start
```

### Ejecutar todos los tests

```powershell
npm test
```

O directamente:

```powershell
node run-all-tests.js
```

### Ejecutar categorías específicas

#### Tests de Performance

```powershell
# API Response Time
node performance/api-response-time.test.js

# Load Testing (requiere autocannon)
npm install autocannon
node performance/load-test.js

# Memory Leak Detection (mejor con --expose-gc)
node --expose-gc performance/memory-leak.test.js
```

#### Tests de Seguridad

```powershell
# Authentication & Authorization
node security/auth.test.js
```

## 📊 Resultados

Los resultados se guardan automáticamente en la carpeta `../resultados/`:

- `rnf-test-results-complete.json` - Resultados completos en JSON
- `rnf-test-results-report.md` - Reporte ejecutivo en Markdown
- `performance-api-results.json` - Resultados de performance API
- `auth-test-results.json` - Resultados de autenticación
- `load-test-results.json` - Resultados de load testing

## 🎯 RNF Cubiertos por Tests

### ✅ Tests Automatizados

| RNF | Descripción | Script | Estado |
|-----|-------------|--------|--------|
| RNF-001 | Tiempo de respuesta API | `performance/api-response-time.test.js` | ✅ Implementado |
| RNF-003 | Usuarios concurrentes | `performance/load-test.js` | ✅ Implementado |
| RNF-004 | Utilización de recursos | `performance/memory-leak.test.js` | ✅ Implementado |
| RNF-005 | Optimización de consultas | `performance/api-response-time.test.js` | ✅ Implementado |
| RNF-008 | Interoperabilidad API REST | `compatibility/rest-api.test.js` | 🟡 Parcial |
| RNF-015 | Tolerancia a fallos | `reliability/error-handling.test.js` | 🟡 Parcial |
| RNF-017 | Integridad de datos | `reliability/data-integrity.test.js` | 🟡 Parcial |
| RNF-018 | Autenticación | `security/auth.test.js` | ✅ Implementado |
| RNF-019 | Autorización | `security/auth.test.js` | ✅ Implementado |
| RNF-020 | Vulnerabilidades web | `security/vulnerabilities.test.js` | 🟡 Parcial |
| RNF-023 | Modularidad | `maintainability/code-quality.test.js` | 🟡 Pendiente |
| RNF-024 | Documentación | `maintainability/code-quality.test.js` | 🟡 Pendiente |
| RNF-025 | Facilidad de testing | `maintainability/code-quality.test.js` | 🟡 Pendiente |

### ⚠️ Tests Manuales Requeridos

Los siguientes RNF requieren testing manual o herramientas específicas:

| RNF | Descripción | Método de Validación |
|-----|-------------|---------------------|
| RNF-002 | Tiempo de carga frontend | Lighthouse, Web Vitals |
| RNF-006 | Compatibilidad navegadores | BrowserStack, testing manual |
| RNF-007 | Diseño responsive | DevTools, dispositivos reales |
| RNF-009 | Compatibilidad Node.js | Testing en múltiples versiones |
| RNF-010 | Facilidad de aprendizaje | Pruebas con usuarios reales |
| RNF-011 | Accesibilidad | WAVE, axe DevTools, Lighthouse |
| RNF-012 | Feedback al usuario | UX testing |
| RNF-013 | Consistencia de interfaz | Code review |
| RNF-014 | Disponibilidad | Monitoring en producción |
| RNF-016 | Recuperabilidad | Simulación de disaster recovery |
| RNF-021 | Privacidad | Privacy audit |
| RNF-022 | Auditoría | Log review |
| RNF-026 | Facilidad de modificación | Code review, análisis de impacto |
| RNF-027 | Independencia de plataforma | Testing en Windows/Linux/macOS |
| RNF-028 | Facilidad de instalación | Testing en entorno limpio |
| RNF-029 | Capacidad de reemplazo | Análisis de arquitectura |
| RNF-030 | Completitud funcional | UAT (User Acceptance Testing) |
| RNF-031 | Corrección funcional | Unit tests, integration tests |
| RNF-032 | Adecuación funcional | UAT, análisis de requisitos |

## 🔧 Configuración

Editar `config.js` para ajustar:

- URL base de la API
- Umbrales de performance
- Configuración de load testing
- Umbrales de memoria
- Configuración de seguridad

```javascript
module.exports = {
  API_BASE_URL: 'http://localhost:5001',
  PERFORMANCE_THRESHOLDS: {
    simpleQuery: 200,      // ms
    complexQuery: 500,     // ms
    postOperation: 300,    // ms
    deleteOperation: 250   // ms
  },
  // ...más configuraciones
};
```

## 📈 Interpretación de Resultados

### Tasa de Éxito

- **≥ 90%**: ✅ EXCELENTE - Sistema cumple con RNF
- **75-89%**: ⚠️ BUENO - Cumple mayormente, hay mejoras
- **60-74%**: ⚠️ ACEPTABLE - Necesita mejoras
- **< 60%**: ❌ DEFICIENTE - Problemas significativos

### Códigos de Estado

- ✅ **PASS** - Test aprobado
- ❌ **FAIL** - Test fallido
- ⊘ **SKIP** - Test omitido
- 🟡 **WARN** - Advertencia

## 🐛 Troubleshooting

### Error: "ECONNREFUSED"

**Problema:** No se puede conectar al backend.

**Solución:**
```powershell
# Verificar que el backend esté ejecutándose
cd ../../rentacar/back
npm start
```

### Error: "Cannot find module 'autocannon'"

**Problema:** Falta dependencia para load testing.

**Solución:**
```powershell
npm install autocannon
```

### Memory Leak Test impreciso

**Problema:** Resultados inconsistentes sin garbage collection.

**Solución:**
```powershell
node --expose-gc performance/memory-leak.test.js
```

## 📝 Notas Importantes

1. **Performance de Tests:** Algunos tests (especialmente load testing) pueden tardar varios minutos.

2. **Servidor Backend:** Asegúrese de que MongoDB esté ejecutándose y el backend tenga conexión a la BD.

3. **Datos de Prueba:** Los tests pueden crear datos temporales. Se recomienda usar una BD de testing.

4. **Credenciales:** Las credenciales de prueba están en `config.js`. Asegúrese de que existan usuarios correspondientes en la BD.

5. **CI/CD:** Para integración continua, ejecutar:
   ```powershell
   npm test -- --ci
   ```

## 🤝 Contribuir

Para agregar nuevos tests:

1. Crear archivo en la carpeta correspondiente
2. Seguir la estructura de tests existentes
3. Exportar la clase del test
4. Agregar al `run-all-tests.js`
5. Documentar en este README

## 📚 Referencias

- [ISO/IEC 25010:2011](https://iso25000.com/index.php/normas-iso-25000/iso-25010)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Node.js Performance Testing](https://nodejs.org/en/docs/guides/simple-profiling/)

---

**Última actualización:** Marzo 2026  
**Versión:** 1.0.0  
**Proyecto:** Sistema RentaCar
