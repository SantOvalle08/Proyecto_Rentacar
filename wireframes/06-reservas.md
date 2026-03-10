# 📋 Wireframe: Mis Reservas

**Ruta:** `/reservas`  
**Archivo:** `rentacar/front/files/src/app/reservas/page.js`  
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
    
    subgraph CONT["Reservas Container"]
        T["<h1>Mis Reservas</h1>"]
        
        L[Loading Spinner - Condicional]
        E[Alert Error - Condicional]
        
        subgraph "Lista de Reservas"
            R1[Card Reserva 1]
            R2[Card Reserva 2]
            R3[Card Reserva 3]
        end
        
        NR["📭 No tienes reservas aún<br/>[Ver Catálogo]"]
    end
    
    style T fill:#4a90e2,color:#fff
    style L fill:#ffd93d
    style E fill:#ff6b6b,color:#fff
    style NR fill:#f0f0f0
```

## 🎴 Card de Reserva (Detalle)

```mermaid
graph TB
    subgraph "Reservation Card"
        subgraph "Header Card"
            VEH["🚗 Auto: Marca Modelo Año"]
            EST["Estado Badge"]
        end
        
        subgraph "Información de Fechas"
            FI["📅 Inicio: 10/03/2026"]
            FF["📅 Fin: 15/03/2026"]
            DIAS["⏱️ Duración: 5 días"]
        end
        
        subgraph "Información de Precio"
            PT["💰 Total: $250"]
        end
        
        subgraph "Acciones"
            BTN1["[Ver Detalles]"]
            BTN2["[Ver Factura]"]
            BTN3["[Cancelar] - Condicional"]
        end
    end
    
    style EST fill:#50c878,color:#fff
    style BTN1 fill:#4a90e2,color:#fff
    style BTN2 fill:#6c757d,color:#fff
    style BTN3 fill:#ff6b6b,color:#fff
```

## 🏷️ Estados de Reserva

```mermaid
stateDiagram-v2
    [*] --> pendiente: Reserva creada
    pendiente --> confirmada: Pago confirmado
    pendiente --> cancelada: Usuario cancela
    confirmada --> en_curso: Fecha inicio alcanzada
    en_curso --> completada: Fecha fin alcanzada
    confirmada --> cancelada: Cancelación
    
    note right of pendiente
        🟡 Amarillo
        Esperando confirmación
    end note
    
    note right of confirmada
        🟢 Verde
        Reserva activa
    end note
    
    note right of cancelada
        🔴 Rojo
        No se puede editar
    end note
    
    note right of completada
        🔵 Azul
        Histórica
    end note
```

### Badges de Estado

| Estado | Color | Icono | Acciones Disponibles |
|--------|-------|-------|---------------------|
| pendiente | 🟡 Amarillo | ⏳ | Ver detalles, Cancelar |
| confirmada | 🟢 Verde | ✅ | Ver detalles, Ver factura, Cancelar |
| en_curso | 🔵 Azul | 🚗 | Ver detalles, Ver factura |
| completada | ⚫ Gris | ✔️ | Ver detalles, Ver factura |
| cancelada | 🔴 Rojo | ❌ | Ver detalles |

## 🔄 Flujo de Carga de Datos

```mermaid
flowchart TD
    A[useEffect al montar] --> B{¿Usuario en localStorage?}
    B -->|No| C[Redirigir a /login]
    B -->|Sí| D[Obtener userId]
    
    D --> E[Llamar loadUserReservas]
    E --> F{¿API responde?}
    
    F -->|Sí| G[Mostrar reservas de API]
    F -->|No| H[Intentar localStorage]
    
    H --> I{¿Datos en localStorage?}
    I -->|Sí| J[Filtrar reservas del usuario]
    I -->|No| K[Mostrar array vacío]
    
    J --> L[Mostrar reservas]
    
    style G fill:#50c878
    style L fill:#4a90e2
    style C fill:#ff6b6b
    style K fill:#ffd93d
```

## 🎯 Acciones sobre Reservas

### 1. Ver Detalles
```mermaid
graph LR
    A[Click Ver Detalles] --> B[Navegar a /reservas/[id]]
    B --> C[Mostrar página de detalle]
    
    style C fill:#4a90e2
```

### 2. Ver Factura
```mermaid
graph LR
    A[Click Ver Factura] --> B[setReservaFactura con datos]
    B --> C[Modal con FacturaView]
    C --> D[Opción de imprimir/descargar]
    
    style C fill:#50c878
```

### 3. Cancelar Reserva
```mermaid
flowchart TD
    A[Click Cancelar] --> B{¿Confirmación?}
    B -->|No| C[No hacer nada]
    B -->|Sí| D[Llamar API cancelar]
    
    D --> E{¿Éxito?}
    E -->|Sí| F[Actualizar estado local]
    E -->|No| G[Mostrar error]
    
    G --> H[Actualizar UI localmente]
    
    F --> I[Estado cambia a 'cancelada']
    H --> I
    
    style I fill:#ff6b6b
    style F fill:#50c878
```

## 📊 Estados de la Página

### Estado 1: Loading
```
┌─────────────────┐
│  Mis Reservas   │
│                 │
│  ⏳ Cargando    │
│  reservas...    │
│                 │
└─────────────────┘
```

### Estado 2: Sin Reservas
```
┌─────────────────────┐
│   Mis Reservas      │
│                     │
│  📭 No tienes       │
│  reservas aún       │
│                     │
│  ¿Quieres rentar    │
│  un vehículo?       │
│                     │
│  [Ver Catálogo]     │
└─────────────────────┘
```

### Estado 3: Con Reservas
```
┌─────────────────────────────┐
│      Mis Reservas           │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │ 🚗 Toyota Corolla     │  │
│  │ Estado: 🟢 Confirmada │  │
│  │ 📅 10/03 - 15/03     │  │
│  │ 💰 Total: $250       │  │
│  │ [Detalles] [Factura] │  │
│  │ [❌ Cancelar]         │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 🚗 Honda Civic        │  │
│  │ Estado: ⏳ Pendiente  │  │
│  │ 📅 20/03 - 25/03     │  │
│  │ 💰 Total: $200       │  │
│  │ [Detalles] [Cancelar]│  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Estado 4: Error
```
┌─────────────────────┐
│   Mis Reservas      │
│                     │
│  ⚠️ Error al        │
│  cargar reservas    │
│                     │
│  [Reintentar]       │
└─────────────────────┘
```

## 💾 Datos Mostrados por Reserva

### Información del Vehículo
```javascript
{
  autoId: number,
  auto: {
    marca: string,
    modelo: string,
    anio: number,
    imagen?: string
  }
}
```

### Información de la Reserva
```javascript
{
  id: number,
  usuarioId: number,
  fechaInicio: Date,
  fechaFin: Date,
  precioTotal: number,
  estado: 'pendiente' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada',
  metodoPago?: string,
  createdAt: Date
}
```

## 📱 Layout Responsivo

### Desktop
```
┌──────────────────────────────┐
│       Mis Reservas           │
├──────────────────────────────┤
│                              │
│  ┌────────────────────────┐  │
│  │  Reserva 1             │  │
│  │  [Layout horizontal]   │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  Reserva 2             │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

### Mobile (Stack)
```
┌──────────────┐
│ Mis Reservas │
├──────────────┤
│ ┌──────────┐ │
│ │ Reserva 1│ │
│ │ [Stack]  │ │
│ │ Info     │ │
│ │ Botones  │ │
│ └──────────┘ │
│              │
│ ┌──────────┐ │
│ │ Reserva 2│ │
│ └──────────┘ │
└──────────────┘
```

## 🎨 Modal de Factura

```mermaid
graph TB
    subgraph "Modal Overlay"
        subgraph "Factura Container"
            H["<h2>Factura de Reserva</h2>"]
            COMP[FacturaView Component]
            BTN1["[Imprimir]"]
            BTN2["[Descargar PDF]"]
            BTN3["[Cerrar]"]
        end
    end
    
    style H fill:#4a90e2,color:#fff
    style BTN1 fill:#50c878,color:#fff
    style BTN2 fill:#50c878,color:#fff
    style BTN3 fill:#6c757d,color:#fff
```

## 🔗 Navegación

- **Ver Catálogo** → `/catalogo`
- **Ver Detalles de Reserva** → `/reservas/[id]`
- **Nueva Reserva** → `/catalogo` → seleccionar auto → `/reservas/nueva`

## 📅 Formato de Fechas

```javascript
// Función formatDate
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Ejemplo: "10 de marzo de 2026"
```

## ⚡ Optimizaciones

1. **Carga inicial:** LocalStorage + API
2. **Filtrado:** Solo reservas del usuario actual
3. **Estado en tiempo real:** Escucha eventos de actualización
4. **Cache:** localStorage para modo offline
