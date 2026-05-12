# Guía: Prueba de Tiempo de Respuesta en Verificación de Disponibilidad

## 📋 Resumen del Requisito

- **RNF Validado**: RNF-001 (Tiempo de respuesta), RNF-009 (Disponibilidad de flota)
- **Objetivo**: Medir y validar que el tiempo de respuesta al verificar disponibilidad de autos sea ≤ 200ms (consultas simples) o ≤ 500ms (consultas complejas)
- **Flujo Probado**: 
  - GET /api/catalogo (listado global de disponibilidad)
  - GET /api/catalogo?disponible=true&filtros (búsqueda con filtros)
  - GET /api/catalogo/search?query=xxx (búsqueda textual)

---

## 🚀 Pasos para Ejecutar la Prueba

### Paso 1: Verificar que el Backend esté Corriendo

```powershell
# Desde la terminal, verifica que el backend responda
curl http://localhost:5001/api/catalogo

# O accede a través del navegador
http://localhost:5001/api/catalogo
```

### Paso 2: Navega a la carpeta de tests de RNF

```powershell
cd "c:\Users\molin\OneDrive\Documentos\Universidad\softwareIII\Proyecto_Rentacar\analisis-rnf\tests"
```

### Paso 3: Instala dependencias (si no las tienes)

```powershell
npm install
```

### Paso 4: Ejecuta la prueba de disponibilidad

**Opción A: Via script npm (RECOMENDADO)**
```powershell
npm run test:disponibilidad
```

**Opción B: Directamente con Node**
```powershell
node performance/disponibilidad-response-time.test.js
```

---

## 📊 Entendiendo los Resultados

### Output de la Terminal

La prueba mostrará:

```
Test 1: Verificación de Disponibilidad Global (GET /api/catalogo)
==================================================================

  Iteración 1/15: 145ms (145000μs)
  Iteración 2/15: 152ms (152000μs)
  ...

Resultados Estadísticos:
  Tiempo promedio: 148.50ms
  Tiempo mínimo: 142ms
  Tiempo máximo: 165ms
  Desv. Estándar: 7.25ms
  Umbral: 200ms
  Autos encontrados (promedio): 45
  Estado: APROBADO ✓ (51.50ms por debajo del umbral)
```

### Reportes Generados

Después de ejecutar, se generan dos archivos en `analisis-rnf/resultados/`:

1. **`disponibilidad-perf-report.json`** - Datos en formato JSON
2. **`disponibilidad-perf-report.html`** - Dashboard visual interactivo

#### Abre el reporte HTML
```powershell
# Windows
start "analisis-rnf/resultados/disponibilidad-perf-report.html"

# PowerShell
Invoke-Item "analisis-rnf/resultados/disponibilidad-perf-report.html"
```

---

## 📈 Interpretación de Métricas

| Métrica | Qué significa |
|---------|--------------|
| **Tiempo promedio** | Media aritmética de todos los tiempos de respuesta |
| **Tiempo mínimo/máximo** | Rango de variabilidad en las respuestas |
| **Desv. Estándar** | Consistencia - valores bajos = respuestas predecibles |
| **Umbral** | Límite máximo permitido según RNF-001 |
| **Estado** | APROBADO si promedio ≤ umbral, FALLIDO si no |

### Criterios de Aprobación

✅ **APROBADO**: `Tiempo promedio ≤ Umbral`
- GET /api/catalogo (simple): ≤ 200ms
- GET /api/catalogo (con filtros): ≤ 500ms
- GET /api/catalogo/search: ≤ 500ms

❌ **FALLIDO**: `Tiempo promedio > Umbral`

---

## 🔍 Pruebas Incluidas

### 1. Disponibilidad Global
- **Endpoint**: `GET /api/catalogo`
- **Iteraciones**: 15
- **Qué mide**: Tiempo para obtener el catálogo completo de autos disponibles
- **Umbral**: 200ms

### 2. Disponibilidad con Filtros
- **Endpoints**: `GET /api/catalogo?disponible=true&filtro=valor`
- **Filtros probados**:
  - Solo disponibles: `?disponible=true`
  - Por tipo: `?disponible=true&tipoCoche=SUV`
  - Por precio y marca: `?disponible=true&marca=Toyota&precioMin=30&precioMax=80`
- **Iteraciones**: 10 por filtro
- **Umbral**: 500ms (consulta compleja)

### 3. Búsqueda Textual
- **Endpoint**: `GET /api/catalogo/search?query=xxx&disponible=true`
- **Términos probados**: Toyota, SUV, Gasolina
- **Iteraciones**: 10 por término
- **Umbral**: 500ms

---

## 🛠️ Troubleshooting

### Error: "Can't reach API"
**Solución**: Verifica que el backend esté corriendo
```powershell
cd "c:\Users\molin\OneDrive\Documentos\Universidad\softwareIII\Proyecto_Rentacar\rentacar\back"
npm run dev
```

### Error: "Authentication failed"
**Solución**: Verifica que las credenciales en `config.js` sean correctas. Por defecto usa:
- Email: `admin@test.com`
- Contraseña: `Admin1234`

### Tiempos muy altos (> 500ms)
**Posibles causas**:
1. Base de datos lenta → Revisa índices MongoDB
2. Demasiados datos → Implementa paginación
3. Consultas ineficientes → Revisa queries en `autoController.js`
4. Red lenta → Prueba en una máquina más rápida

---

## 📝 Ejemplo de Reporte JSON

```json
{
  "timestamp": "2026-05-12T15:30:45.123Z",
  "summary": {
    "totalTests": 15,
    "passedTests": 14,
    "passRate": "93.33"
  },
  "results": [
    {
      "endpoint": "GET /api/catalogo",
      "tipo": "Disponibilidad Global",
      "avgTime": "148.50",
      "minTime": 142,
      "maxTime": 165,
      "stdDev": "7.25",
      "threshold": 200,
      "passed": true,
      "rnf": "RNF-001, RNF-009",
      "timestamp": "2026-05-12T15:30:45.123Z"
    }
  ]
}
```

---

## 📚 Referencias

- **RNF-001**: Tiempo de respuesta de API
  - Consultas simples (GET sin JOINs): ≤ 200ms (p95)
  - Consultas complejas (con JOINs): ≤ 500ms (p95)
  
- **RNF-009**: Disponibilidad de Flota
  - Debe verificarse en tiempo real sin demoras

---

## 🔗 Comparación con Baseline

Para comparar resultados entre ejecuciones:

```powershell
# Ejecuta la prueba nuevamente
npm run test:disponibilidad

# Compara los reportes
diff analisis-rnf/resultados/disponibilidad-perf-report.json (baseline-anterior).json
```

---

## ✅ Checklist de Validación

- [ ] Backend está corriendo en http://localhost:5001
- [ ] MongoDB está disponible
- [ ] Hay datos de prueba en la BD (autos, catálogos)
- [ ] Ejecuté `npm run test:disponibilidad`
- [ ] Revisé el reporte HTML
- [ ] Comparé contra el umbral de RNF-001
- [ ] Documenté los resultados

---

## 📧 Más información

Para detalles adicionales sobre RNF o problemas:
- Revisa `INFORME_RNF_SISTEMA_RENTACAR.md`
- Consulta `RESUMEN_EJECUTIVO.md`
