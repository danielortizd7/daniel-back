# Documentación Frontend - Módulo de Resultados

## Estructura de Carpetas
```
src/
├── components/
│   ├── ResultadosForm/
│   │   ├── index.tsx
│   │   ├── DatosMuestraSection.tsx
│   │   ├── AnalisisSection.tsx
│   │   └── ValidationSchema.ts
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── ErrorMessage.tsx
├── pages/
│   ├── ListaMuestras.tsx
│   ├── DetalleMuestra.tsx
│   └── IngresoResultados.tsx
├── services/
│   └── resultadosService.ts
└── types/
    └── resultados.types.ts
```

## Rutas Frontend
```typescript
const routes = [
  {
    path: "/muestras",
    component: ListaMuestras,
    exact: true
  },
  {
    path: "/muestras/:idMuestra",
    component: DetalleMuestra,
    exact: true
  },
  {
    path: "/muestras/:idMuestra/resultados",
    component: IngresoResultados,
    exact: true
  }
];
```

## Servicios API

### ResultadosService
```typescript
class ResultadosService {
  // Obtener lista de muestras
  static async getMuestras(filtros?: {
    estado?: string;
    tipoMuestra?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
  }) {
    return axios.get('/api/muestras', { params: filtros });
  }

  // Obtener detalles de una muestra
  static async getMuestraById(idMuestra: string) {
    return axios.get(`/api/muestras/${idMuestra}`);
  }

  // Obtener resultados de una muestra
  static async getResultadosByMuestra(idMuestra: string) {
    return axios.get(`/api/resultados/muestra/${idMuestra}`);
  }

  // Registrar resultados
  static async registrarResultados(idMuestra: string, data: {
    pH?: { valor: number; unidad: string; };
    turbidez?: { valor: number; unidad: string; };
    oxigenoDisuelto?: { valor: number; unidad: string; };
    nitratos?: { valor: number; unidad: string; };
    solidosSuspendidos?: { valor: number; unidad: string; };
    fosfatos?: { valor: number; unidad: string; };
    observaciones?: string;
  }) {
    return axios.post(`/api/ingreso-resultados/registrar/${idMuestra}`, data);
  }

  // Editar resultados
  static async editarResultados(idMuestra: string, data: {
    pH?: { valor: number; unidad: string; };
    turbidez?: { valor: number; unidad: string; };
    oxigenoDisuelto?: { valor: number; unidad: string; };
    nitratos?: { valor: number; unidad: string; };
    solidosSuspendidos?: { valor: number; unidad: string; };
    fosfatos?: { valor: number; unidad: string; };
    observaciones?: string;
  }) {
    return axios.put(`/api/ingreso-resultados/editar/${idMuestra}`, data);
  }

  // Verificar resultados
  static async verificarResultados(idMuestra: string) {
    return axios.post(`/api/resultados/verificar/${idMuestra}`);
  }
}
```

## Interfaces TypeScript

### Tipos de Datos
```typescript
interface Muestra {
  _id: string;
  id_muestra: string;
  documento: string;
  tipoMuestra: string;
  tipoMuestreo: string;
  fechaHora: Date;
  lugarMuestreo: string;
  planMuestreo: string;
  condicionesAmbientales: string;
  preservacionMuestra: string;
  identificacionMuestra: string;
  analisisSeleccionados: string[];
  tipoDeAgua: {
    tipo: 'potable' | 'natural' | 'residual' | 'otra';
    tipoPersonalizado: string;
    descripcion: string;
  };
  estado: string;
  historial: Array<{
    estado: string;
    cedulaadministrador: string;
    nombreadministrador: string;
    fechaCambio: Date;
    observaciones: string;
    _id: string;
  }>;
  firmas: {
    cedulaLaboratorista: string;
    firmaLaboratorista: string;
    cedulaCliente: string;
    firmaCliente: string;
    _id: string;
  };
  creadoPor: string;
  actualizadoPor: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Resultado {
  _id: string;
  idMuestra: string;
  documento: string;
  fechaHora: Date;
  tipoMuestreo: string;
  pH?: {
    valor: number;
    unidad: string;
  };
  turbidez?: {
    valor: number;
    unidad: string;
  };
  oxigenoDisuelto?: {
    valor: number;
    unidad: string;
  };
  nitratos?: {
    valor: number;
    unidad: string;
  };
  solidosSuspendidos?: {
    valor: number;
    unidad: string;
  };
  fosfatos?: {
    valor: number;
    unidad: string;
  };
  observaciones?: string;
  verificado: boolean;
  cedulaLaboratorista: string;
  nombreLaboratorista: string;
  historialCambios: Array<{
    nombre: string;
    cedula: string;
    fecha: Date;
    _id: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Componentes Principales

### ListaMuestras
- **Propósito**: Mostrar todas las muestras registradas
- **Funcionalidades**:
  - Filtrar por estado y tipo de muestra
  - Ordenar por fecha
  - Búsqueda por código de muestra
  - Ver detalle de muestra
  - Columnas:
    - ID Muestra
    - Cliente (Documento)
    - Tipo Muestra
    - Tipo Muestreo
    - Estado
    - Fecha
    - Análisis Seleccionados
    - Acciones (Ver, Descargar, Registrar Resultados)

### DetalleMuestra
- **Propósito**: Mostrar información detallada de la muestra
- **Secciones**:
  1. Información General:
     - ID Muestra
     - Documento Cliente
     - Tipo Muestra
     - Tipo Muestreo
     - Fecha y Hora
  2. Datos de Muestreo:
     - Lugar de Muestreo
     - Plan de Muestreo
     - Condiciones Ambientales
     - Preservación de Muestra
     - Identificación de Muestra
  3. Tipo de Agua:
     - Tipo
     - Tipo Personalizado
     - Descripción
  4. Análisis Seleccionados:
     - Lista de análisis
  5. Estado y Firmas:
     - Estado actual
     - Firma del Laboratorista
     - Firma del Cliente
  6. Historial:
     - Cambios de estado
     - Observaciones
     - Fechas y responsables

### IngresoResultados
- **Propósito**: Formulario para ingresar resultados de análisis
- **Secciones**:
  1. Datos de la Muestra (no editables):
     - ID Muestra
     - Documento
     - Tipo Muestreo
     - Fecha y Hora
  2. Análisis (según analisisSeleccionados):
     - pH (mg/L)
     - Turbidez (NTU)
     - Oxígeno Disuelto (mg/L)
     - Nitratos (mg/L)
     - Sólidos Suspendidos (mg/L)
     - Fosfatos (mg/L)
  3. Observaciones:
     - Campo de texto para notas adicionales
  4. Información del Laboratorista:
     - Nombre (automático desde token)
     - Cédula (automático desde token)
     - Fecha de registro

## Flujo de Trabajo

1. **Lista de Muestras**
   - Usuario accede a `/muestras`
   - Ve todas las muestras en una tabla
   - Puede filtrar y buscar
   - El botón "Registrar Resultados" solo aparece si:
     - La muestra tiene firmas registradas
     - Estado es "Recibida"
     - Usuario es laboratorista

2. **Detalle de Muestra**
   - Al hacer clic en "Ver" en la lista
   - Muestra toda la información de la muestra
   - Incluye visualización de firmas
   - Botón "Registrar Resultados" si cumple condiciones

3. **Ingreso de Resultados**
   - Al hacer clic en "Registrar Resultados"
   - Formulario pre-cargado con datos de la muestra
   - Solo muestra campos para los análisis seleccionados
   - Validaciones específicas por tipo de análisis
   - Guardado con historial de cambios

## Validaciones Frontend

```typescript
const validationSchema = yup.object().shape({
  pH: yup.object().shape({
    valor: yup.number()
      .min(0, 'El pH debe ser mayor o igual a 0')
      .max(14, 'El pH debe ser menor o igual a 14')
      .nullable(),
    unidad: yup.string().default('mg/L')
  }),
  turbidez: yup.object().shape({
    valor: yup.number()
      .min(0, 'La turbidez no puede ser negativa')
      .nullable(),
    unidad: yup.string().default('NTU')
  }),
  oxigenoDisuelto: yup.object().shape({
    valor: yup.number()
      .min(0, 'El oxígeno disuelto no puede ser negativo')
      .nullable(),
    unidad: yup.string().default('mg/L')
  }),
  nitratos: yup.object().shape({
    valor: yup.number()
      .min(0, 'Los nitratos no pueden ser negativos')
      .nullable(),
    unidad: yup.string().default('mg/L')
  }),
  solidosSuspendidos: yup.object().shape({
    valor: yup.number()
      .min(0, 'Los sólidos suspendidos no pueden ser negativos')
      .nullable(),
    unidad: yup.string().default('mg/L')
  }),
  fosfatos: yup.object().shape({
    valor: yup.number()
      .min(0, 'Los fosfatos no pueden ser negativos')
      .nullable(),
    unidad: yup.string().default('mg/L')
  }),
  observaciones: yup.string().nullable()
});
```

## Estados de Muestra

- **Recibida**: Muestra registrada con firmas, lista para análisis
- **En análisis**: Se están registrando resultados
- **Verificada**: Resultados verificados por otro laboratorista
- **Finalizada**: Proceso completo
- **Rechazada**: Muestra no apta para análisis

## Manejo de Errores

```typescript
interface ErrorResponse {
  message: string;
  code: string;
  details?: any;
}

const handleApiError = (error: ErrorResponse) => {
  switch (error.code) {
    case 'UNAUTHORIZED':
      // Redirigir a login
      break;
    case 'VALIDATION_ERROR':
      // Mostrar errores en formulario
      break;
    case 'NOT_FOUND':
      // Mostrar mensaje de muestra no encontrada
      break;
    default:
      // Error general
  }
};
```

## Seguridad y Permisos

- Solo laboratoristas pueden registrar resultados
- Solo se pueden registrar resultados de muestras con firmas
- No se pueden modificar resultados verificados
- No se pueden verificar resultados propios
- La información del laboratorista se obtiene automáticamente del token JWT
- Registro completo de cambios y acciones

## Mejores Prácticas

1. **Validación**:
   - Validar en tiempo real
   - Mostrar mensajes claros de error
   - Confirmar datos antes de enviar

2. **UX/UI**:
   - Interfaz limpia y organizada
   - Campos agrupados lógicamente
   - Feedback inmediato
   - Confirmaciones para acciones importantes
   - Modo oscuro/claro

3. **Rendimiento**:
   - Carga lazy de componentes
   - Caché de datos frecuentes
   - Optimización de imágenes
   - Paginación eficiente

4. **Mantenibilidad**:
   - Componentes modulares
   - TypeScript para seguridad
   - Documentación actualizada
   - Tests unitarios y de integración 