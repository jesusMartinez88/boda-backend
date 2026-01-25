# 🎉 Guía de Inicio Rápido - API Boda

## ¿Qué es?

Backend con API REST para gestionar invitados a una boda. Permite:

- ✅ Confirmar asistencia
- 🚌 Gestionar transporte
- 🥗 Registrar alergias/intolerancias
- 👨‍👩‍👧 Controlar acompañantes
- 📊 Ver estadísticas

## Instalación

Se ha instalado automáticamente con `npm install`.

**Dependencias:**

- Express.js - Framework web
- SQLite3 - Base de datos
- CORS - Control de origen
- dotenv - Variables de entorno

## Iniciar el servidor

### Modo desarrollo (auto-reload)

```bash
npm run dev
```

### Modo producción

```bash
npm start
```

**Acceso:** http://localhost:3000

## Base de datos

Ubicación: `data/wedding.db` (SQLite)

**Tablas:**

1. `guests` - Invitados principales
2. `companions` - Acompañantes de invitados
3. `preferences` - Preferencias especiales

## Endpoints principales

### 👥 Gestión de invitados

#### Listar todos los invitados

```bash
curl http://localhost:3000/api/guests
```

#### Obtener un invitado específico

```bash
curl http://localhost:3000/api/guests/1
```

#### Crear nuevo invitado

```bash
curl -X POST http://localhost:3000/api/guests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan García",
    "email": "juan@example.com",
    "phone": "612345678",
    "attending": true,
    "mealType": "normal",
    "needsTransport": true,
    "allergies": "Gluten",
    "notes": "Vegetariano"
  }'
```

#### Actualizar invitado

```bash
curl -X PUT http://localhost:3000/api/guests/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan García López",
    "email": "juan.garcia@example.com",
    "attending": true,
    "mealType": "vegetarian",
    "needsTransport": false,
    "allergies": "Lactosa",
    "notes": "Intolerante a lactosa"
  }'
```

#### Eliminar invitado

```bash
curl -X DELETE http://localhost:3000/api/guests/1
```

### 🔍 Filtrados

#### Solo invitados que confirman

```bash
curl "http://localhost:3000/api/guests?attending=true"
```

#### Solo invitados que necesitan autobús

```bash
curl "http://localhost:3000/api/guests?needsTransport=true"
```

#### Buscar por nombre, email o teléfono

```bash
curl "http://localhost:3000/api/guests?search=Juan"
```

### 📊 Estadísticas

#### Estadísticas generales

```bash
curl http://localhost:3000/api/stats
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "total": 6,
    "confirmed": 5,
    "pending": 1,
    "needTransport": 3
  }
}
```

#### Desglose de asistencia

```bash
curl http://localhost:3000/api/stats/attendance
```

#### Necesidades de transporte

```bash
curl http://localhost:3000/api/stats/transportation
```

#### Análisis de alergias

```bash
curl http://localhost:3000/api/stats/allergies
```

## Cargar datos de ejemplo

```bash
node scripts/seed-data.js
```

Esto carga 6 invitados de ejemplo para pruebas.

## Campos de invitado

| Campo            | Tipo    | Obligatorio | Descripción                                 |
| ---------------- | ------- | ----------- | ------------------------------------------- |
| `name`           | string  | ✓           | Nombre del invitado                         |
| `email`          | string  | ✓           | Email del invitado                          |
| `phone`          | string  |             | Teléfono                                    |
| `attending`      | boolean |             | ¿Confirma asistencia? (default: false)      |
| `mealType`       | string  |             | normal, vegetarian, vegan (default: normal) |
| `needsTransport` | boolean |             | ¿Necesita autobús? (default: false)         |
| `allergies`      | string  |             | Alergias/intolerancias                      |
| `notes`          | string  |             | Notas adicionales                           |

## Estructura del proyecto

```
boda-backend/
├── src/
│   ├── index.js              # Aplicación principal
│   ├── db.js                 # Config BD SQLite
│   ├── controllers/
│   │   └── guestController.js # Lógica de negocio
│   ├── models/
│   │   └── guest.js          # Consultas a BD
│   └── routes/
│       ├── guests.js         # Rutas invitados
│       └── stats.js          # Rutas estadísticas
├── scripts/
│   └── seed-data.js          # Datos de ejemplo
├── data/
│   └── wedding.db            # BD SQLite
├── .env                       # Variables entorno
├── package.json              # Dependencias
└── README.md
```

## Configuración (.env)

```
PORT=3000                    # Puerto del servidor
NODE_ENV=development         # Entorno
DB_PATH=./data/wedding.db   # Ruta BD
```

## Documentación completa

- **API_DOCUMENTATION.md** - Referencia detallada de todos los endpoints
- **API_EXAMPLES.md** - Ejemplos adicionales con curl
- **README.md** - Información general del proyecto

## Solución de problemas

**Error: Port 3000 already in use**

- Cambiar en `.env`: `PORT=3001` (u otro puerto)
- O terminar el proceso en el puerto 3000

**Error: Cannot find module**

- Ejecutar: `npm install`

**Base de datos vacía**

- Ejecutar: `node scripts/seed-data.js`

## Tips

1. Usa [Postman](https://www.postman.com/) o [Insomnia](https://insomnia.rest/) para probar la API fácilmente
2. El servidor se auto-reinicia en `npm run dev` cuando cambias archivos
3. Las tablas de BD se crean automáticamente al iniciar
4. Todos los timestamps son automáticos (createdAt, updatedAt)

¡Listo! 🚀 Tu API de boda está lista para usar.
