# Boda Backend API

API REST para gestionar invitados de boda con funcionalidades de RSVP, transporte, alergias y preferencias.

## Características

- ✅ Gestión completa de invitados
- 🚌 Control de requerimientos de transporte
- 🥗 Registro de intolerancias y alergias
- 👨‍👩‍👧‍👦 Confirmación de asistencia
- 📊 Estadísticas de invitados
- 🔍 Búsqueda y filtrado avanzado

## Instalación

```bash
npm install
```

## Configuración

Crear archivo `.env` en la raíz del proyecto:

```
PORT=3000
NODE_ENV=development
DB_PATH=./data/wedding.db
```

## Uso

Modo desarrollo:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

## Estructura del Proyecto

```
src/
├── index.js              # Punto de entrada
├── db.js                 # Inicialización de BD
├── routes/
│   └── guests.js         # Rutas de invitados
├── controllers/
│   └── guestController.js # Controladores de invitados
└── models/
    └── guest.js          # Modelo de invitado
data/
└── wedding.db            # Base de datos SQLite
```

## API Endpoints

### Invitados

- `GET /api/guests` - Obtener todos los invitados
- `GET /api/guests/:id` - Obtener invitado específico
- `POST /api/guests` - Crear nuevo invitado
- `PUT /api/guests/:id` - Actualizar invitado
- `DELETE /api/guests/:id` - Eliminar invitado

### Estadísticas

- `GET /api/stats` - Obtener estadísticas generales
- `GET /api/stats/attendance` - Estadísticas de asistencia
- `GET /api/stats/transportation` - Estadísticas de transporte
- `GET /api/stats/allergies` - Estadísticas de alergias

## Ejemplo de Respuesta

```json
{
  "id": 1,
  "name": "Juan García",
  "email": "juan@example.com",
  "phone": "123456789",
  "attending": true,
  "mealType": "normal",
  "needsTransport": true,
  "allergies": "Lactosa",
  "notes": "Vegano",
  "createdAt": "2025-01-25T10:00:00Z"
}
```
