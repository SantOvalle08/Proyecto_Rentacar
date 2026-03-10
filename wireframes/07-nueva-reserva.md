# 🆕 Wireframe: Nueva Reserva

**Ruta:** `/reservas/nueva`  
**Archivo:** `rentacar/front/files/src/app/reservas/nueva/page.js`  
**Acceso:** Requiere autenticación

## 📐 Estructura Visual

```mermaid
graph TB
    subgraph "Header Global"
        H[Logo + Navigation]
    end
    
    AUTH{Usuario autenticado?}
    AUTH -->|No| REDIR[Redirección a /login]
    AUTH -->|Sí| CONT
    
    subgraph CONT["Nueva Reserva Container"]
        T["<h1>Nueva Reserva</h1>"]
        
        L[Loading - Condicional]
        E[Alert Error - Condicional]
        
        subgraph "Layout 2 Columnas"
            subgraph "Columna Izquierda - Resumen"
                IMG["[Imagen del Auto]"]
                INFO["<h2>Marca Modelo Año</h2>"]
                SPECS["Tipo: Sedan<br/>$50/día"]
                
                subgraph "Resumen de Reserva"
                    RI["📅 Inicio: 10/03/2026"]
                    RF["📅 Fin: 15/03/2026"]
                    RD["⏱️ Duración: 5 días"]
                    RP["💰 Precio Base: $250"]
                end
            end
            
            subgraph "Columna Derecha - Formulario"
                MP["<h3>Método de Pago</h3>"]
                
                subgraph "Opciones de Pago - Radio Buttons"
                    O1["⚪ Mercado Pago"]
                    O2["⚪ Tarjeta de Crédito/Débito"]
                    O3["⚪ Transferencia Bancaria"]
                    O4["⚪ Efectivo al retirar"]
                end
                
                FP["[Campos específicos del método]"]
                
                DOC["<h3>Documentos Requeridos</h3>"]
                D1["📷 Foto Pasaporte *"]
                D2["📷 Foto Licencia de Conducir *"]
                
                TOTAL["<h2>TOTAL: $XXX</h2>"]
                
                BTN["[Confirmar Reserva]"]
                CANCEL["[Cancelar]"]
            end
        end
        
        SUCCESS["✅ Popup Confirmación"]
    end
    
    style T fill:#4a90e2,color:#fff
    style BTN fill:#50c878,color:#fff
    style CANCEL fill:#6c757d,color:#fff
    style TOTAL fill:#ffd93d
    style SUCCESS fill:#50c878,color:#fff
```

## 💳 Métodos de Pago Disponibles

### 1. Mercado Pago
```
┌───────────────────────────┐
│ ⚫ Mercado Pago            │
│                           │
│ Paga de forma segura con  │
│ tu cuenta de Mercado Pago │
│                           │
│ Campos requeridos:        │
│ • Email                   │
│ • Foto Pasaporte *        │
│ • Foto Licencia *         │
└───────────────────────────┘
```

### 2. Tarjeta de Crédito/Débito
```
┌───────────────────────────┐
│ ⚫ Tarjeta Créd/Déb       │
│                           │
│ Visa, Mastercard, Amex... │
│                           │
│ Campos requeridos:        │
│ • Tipo de Tarjeta         │
│ • Últimos 4 dígitos       │
│ • Foto Pasaporte *        │
│ • Foto Licencia *         │
│                           │
│ Nota: No se almacena      │
│ información completa      │
└───────────────────────────┘
```

### 3. Transferencia Bancaria
```
┌───────────────────────────┐
│ ⚫ Transferencia Bancaria  │
│                           │
│ Realiza transferencia a   │
│ nuestra cuenta bancaria   │
│                           │
│ Campos requeridos:        │
│ • Nombre del Titular      │
│ • Email Confirmación      │
│ • Comprobante de Pago     │
│ • Foto Pasaporte *        │
│ • Foto Licencia *         │
└───────────────────────────┘
```

### 4. Efectivo al Retirar
```
┌───────────────────────────┐
│ ⚫ Efectivo al retirar     │
│                           │
│ Pago en efectivo al       │
│ momento de retirar        │
│                           │
│ Campos requeridos:        │
│ • Foto Pasaporte *        │
│ • Foto Licencia *         │
│                           │
│ El monto total se debe    │
│ pagar antes de retirar    │
└───────────────────────────┘
```

## 📸 Sistema de Carga de Documentos

```mermaid
flowchart TD
    A[Usuario selecciona archivo] --> B[Validar tipo de archivo]
    B --> C{¿Es imagen?}
    
    C -->|No| D[Mostrar error]
    C -->|Sí| E[Validar tamaño]
    
    E --> F{¿< 5MB?}
    F -->|No| G[Error: Archivo muy grande]
    F -->|Sí| H[Previsualizar imagen]
    
    H --> I[Convertir a Base64]
    I --> J[Guardar en estado]
    
    style H fill:#4a90e2
    style J fill:#50c878
    style D fill:#ff6b6b
    style G fill:#ff6b6b
```

### Campos de Documentos

| Documento | Requerido | Formatos | Tamaño Máx |
|-----------|-----------|----------|------------|
| Pasaporte | ✅ Sí | JPG, PNG, PDF | 5MB |
| Licencia | ✅ Sí | JPG, PNG, PDF | 5MB |
| Comprobante | Condicional | JPG, PNG, PDF | 5MB |

## 🔄 Flujo Completo de Reserva

```mermaid
flowchart TD
    A[Cargar página con params] --> B{¿autoId válido?}
    B -->|No| C[Error: Auto no válido]
    B -->|Sí| D[Cargar datos del auto]
    
    D --> E{¿Fechas en params?}
    E -->|Sí| F[Pre-llenar fechas y precio]
    E -->|No| G[Usuario debe ingresar fechas]
    
    F --> H[Usuario selecciona método de pago]
    G --> H
    
    H --> I[Completar campos del método]
    I --> J[Cargar documentos requeridos]
    
    J --> K[Click Confirmar Reserva]
    K --> L{Validar formulario}
    
    L -->|Error| M[Mostrar errores]
    L -->|Válido| N[Enviar a API]
    
    N --> O{¿Éxito?}
    O -->|No| P[Mostrar error servidor]
    O -->|Sí| Q[Guardar en localStorage]
    
    Q --> R[Popup de confirmación]
    R --> S[Redirigir a /reservas]
    
    style D fill:#4a90e2
    style Q fill:#50c878
    style R fill:#50c878
    style C fill:#ff6b6b
    style P fill:#ff6b6b
```

## 📊 Estados de la Página

### Estado 1: Loading
```
┌─────────────────┐
│ Nueva Reserva   │
│                 │
│  ⏳ Cargando    │
│  formulario...  │
│                 │
└─────────────────┘
```

### Estado 2: Sin Método Seleccionado
```
┌────────────────────────────────┐
│ [Auto]     │ Método de Pago    │
│ [Info]     │ ⚪ Mercado Pago    │
│            │ ⚪ Tarjeta         │
│ Resumen:   │ ⚪ Transferencia   │
│ 10-15 mar  │ ⚪ Efectivo        │
│ $250       │                   │
│            │ [Campos vacíos]   │
│            │                   │
│            │ [Confirmar]🚫     │
└────────────────────────────────┘
```

### Estado 3: Método Seleccionado
```
┌────────────────────────────────┐
│ [Auto]     │ Método de Pago    │
│ [Info]     │ ⚫ Mercado Pago    │
│            │ ⚪ Tarjeta         │
│ Resumen:   │                   │
│ 10-15 mar  │ Email: ______     │
│ $250       │                   │
│            │ Documentos:       │
│            │ 📷 Pasaporte __   │
│            │ 📷 Licencia __    │
│            │                   │
│            │ TOTAL: $250       │
│            │ [Confirmar]🚫     │
└────────────────────────────────┘
```

### Estado 4: Formulario Completo
```
┌────────────────────────────────┐
│ [Auto]     │ Método de Pago    │
│ [Info]     │ ⚫ Mercado Pago    │
│            │                   │
│ Resumen:   │ Email: ✅         │
│ 10-15 mar  │                   │
│ $250       │ Documentos:       │
│            │ 📷 Pasaporte ✅   │
│            │ 📷 Licencia ✅    │
│            │                   │
│            │ TOTAL: $250       │
│            │ [Confirmar]✅     │
└────────────────────────────────┘
```

### Estado 5: Enviando
```
┌────────────────────────────────┐
│            │                   │
│            │  ⏳ Procesando    │
│            │  tu reserva...    │
│            │                   │
│            │  Por favor        │
│            │  espera...        │
│            │                   │
└────────────────────────────────┘
```

### Estado 6: Confirmación Exitosa
```
┌─────────────────────────────┐
│  ✅ ¡Reserva Confirmada!    │
│                             │
│  Tu reserva ha sido         │
│  registrada exitosamente    │
│                             │
│  ID: #12345                 │
│                             │
│  [Ver Mis Reservas]         │
│  [Descargar Factura]        │
└─────────────────────────────┘
```

## 🎯 Validaciones del Formulario

### Validaciones Globales
```javascript
✅ autoId debe existir
✅ fechaInicio y fechaFin deben estar definidas
✅ Método de pago debe estar seleccionado
✅ Todos los campos del método deben estar completos
✅ Documentos requeridos deben estar cargados
```

### Validaciones por Método de Pago

| Método | Validación |
|--------|-----------|
| Mercado Pago | Email válido + documentos |
| Tarjeta | Tipo + últimos 4 dígitos + documentos |
| Transferencia | Nombre + email + comprobante + documentos |
| Efectivo | Solo documentos |

## 📱 Layout Responsivo

### Desktop (2 columnas)
```
┌────────────────────────────────────┐
│          Nueva Reserva             │
├────────────────────────────────────┤
│                                    │
│  ┌──────────┐  ┌───────────────┐  │
│  │  Auto    │  │ Método Pago   │  │
│  │  Imagen  │  │               │  │
│  │          │  │ [Opciones]    │  │
│  │ Resumen  │  │               │  │
│  │ Fechas   │  │ [Campos]      │  │
│  │ Precio   │  │               │  │
│  │          │  │ Documentos    │  │
│  │          │  │               │  │
│  │          │  │ TOTAL: $XXX   │  │
│  │          │  │ [Confirmar]   │  │
│  └──────────┘  └───────────────┘  │
└────────────────────────────────────┘
```

### Mobile (Stack)
```
┌──────────────┐
│Nueva Reserva │
├──────────────┤
│ [Auto Img]   │
│ Toyota Cor.  │
│ $50/día      │
│              │
│ Resumen:     │
│ 10-15 mar    │
│ Total: $250  │
├──────────────┤
│ Método Pago  │
│ ⚪ MP        │
│ ⚪ Tarjeta   │
│ ⚪ Transfer  │
│ ⚪ Efectivo  │
│              │
│ [Campos]     │
│              │
│ Documentos   │
│ 📷📷        │
│              │
│ [Confirmar]  │
└──────────────┘
```

## 🔗 Navegación

- **Cancelar** → Volver a `/catalogo` o `/autos/[id]`
- **Éxito** → `/reservas` (Mis Reservas)
- **Ver Factura** → Modal o `/reservas/[id]`

## 💾 Datos de la Reserva Creada

```javascript
{
  usuarioId: number,
  autoId: number,
  fechaInicio: Date,
  fechaFin: Date,
  precioTotal: number,
  metodoPago: string,
  datosPago: {
    // Específicos del método
  },
  documentos: {
    pasaporte: base64 | url,
    licencia: base64 | url,
    comprobante?: base64 | url
  },
  estado: 'pendiente',
  createdAt: Date
}
```

## ✨ Características Especiales

1. **Pre-llenado:** Usa query params de página anterior
2. **Validación en tiempo real:** Campos se validan al cambiar
3. **Vista previa:** Documentos muestran preview
4. **Cálculo automático:** Precio total se calcula
5. **Confirmación visual:** Popup grande y claro
6. **Responsivo:** Funciona en móvil y desktop
