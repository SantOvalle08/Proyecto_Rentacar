# 📄 Sistema de Facturación Electrónica - RentACar

## Descripción

Sistema completo de generación, visualización e impresión de facturas electrónicas en formato colombiano (DIAN) integrado en el sistema de reservas de vehículos.

## 🎯 Características

### ✅ Cumplimiento Normativo Colombia
- ✓ Formato de facturación electrónica DIAN
- ✓ Resolución DIAN y rango autorizado
- ✓ NIT y datos fiscales completos
- ✓ Código QR con información de la factura
- ✓ Valor total en letras y números
- ✓ IVA 19% calculado automáticamente
- ✓ Nota legal según Código de Comercio

### 🖥️ Funcionalidades del Sistema
- ✓ Visualización de factura en pantalla
- ✓ Impresión directa (Ctrl+P)
- ✓ Descarga como PDF
- ✓ Diseño responsive (móvil y escritorio)
- ✓ Integración con panel de usuario
- ✓ Integración con panel de administrador
- ✓ Sin dependencia de base de datos (usa localStorage)

## 📁 Archivos Creados

### 1. Utilidades
```
src/utils/facturaGenerator.js
```
- Generación de datos de factura
- Conversión de números a letras
- Cálculos de IVA y totales
- Formato de moneda colombiana

### 2. Componentes
```
src/components/FacturaView.jsx
src/components/FacturaView.module.css
```
- Componente modal de factura
- Botones de imprimir y descargar
- Diseño profesional y responsive

### 3. Integración Usuario
```
src/app/reservas/[id]/page.js (modificado)
src/app/reservas/[id]/page.module.css (modificado)
src/app/reservas/page.js (modificado)
src/app/reservas/page.module.css (modificado)
```
- Botón "Ver Factura" en detalle de reserva
- Botón "📄 Factura" en lista de reservas

### 4. Integración Administrador
```
src/app/dashboard/reservas/page.js (modificado)
src/app/dashboard/reservas/page.module.css (modificado)
```
- Botón de factura en tabla de reservas
- Acceso a facturas de todos los clientes

### 5. Datos de Ejemplo
```
src/utils/datosEjemplo.js
```
- Reservas de ejemplo para testing
- Script de inicialización

## 🚀 Uso

### Para Usuarios

#### Ver factura desde lista de reservas:
1. Ir a "Mis Reservas"
2. Hacer clic en el botón "📄 Factura"
3. La factura se abrirá en un modal

#### Ver factura desde detalle de reserva:
1. Ir a "Mis Reservas"
2. Hacer clic en "Ver Detalles"
3. Hacer clic en "📄 Ver Factura Electrónica"

#### Imprimir o Descargar:
1. Abrir la factura
2. Hacer clic en "🖨️ Imprimir" o "📄 Descargar PDF"
3. En el diálogo de impresión, elegir:
   - Impresora física → Imprimir
   - "Guardar como PDF" → Descargar

### Para Administradores

1. Ir a "Dashboard" → "Gestión de Reservas"
2. En la tabla, hacer clic en el icono 📄 de cualquier reserva
3. Se abrirá la factura del cliente
4. Imprimir o descargar según necesidad

### Inicializar Datos de Ejemplo

Desde la consola del navegador (F12):
```javascript
// Cargar datos de ejemplo
window.inicializarDatosEjemplo();

// Limpiar datos
window.limpiarDatosEjemplo();
```

## 📋 Estructura de la Factura

### Encabezado
- Nombre y NIT de la empresa
- Dirección, teléfono, email
- Número de factura
- Código QR

### Información DIAN
- Resolución DIAN
- Fecha de resolución
- Rango autorizado
- Vigencia
- Responsabilidad fiscal
- Régimen fiscal

### Datos del Cliente
- Nombre completo
- Cédula/NIT
- Dirección
- Teléfono
- Email

### Periodo de Servicio
- Fecha de inicio
- Fecha de fin
- Total de días

### Detalle de Servicios
| Cantidad | Descripción | Valor Unit. | Subtotal | IVA (19%) | Total |
|----------|-------------|-------------|----------|-----------|-------|
| N días   | Alquiler... | $XX,XXX     | $XXX,XXX | $XX,XXX   | $XXX  |

### Totales
- Subtotal
- IVA (19%)
- **Total a Pagar** (en números)
- **SON:** Total en letras

### Nota Legal
Texto legal según Art. 774 del Código de Comercio

## 🎨 Diseño Responsive

### Desktop (> 768px)
- Modal de 1000px máximo
- Vista en 2 columnas
- Todos los detalles visibles

### Tablet (768px)
- Modal adapta al ancho
- Vista en 1 columna
- Botones apilados

### Móvil (< 480px)
- Pantalla completa
- Tabla compacta
- Fuentes reducidas
- Scroll vertical

## 🖨️ Impresión

### Optimizaciones para Impresión
- Oculta botones de acción
- Ajusta márgenes (1cm)
- Fuentes optimizadas
- Evita quiebres de página
- Fondo blanco

### Tamaño Recomendado
- Papel: Carta (8.5" x 11")
- Orientación: Vertical
- Márgenes: Normales

## 🔧 Personalización

### Cambiar Datos de la Empresa
Editar en `src/utils/facturaGenerator.js`:
```javascript
export const EMPRESA_DATA = {
  razonSocial: 'TU EMPRESA S.A.S',
  nit: '900.XXX.XXX-X',
  direccion: 'Tu dirección',
  telefono: '(+57) XXX XXX XXXX',
  email: 'tu@email.com',
  // ... más campos
};
```

### Cambiar Tasa de IVA
```javascript
export function calcularIVA(subtotal) {
  const IVA_RATE = 0.19; // Cambiar aquí
  return subtotal * IVA_RATE;
}
```

### Personalizar Estilos
Editar `src/components/FacturaView.module.css`

## ✅ Testing

### Casos de Prueba

1. **Factura Básica**
   - Reserva con solo alquiler de vehículo
   - Verificar cálculo de IVA
   - Verificar formato de moneda

2. **Factura con Servicios Adicionales**
   - Reserva con GPS, sillas de bebé, etc.
   - Verificar suma de todos los servicios
   - Verificar subtotales individuales

3. **Diferentes Métodos de Pago**
   - Tarjeta, Efectivo, Transferencia, MercadoPago
   - Verificar que se muestra correctamente

4. **Estados de Reserva**
   - Activa: Muestra botón factura ✓
   - Pendiente: Muestra botón factura ✓
   - Completada: Muestra botón factura ✓
   - Cancelada: NO muestra botón factura ✗

5. **Responsive**
   - Probar en Chrome DevTools
   - Móvil: 375px, 414px
   - Tablet: 768px
   - Desktop: 1024px, 1440px

6. **Impresión**
   - Vista previa de impresión
   - Guardar como PDF
   - Verificar que no aparecen botones

## 🐛 Solución de Problemas

### La factura no se abre
- Verificar que la reserva tiene datos completos
- Revisar consola del navegador (F12)
- Verificar que no hay errores de JavaScript

### Los cálculos no son correctos
- Verificar `diasReserva` en la reserva
- Verificar `precioDia` del auto
- Revisar función `generarFactura()`

### El PDF no se descarga
- Usar función de impresión del navegador
- Seleccionar "Guardar como PDF" como destino
- Verificar permisos del navegador

### El diseño se ve mal en móvil
- Limpiar caché del navegador
- Verificar que los CSS se cargaron
- Revisar media queries en el CSS

## 📝 Notas Técnicas

### Conversión a PDF
El sistema utiliza la API nativa de impresión del navegador:
- Chrome: "Guardar como PDF"
- Firefox: "Imprimir a archivo"
- Edge: "Microsoft Print to PDF"

Para PDF programático, se podría integrar:
- jsPDF
- html2pdf.js
- pdfmake

### Código QR
Actualmente es un placeholder de texto.
Para QR real, integrar:
- qrcode.react
- qrcodejs2
- node-qrcode

### Persistencia
Usa localStorage. Para producción considerar:
- Base de datos backend
- API de facturación electrónica
- Sistema de archivado

## 🚀 Próximas Mejoras

- [ ] Código QR real funcional
- [ ] Envío de factura por email
- [ ] Descarga directa de PDF (sin diálogo)
- [ ] Historial de facturas
- [ ] Factura de corrección/anulación
- [ ] Múltiples idiomas
- [ ] Temas personalizables
- [ ] Firma digital

## 📞 Soporte

Para problemas o preguntas, revisar:
1. Esta documentación
2. Código fuente comentado
3. Consola del navegador (F12)
4. Datos de ejemplo en localStorage

---

**Desarrollado para RentACar** | Formato Colombia DIAN | 2024
