# 🎉 Quick Start Guide

## Instalación y Ejecución

### 1. Instalar dependencias (ya realizado)

```bash
npm install
```

### 2. Iniciar el servidor

**Modo desarrollo** (con auto-reload):

```bash
npm run dev
```

**Modo producción**:

```bash
npm start
```

El servidor estará disponible en: **http://localhost:3000**

---

## Primeros Pasos

### 1. Cargar datos de ejemplo

```bash
node scripts/seed-data.js
```

### 2. Probar endpoints básicos

**Health check:**

```bash
curl http://localhost:3000/health
```

**Ver todos los invitados:**

```bash
curl http://localhost:3000/api/guests
```

**Ver estadísticas:**

```bash
curl http://localhost:3000/api/stats
```

---

## Archivos Clave

| Archivo                              | Descripción                           |
| ------------------------------------ | ------------------------------------- |
| `src/index.js`                       | Punto de entrada de la aplicación     |
| `src/db.js`                          | Configuración de base de datos SQLite |
| `src/models/guest.js`                | Modelo de datos para invitados        |
| `src/controllers/guestController.js` | Lógica de negocios                    |
| `src/routes/guests.js`               | Rutas para gestión de invitados       |
| `src/routes/stats.js`                | Rutas para estadísticas               |
| `.env`                               | Variables de entorno                  |

---

## Estructura de Carpetas

```
boda-backend/
├── src/
│   ├── index.js              # Aplicación principal
│   ├── db.js                 # Inicialización BD
│   ├── controllers/
│   │   └── guestController.js
│   ├── models/
│   │   └── guest.js
│   └── routes/
│       ├── guests.js
│       └── stats.js
├── scripts/
│   └── seed-data.js          # Datos de ejemplo
├── data/
│   └── wedding.db            # BD SQLite
├── .vscode/
│   ├── settings.json
│   └── tasks.json
├── .env                       # Variables de entorno
├── package.json
└── README.md
```

---

## Configuración

El archivo `.env` contiene:

```
PORT=3000
NODE_ENV=development
DB_PATH=./data/wedding.db
```

Modificar según sea necesario.

---

## Comandos útiles

| Comando                     | Descripción                             |
| --------------------------- | --------------------------------------- |
| `npm start`                 | Iniciar servidor en producción          |
| `npm run dev`               | Iniciar en desarrollo (con auto-reload) |
| `node scripts/seed-data.js` | Cargar datos de ejemplo                 |

---

## Documentación Completa

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Documentación detallada de endpoints
- [API_EXAMPLES.md](API_EXAMPLES.md) - Ejemplos de peticiones curl
- [README.md](README.md) - Información del proyecto

---

## Características Principales

✅ **Gestión de Invitados**

- Crear, leer, actualizar, eliminar invitados
- Filtrado por asistencia, transporte, búsqueda

✅ **Registro de Requerimientos**

- Transporte (autobús)
- Alergias e intolerancias
- Preferencias de comida
- Notas personales

✅ **Estadísticas**

- Total de invitados
- Confirmaciones de asistencia
- Necesidades de transporte
- Análisis de alergias

✅ **Base de Datos**

- SQLite con 3 tablas relacionadas
- Timestamps automáticos
- Integridad referencial

---

## Soporte

Para más información, consulta:

- [Documentación API](API_DOCUMENTATION.md)
- [Ejemplos de uso](API_EXAMPLES.md)
- [README del proyecto](README.md)
