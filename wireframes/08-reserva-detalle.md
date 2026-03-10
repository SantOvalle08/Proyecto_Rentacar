# 🧾 Wireframe: Detalle de Reserva

**Ruta:** `/reservas/[id]`  
**Archivo:** `rentacar/front/files/src/app/reservas/[id]/page.js`  
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
    
    subgraph CONT["Detalle Reserva Container"]
        T["<h1>Detalle de Reserva #12345</h1>"]
        BACK["← Volver a Mis Reservas"]
        
        L[Loading - Condicional]
        E[Alert Error - Condicional]
        
        subgraph "Layout Principal"
            subgraph "Información de la Reserva"
                STATUS["Estado: 🟢 Confirmada"]
                
                subgraph "Datos del Vehículo"
                    IMG["[Imagen del Auto]"]
                    VEH["<h2>Marca Modelo Año</h2>"]
                    TIPO["Tipo: Sedan"]
                    MAT["Matrícula: ABC-123"]
                end
                
                subgraph "Fechas y Duración"
                    FI["📅 Inicio: Lunes, 10 de marzo 2026"]
                    FF["📅 Fin: Sábado, 15 de marzo 2026"]
                    DUR["⏱️ Duración: 5 días"]
                end
                
                subgraph "Información de Pago"
                    MP["💳 Método: Mercado Pago"]
                    PD["💰 Precio por día: $50"]
                    PT["💵 Total: $250"]
                end
                
                subgraph "Información de Usuario"
                    USU["👤 Cliente: Juan Pérez"]
                    EMAIL["📧 Email: juan@example.com"]
                    TEL["📱 Teléfono: +54 11 1234-5678"]
                end
                
                subgraph "Timeline/Historial"
                    H1["✅ Reserva creada: 09/03/2026 10:30"]
                    H2["✅ Pago confirmado: 09/03/2026 10:35"]
                    H3["⏳ Pendiente: Retirar vehículo"]
                end
            end
            
            subgraph "Acciones Disponibles"
                BTN1["[Ver Factura]"]
                BTN2["[Descargar PDF]"]
                BTN3["[Cancelar Reserva] - Condicional"]
                BTN4["[Checklist Vehículo] - Admin"]
            end
        end
        
        subgraph "Modal Factura"
            FACTURA[FacturaView Component]
        end
    end
    
    style T fill:#4a90e2,color:#fff
    style STATUS fill:#50c878,color:#fff
    style BTN1 fill:#4a90e2,color:#fff
    style BTN2 fill:#50c878,color:#fff
    style BTN3 fill:#ff6b6b,color:#fff
```

## 🎨 Secciones Principales

### 1. Header de Reserva
```
┌─────────────────────────────────┐
│  Detalle de Reserva #12345      │
│  ← Volver a Mis Reservas        │
│                                 │
│  Estado: 🟢 Confirmada          │
└─────────────────────────────────┘
```

### 2. Card de Información del Vehículo
```
┌─────────────────────────────────┐
│  🚗 VEHÍCULO                    │
├─────────────────────────────────┤
│  ┌─────────┐                    │
│  │ [Imagen]│  Toyota Corolla    │
│  │  Auto   │  2023              │
│  └─────────┘                    │
│              Tipo: Sedan        │
│              Matrícula: ABC-123 │
└─────────────────────────────────┘
```

### 3. Card de Fechas
```
┌─────────────────────────────────┐
│  📅 FECHAS Y DURACIÓN           │
├─────────────────────────────────┤
│  Inicio:                        │
│  Lunes, 10 de marzo de 2026     │
│  10:00 AM                       │
│                                 │
│  Fin:                           │
│  Sábado, 15 de marzo de 2026    │
│  10:00 AM                       │
│                                 │
│  ⏱️ Duración: 5 días             │
└─────────────────────────────────┘
```

### 4. Card de Pago
```
┌─────────────────────────────────┐
│  💰 INFORMACIÓN DE PAGO         │
├─────────────────────────────────┤
│  Método de Pago:                │
│  💳 Mercado Pago                │
│                                 │
│  Precio por día: $50.00         │
│  × 5 días                       │
│  ────────────────────           │
│  TOTAL: $250.00                 │
└─────────────────────────────────┘
```

### 5. Timeline de Eventos
```
┌─────────────────────────────────┐
│  📜 HISTORIAL                   │
├─────────────────────────────────┤
│  ● ✅ Reserva creada            │
│     09/03/2026 - 10:30 AM       │
│                                 │
│  ● ✅ Pago confirmado           │
│     09/03/2026 - 10:35 AM       │
│                                 │
│  ● ⏳ Vehículo a retirar        │
│     10/03/2026 - 10:00 AM       │
│                                 │
│  ● ⏹️ Devolución esperada       │
│     15/03/2026 - 10:00 AM       │
└─────────────────────────────────┘
```

## 🏷️ Estados y Acciones Disponibles

```mermaid
stateDiagram-v2
    [*] --> pendiente
    pendiente --> confirmada: Pago confirmado
    pendiente --> cancelada: Usuario cancela
    
    confirmada --> en_curso: Fecha inicio
    confirmada --> cancelada: Cancelación
    
    en_curso --> completada: Devolución
    
    completada --> [*]
    cancelada --> [*]
    
    note right of pendiente
        Acciones:
        - Ver Factura
        - Cancelar
    end note
    
    note right of confirmada
        Acciones:
        - Ver Factura
        - Descargar PDF
        - Cancelar
        - Checklist (admin)
    end note
    
    note right of en_curso
        Acciones:
        - Ver Factura
        - Descargar PDF
        - Checklist (admin)
    end note
    
    note right of completada
        Acciones:
        - Ver Factura
        - Descargar PDF
        - Reseña (futuro)
    end note
```

### Matriz de Acciones por Estado

| Acción | Pendiente | Confirmada | En Curso | Completada | Cancelada |
|--------|-----------|------------|----------|------------|-----------|
| Ver Factura | ✅ | ✅ | ✅ | ✅ | ✅ |
| Descargar PDF | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cancelar | ✅ | ✅ | ❌ | ❌ | ❌ |
| Checklist (admin) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Modificar | ❌ | ❌ | ❌ | ❌ | ❌ |

## 🔄 Flujo de Carga de Datos

```mermaid
flowchart TD
    A[useEffect con params.id] --> B{¿ID válido?}
    B -->|No| C[Error: ID inválido]
    B -->|Sí| D[Llamar API getById]
    
    D --> E{¿API responde?}
    E -->|Sí| F{¿Usuario autorizado?}
    E -->|No| G[Intentar localStorage]
    
    F -->|Sí| H[Mostrar detalles]
    F -->|No| I[Error: No autorizado]
    
    G --> J{¿Encontrada?}
    J -->|Sí| K{¿Pertenece al usuario?}
    J -->|No| L[Error: No encontrada]
    
    K -->|Sí| H
    K -->|No| I
    
    style H fill:#50c878
    style C fill:#ff6b6b
    style I fill:#ff6b6b
    style L fill:#ff6b6b
```

## 📊 Estados de la Página

### Estado 1: Loading
```
┌───────────────────┐
│ Detalle Reserva   │
│                   │
│  ⏳ Cargando      │
│  información...   │
│                   │
└───────────────────┘
```

### Estado 2: Cargada y Visualizable
```
┌─────────────────────────────────┐
│ Detalle de Reserva #12345       │
│ ← Volver                        │
│                                 │
│ Estado: 🟢 Confirmada           │
├─────────────────────────────────┤
│ [Imagen Auto]  Toyota Corolla   │
│                2023 - Sedan     │
│                                 │
│ 📅 10/03/2026 - 15/03/2026      │
│ ⏱️ 5 días                        │
│                                 │
│ 💳 Mercado Pago                 │
│ 💰 Total: $250                  │
│                                 │
│ 👤 Juan Pérez                   │
│ 📧 juan@example.com             │
├─────────────────────────────────┤
│ [Ver Factura] [Descargar PDF]   │
│ [❌ Cancelar Reserva]           │
└─────────────────────────────────┘
```

### Estado 3: Error - No Encontrada
```
┌─────────────────────┐
│ Detalle Reserva     │
│                     │
│  ❌ No encontrada   │
│                     │
│  La reserva no      │
│  existe o no        │
│  tienes acceso      │
│                     │
│  [← Volver]         │
└─────────────────────┘
```

## 🧾 Modal de Factura

```
┌─────────────────────────────────────┐
│  ✕                                  │
│  FACTURA DE RESERVA                 │
│  ═══════════════════════════════    │
│                                     │
│  RentaCar                           │
│  Reserva #12345                     │
│                                     │
│  CLIENTE:                           │
│  Juan Pérez                         │
│  juan@example.com                   │
│  +54 11 1234-5678                   │
│                                     │
│  VEHÍCULO:                          │
│  Toyota Corolla 2023                │
│  Matrícula: ABC-123                 │
│                                     │
│  PERÍODO:                           │
│  10/03/2026 - 15/03/2026           │
│  Duración: 5 días                   │
│                                     │
│  DETALLE:                           │
│  ────────────────────────────       │
│  Alquiler (5 días × $50)    $250    │
│  ────────────────────────────       │
│  TOTAL                      $250    │
│  ════════════════════════════       │
│                                     │
│  Método de pago: Mercado Pago       │
│  Estado: Confirmada                 │
│                                     │
│  [Imprimir] [Descargar PDF] [Cerrar]│
└─────────────────────────────────────┘
```

## 📱 Layout Responsivo

### Desktop (2 columnas)
```
┌────────────────────────────────────┐
│  Detalle de Reserva #12345         │
│  ← Volver                          │
├────────────────────────────────────┤
│                                    │
│  ┌─────────┐  ┌─────────────────┐ │
│  │ Vehículo│  │ Fechas          │ │
│  │ [Imagen]│  │ Inicio/Fin      │ │
│  │ Info    │  │ Duración        │ │
│  └─────────┘  └─────────────────┘ │
│                                    │
│  ┌─────────────┐  ┌──────────────┐│
│  │ Pago        │  │ Timeline     ││
│  │ Método      │  │ Eventos      ││
│  │ Total       │  │ Historial    ││
│  └─────────────┘  └──────────────┘│
│                                    │
│  [Acciones disponibles]            │
└────────────────────────────────────┘
```

### Mobile (Stack)
```
┌──────────────┐
│ Reserva #12  │
│ ← Volver     │
├──────────────┤
│ 🟢 Confirmada│
│              │
│ [Imagen]     │
│ Toyota Cor.  │
│              │
│ 📅 Fechas    │
│ 10-15 mar    │
│              │
│ 💰 Pago      │
│ Total: $250  │
│              │
│ 👤 Cliente   │
│ Juan Pérez   │
│              │
│ 📜 Timeline  │
│ [Eventos]    │
│              │
│ [Acciones]   │
└──────────────┘
```

## 🔗 Navegación y Acciones

### Botones de Acción

```mermaid
graph LR
    A[Ver Factura] --> B[Modal Factura]
    C[Descargar PDF] --> D[Generar PDF]
    E[Cancelar Reserva] --> F{Confirmación}
    F -->|Sí| G[API Cancelar]
    F -->|No| H[Cerrar modal]
    G --> I[Actualizar estado]
    
    style B fill:#4a90e2
    style D fill:#50c878
    style I fill:#ff6b6b
```

### Enlaces

- **← Volver** → `/reservas`
- **Ver Auto** → `/autos/[autoId]`
- **Contacto Soporte** → `/soporte` o email

## 💡 Características Especiales

1. **Timeline visual:** Progreso de la reserva
2. **Información completa:** Todo en una vista
3. **Factura embebida:** Modal con FacturaView
4. **Estado dinámico:** Badges de color
5. **Acciones contextuales:** Según estado
6. **Validación de propiedad:** Solo el usuario dueño puede ver
7. **Admin view:** Si es admin, ve todas las reservas
