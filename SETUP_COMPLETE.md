# 🎉 Wedding Guest Management API - Complete Setup

## Project Successfully Created! ✅

A complete REST API backend has been set up for managing wedding guests with Node.js, Express, and SQLite.

---

## Quick Start

### 1. Start the Server

```bash
npm start                # Production mode
npm run dev              # Development mode (auto-reload)
```

Server runs on: **http://localhost:3000**

### 2. Load Example Data

```bash
node scripts/seed-data.js
```

### 3. Test the API

```bash
# Health check
curl http://localhost:3000/health

# List all guests
curl http://localhost:3000/api/guests

# View statistics
curl http://localhost:3000/api/stats
```

---

## Project Structure

```
src/
├── index.js                      # Express app
├── db.js                         # SQLite setup
├── controllers/
│   └── guestController.js        # Request handlers
├── models/
│   └── guest.js                  # Database queries
└── routes/
    ├── guests.js                 # Guest CRUD routes
    └── stats.js                  # Statistics routes

scripts/
├── seed-data.js                  # Load example guests
└── test-api.js                   # Test endpoints

data/
└── wedding.db                    # SQLite database
```

---

## Database Schema

### guests table

```sql
CREATE TABLE guests (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  attending INTEGER,
  mealType TEXT,
  needsTransport INTEGER,
  allergies TEXT,
  notes TEXT,
  createdAt DATETIME,
  updatedAt DATETIME
)
```

### companions table (optional)

Stores companion information for guests

### preferences table (optional)

Stores special preferences

---

## API Endpoints

### Guest Management

| Method | Endpoint          | Description        |
| ------ | ----------------- | ------------------ |
| GET    | `/api/guests`     | List all guests    |
| GET    | `/api/guests/:id` | Get specific guest |
| POST   | `/api/guests`     | Create new guest   |
| PUT    | `/api/guests/:id` | Update guest       |
| DELETE | `/api/guests/:id` | Delete guest       |

### Statistics

| Method | Endpoint                    | Description          |
| ------ | --------------------------- | -------------------- |
| GET    | `/api/stats`                | Overall statistics   |
| GET    | `/api/stats/attendance`     | Attendance breakdown |
| GET    | `/api/stats/transportation` | Transport needs      |
| GET    | `/api/stats/allergies`      | Allergy analysis     |

---

## Guest Object Structure

```json
{
  "id": 1,
  "name": "Juan García",
  "email": "juan@example.com",
  "phone": "612345678",
  "attending": true,
  "mealType": "vegetarian",
  "needsTransport": true,
  "allergies": "Gluten",
  "notes": "Vegetarian, allergic to gluten",
  "createdAt": "2025-01-25T10:00:00Z",
  "updatedAt": "2025-01-25T10:00:00Z"
}
```

---

## Available Meal Types

- `normal` - Regular meal
- `vegetarian` - Vegetarian meal
- `vegan` - Vegan meal
- `gluten-free` - Gluten-free meal

---

## Features Implemented

✅ **Guest Management**

- Create, read, update, delete guests
- Search by name, email, phone
- Filter by attendance, transport needs

✅ **Data Collection**

- RSVP status (attending)
- Meal preferences
- Transport requirements
- Allergies and restrictions
- Special notes

✅ **Statistics**

- Total guests and confirmations
- Transport needs analysis
- Dietary restriction tracking
- Allergy frequency analysis

✅ **Technical Features**

- SQLite database with 3 tables
- RESTful API design
- CORS enabled
- Input validation
- Error handling
- Environment configuration
- Auto-reload in dev mode

---

## Configuration

### .env File

```
PORT=3000
NODE_ENV=development
DB_PATH=./data/wedding.db
```

Change port if needed:

```
PORT=3001    # Use different port
```

---

## Documentation Files

1. **README.md** - Project overview
2. **API_DOCUMENTATION.md** - Detailed API reference
3. **API_EXAMPLES.md** - curl command examples
4. **QUICK_START.md** - Quick start guide (English)
5. **GUIA_INICIO.md** - Guía de inicio (Español)
6. **PROJECT_SUMMARY.md** - Complete project summary

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "sqlite3": "^5.1.6",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "body-parser": "^1.20.2"
}
```

---

## Example Requests

### Create a Guest

```bash
curl -X POST http://localhost:3000/api/guests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María García",
    "email": "maria@example.com",
    "phone": "612345678",
    "attending": true,
    "mealType": "vegetarian",
    "needsTransport": true,
    "allergies": "Lactose",
    "notes": "Vegetarian, lactose intolerant"
  }'
```

### Filter Guests

```bash
# Only confirmed guests
curl "http://localhost:3000/api/guests?attending=true"

# Only guests needing transport
curl "http://localhost:3000/api/guests?needsTransport=true"

# Search by name
curl "http://localhost:3000/api/guests?search=María"
```

### Get Statistics

```bash
curl http://localhost:3000/api/stats/attendance
curl http://localhost:3000/api/stats/transportation
curl http://localhost:3000/api/stats/allergies
```

---

## Development Workflow

1. **Start dev server**
   ```bash
   npm run dev
   ```
2. **Edit files** in `src/`
   - Server auto-reloads on changes
   - No need to restart manually

3. **Test endpoints**
   - Use curl, Postman, or Insomnia
   - Check responses in real-time

4. **Load test data**
   ```bash
   node scripts/seed-data.js
   ```

---

## Production Deployment

1. Set environment variables

   ```bash
   NODE_ENV=production
   PORT=8080    # Or your desired port
   ```

2. Start server

   ```bash
   npm start
   ```

3. Consider using PM2 for process management
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name "wedding-api"
   ```

---

## Testing

Run the test script:

```bash
node scripts/test-api.js
```

This tests:

- Health check endpoint
- List guests endpoint
- Get single guest endpoint
- Statistics endpoint
- Create guest endpoint

---

## Troubleshooting

**Port already in use:**

```bash
# Change port in .env
PORT=3001

# Or kill process on port 3000
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -i :3000
```

**Database errors:**

```bash
# Delete old database and restart
rm data/wedding.db
npm start
```

**Module not found:**

```bash
npm install
```

---

## Next Steps

The API is ready to:

- Test with Postman or Insomnia
- Deploy to cloud (Heroku, Railway, etc.)
- Integrate with frontend (React, Vue, etc.)
- Add authentication
- Add email notifications
- Create admin dashboard

---

## Support

For questions or issues:

1. Check documentation files
2. Review API_DOCUMENTATION.md for endpoint details
3. Check API_EXAMPLES.md for request examples
4. Run test script: `node scripts/test-api.js`

---

**Project Status:** ✅ Ready for Production  
**Version:** 1.0.0  
**Created:** January 25, 2025
