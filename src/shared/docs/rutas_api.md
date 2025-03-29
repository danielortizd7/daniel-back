# Documentación de Rutas API - Ingreso de Resultados

## Base URL
```
http://localhost:5000/api/resultados
```

## Endpoints

### 1. Registrar Resultados
**POST** `/registrar`

Permite a un laboratorista registrar los resultados de una muestra.

#### Headers Requeridos
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body
```json
{
    "idMuestra": "MUESTRA-H233",
    "pH": 7.5,
    "turbidez": 2.3,
    "oxigenoDisuelto": 8.1,
    "nitratos": 0.5,
    "fosfatos": 0.3,
    "cedulaLaboratorista": "12345678",
    "observaciones": "Muestra en buen estado"
}
```

#### Respuesta Exitosa
```json
{
    "success": true,
    "message": "Resultado registrado exitosamente",
    "data": {
        "resultado": {
            "idMuestra": "MUESTRA-H233",
            "documento": "1006849124",
            "fechaHora": "2024-03-24T04:13:07.301Z",
            "tipoMuestreo": "Simple",
            "pH": 7.5,
            "turbidez": 2.3,
            "oxigenoDisuelto": 8.1,
            "nitratos": 0.5,
            "fosfatos": 0.3,
            "cedulaLaboratorista": "12345678",
            "nombreLaboratorista": "Nombre del Laboratorista",
            "observaciones": "Muestra en buen estado",
            "verificado": false,
            "historialCambios": [
                {
                    "accion": "Registrado",
                    "nombre": "Nombre del Laboratorista",
                    "fecha": "2024-03-24T04:13:07.301Z"
                }
            ]
        }
    }
}
```

### 2. Editar Resultados
**PUT** `/editar/:idMuestra`

Permite a un laboratorista editar los resultados de una muestra no verificada.

#### Headers Requeridos
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body
```json
{
    "pH": 7.6,
    "turbidez": 2.4,
    "cedulaLaboratorista": "12345678",
    "observacion": "Actualización de valores"
}
```

#### Respuesta Exitosa
```json
{
    "success": true,
    "message": "Resultado actualizado correctamente",
    "data": {
        "resultado": {
            // Datos actualizados del resultado
        }
    }
}
```

### 3. Verificar Resultados
**POST** `/verificar/:idMuestra`

Permite a un laboratorista verificar los resultados de una muestra.

#### Headers Requeridos
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body
```json
{
    "cedulaLaboratorista": "12345678"
}
```

#### Respuesta Exitosa
```json
{
    "success": true,
    "message": "Resultado verificado correctamente",
    "data": {
        "resultado": {
            // Datos del resultado verificado
        }
    }
}
```

### 4. Obtener Resultados
**GET** `/resultados`

Obtiene la lista de todos los resultados registrados.

#### Headers Requeridos
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa
```json
{
    "success": true,
    "message": "Lista de resultados obtenida con éxito",
    "data": {
        "resultados": [
            // Array de resultados
        ]
    }
}
```

## Manejo de Errores

Todas las rutas pueden devolver los siguientes errores:

```json
{
    "success": false,
    "message": "Mensaje de error específico",
    "errorCode": "TIPO_ERROR",
    "errors": {
        // Detalles del error si están disponibles
    }
}
```

## Códigos de Error Comunes

- `VALIDATION_ERROR`: Error en la validación de datos
- `NOT_FOUND`: Recurso no encontrado
- `AUTHORIZATION_ERROR`: Error de autorización
- `INTERNAL_SERVER_ERROR`: Error interno del servidor

## Notas Importantes

1. Solo los usuarios con rol de laboratorista pueden registrar, editar y verificar resultados.
2. Una vez que un resultado está verificado, no puede ser editado.
3. Solo el laboratorista que registró los resultados puede editarlos.
4. Todos los valores numéricos (pH, turbidez, etc.) deben ser números válidos.
5. El ID de la muestra debe existir en el sistema antes de registrar resultados.

## Ejemplo de Uso en React

```typescript
// Servicio para manejar los resultados
const resultadosService = {
    async registrarResultado(datos: ResultadoData) {
        const response = await axios.post('/api/resultados/registrar', datos, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    },

    async editarResultado(idMuestra: string, datos: ResultadoData) {
        const response = await axios.put(`/api/resultados/editar/${idMuestra}`, datos, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    },

    async verificarResultado(idMuestra: string, cedulaLaboratorista: string) {
        const response = await axios.post(`/api/resultados/verificar/${idMuestra}`, {
            cedulaLaboratorista
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    },

    async obtenerResultados() {
        const response = await axios.get('/api/resultados/resultados', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    }
};
```

# INGRESO DE RESULTADOS

## 1. Endpoints Disponibles

### 1.1 Registrar Resultados
POST /api/resultados/registrar
Headers:
- Authorization: Bearer {token}
- Content-Type: application/json

Body:
```json
{
    "idMuestra": "MUESTRA-H233",
    "pH": 7.5,
    "turbidez": 2.3,
    "oxigenoDisuelto": 8.1,
    "nitratos": 0.5,
    "fosfatos": 0.3,
    "observaciones": "Muestra en buen estado"
}
```

### 1.2 Editar Resultados
PUT /api/resultados/editar/:idMuestra
Headers:
- Authorization: Bearer {token}
- Content-Type: application/json

Body:
```json
{
    "pH": 7.6,
    "turbidez": 2.4,
    "observacion": "Actualización de valores"
}
```

### 1.3 Verificar Resultados
POST /api/resultados/verificar/:idMuestra
Headers:
- Authorization: Bearer {token}
- Content-Type: application/json

### 1.4 Obtener Resultados
GET /api/resultados/resultados
Headers:
- Authorization: Bearer {token}

## 2. Implementación en el Frontend

### 2.1 Servicio de Resultados (resultadosService.ts)
```typescript
import axios from 'axios';
import { AuthService } from './authService';

export class ResultadosService {
    private static instance: ResultadosService;
    private baseURL = 'http://localhost:5000/api/resultados';

    private constructor() {}

    static getInstance() {
        if (!ResultadosService.instance) {
            ResultadosService.instance = new ResultadosService();
        }
        return ResultadosService.instance;
    }

    private getHeaders() {
        const token = AuthService.getToken();
        const usuario = AuthService.getUsuario();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async registrarResultado(datos: ResultadoData) {
        try {
            const response = await axios.post(`${this.baseURL}/registrar`, datos, {
                headers: this.getHeaders()
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async editarResultado(idMuestra: string, datos: Partial<ResultadoData>) {
        try {
            const response = await axios.put(`${this.baseURL}/editar/${idMuestra}`, datos, {
                headers: this.getHeaders()
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async verificarResultado(idMuestra: string) {
        try {
            const response = await axios.post(`${this.baseURL}/verificar/${idMuestra}`, {}, {
                headers: this.getHeaders()
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async obtenerResultados() {
        try {
            const response = await axios.get(`${this.baseURL}/resultados`, {
                headers: this.getHeaders()
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    private handleError(error: any) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

export interface ResultadoData {
    idMuestra: string;
    pH?: number;
    turbidez?: number;
    oxigenoDisuelto?: number;
    nitratos?: number;
    fosfatos?: number;
    observaciones?: string;
}
```

### 2.2 Componente de Ingreso de Resultados (IngresoResultados.tsx)
```typescript
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ResultadosService } from '../services/resultadosService';
import {
    TextField,
    Button,
    Box,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';

const IngresoResultados: React.FC = () => {
    const { usuario } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [formData, setFormData] = useState({
        idMuestra: '',
        pH: '',
        turbidez: '',
        oxigenoDisuelto: '',
        nitratos: '',
        fosfatos: '',
        observaciones: ''
    });

    // Verificar si el usuario es laboratorista
    const esLaboratorista = usuario?.rol === 'laboratorista';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!esLaboratorista) {
            setError('Solo los laboratoristas pueden registrar resultados');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const resultadosService = ResultadosService.getInstance();
            const response = await resultadosService.registrarResultado({
                ...formData,
                pH: Number(formData.pH),
                turbidez: Number(formData.turbidez),
                oxigenoDisuelto: Number(formData.oxigenoDisuelto),
                nitratos: Number(formData.nitratos),
                fosfatos: Number(formData.fosfatos)
            });

            setSuccess('Resultados registrados exitosamente');
            // Limpiar formulario
            setFormData({
                idMuestra: '',
                pH: '',
                turbidez: '',
                oxigenoDisuelto: '',
                nitratos: '',
                fosfatos: '',
                observaciones: ''
            });
        } catch (err) {
            setError(err.message || 'Error al registrar resultados');
        } finally {
            setLoading(false);
        }
    };

    if (!esLaboratorista) {
        return (
            <Alert severity="error">
                No tienes permisos para acceder a esta sección
            </Alert>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom>
                Ingreso de Resultados
            </Typography>

            {/* Campos del formulario */}
            <TextField
                fullWidth
                label="ID Muestra"
                name="idMuestra"
                value={formData.idMuestra}
                onChange={(e) => setFormData({...formData, idMuestra: e.target.value})}
                required
                margin="normal"
            />
            
            {/* Campos numéricos */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, my: 2 }}>
                <TextField
                    label="pH"
                    type="number"
                    name="pH"
                    value={formData.pH}
                    onChange={(e) => setFormData({...formData, pH: e.target.value})}
                    inputProps={{ step: "0.1" }}
                />
                <TextField
                    label="Turbidez"
                    type="number"
                    name="turbidez"
                    value={formData.turbidez}
                    onChange={(e) => setFormData({...formData, turbidez: e.target.value})}
                    inputProps={{ step: "0.1" }}
                />
                <TextField
                    label="Oxígeno Disuelto"
                    type="number"
                    name="oxigenoDisuelto"
                    value={formData.oxigenoDisuelto}
                    onChange={(e) => setFormData({...formData, oxigenoDisuelto: e.target.value})}
                    inputProps={{ step: "0.1" }}
                />
                <TextField
                    label="Nitratos"
                    type="number"
                    name="nitratos"
                    value={formData.nitratos}
                    onChange={(e) => setFormData({...formData, nitratos: e.target.value})}
                    inputProps={{ step: "0.1" }}
                />
                <TextField
                    label="Fosfatos"
                    type="number"
                    name="fosfatos"
                    value={formData.fosfatos}
                    onChange={(e) => setFormData({...formData, fosfatos: e.target.value})}
                    inputProps={{ step: "0.1" }}
                />
            </Box>

            <TextField
                fullWidth
                label="Observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                multiline
                rows={4}
                margin="normal"
            />

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {success}
                </Alert>
            )}

            <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 3 }}
            >
                {loading ? <CircularProgress size={24} /> : 'Registrar Resultados'}
            </Button>
        </Box>
    );
};

export default IngresoResultados;
```

### 2.3 Configuración de Rutas
```typescript
// App.tsx o router.tsx
import IngresoResultados from './components/IngresoResultados';

// Agregar la ruta
<Route 
    path="/resultados/ingreso" 
    element={
        <ProtectedRoute requiredRole="laboratorista">
            <IngresoResultados />
        </ProtectedRoute>
    } 
/>
```

## 3. Validaciones y Seguridad

1. **Validaciones de Rol**:
   - Solo usuarios con rol "laboratorista" pueden acceder
   - Verificación en frontend y backend
   - Redirección si no tiene permisos

2. **Validaciones de Datos**:
   - Campos numéricos deben ser válidos
   - ID de muestra debe existir
   - No se pueden modificar resultados verificados

3. **Seguridad**:
   - Token JWT requerido
   - Validación de sesión activa
   - Registro de usuario que realiza cambios

4. **Manejo de Errores**:
   - Mensajes claros al usuario
   - Registro de errores en consola
   - Validaciones en tiempo real

## 4. Flujo de Trabajo

1. Usuario inicia sesión como laboratorista
2. Accede a "Ingreso de Resultados"
3. Ingresa ID de muestra
4. Completa resultados de análisis
5. Agrega observaciones si es necesario
6. Envía el formulario
7. Sistema valida y guarda los resultados
8. Otro laboratorista puede verificar los resultados

## 5. Consideraciones Adicionales

1. Los resultados no verificados pueden ser editados
2. Un laboratorista no puede verificar sus propios resultados
3. Se mantiene historial de cambios
4. Interfaz responsiva y amigable
5. Validaciones en tiempo real
6. Mensajes claros de éxito/error

## Módulo de Resultados

### Registrar Resultados
```http
POST /api/resultados/registrar
```

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

Body:
```json
{
  "idMuestra": "string",
  "pH": "number",
  "turbidez": "number",
  "oxigenoDisuelto": "number",
  "nitratos": "number",
  "fosfatos": "number",
  "observaciones": "string"
}
```

Validaciones:
- Solo laboratoristas pueden registrar resultados
- La muestra debe existir y no tener resultados previos
- pH debe estar entre 0 y 14
- Los valores numéricos no pueden ser negativos

### Editar Resultados
```http
PUT /api/resultados/editar/:idMuestra
```

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

Body:
```json
{
  "pH": "number",
  "turbidez": "number",
  "oxigenoDisuelto": "number",
  "nitratos": "number",
  "fosfatos": "number",
  "observacion": "string"
}
```

Validaciones:
- Solo el laboratorista que registró puede editar
- No se pueden editar resultados verificados
- Se mantienen las validaciones de valores numéricos

### Verificar Resultados
```http
POST /api/resultados/verificar/:idMuestra
```

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

Validaciones:
- Solo laboratoristas pueden verificar
- No se puede auto-verificar resultados
- No se pueden verificar resultados ya verificados

### Obtener Resultados
```http
GET /api/resultados/resultados
```

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "resultados": [
      {
        "idMuestra": "string",
        "documento": "string",
        "fechaHora": "date",
        "tipoMuestreo": "string",
        "pH": "number",
        "turbidez": "number",
        "oxigenoDisuelto": "number",
        "nitratos": "number",
        "fosfatos": "number",
        "cedulaLaboratorista": "string",
        "nombreLaboratorista": "string",
        "observaciones": "string",
        "verificado": "boolean",
        "verificadoPor": {
          "nombre": "string",
          "cedula": "string",
          "fecha": "date"
        },
        "historialCambios": [
          {
            "accion": "string",
            "nombre": "string",
            "cedula": "string",
            "fecha": "date",
            "cambios": "object"
          }
        ]
      }
    ]
  },
  "message": "Lista de resultados obtenida con éxito"
}
``` 