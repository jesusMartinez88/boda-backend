# API Documentation

## Base URL

```
http://localhost:3000
```

## Authentication

No authentication required for this version.

## Response Format

All responses are in JSON format with the following structure:

```json
{
  "success": true/false,
  "data": {},
  "message": "Optional message"
}
```

---

## Endpoints

### Health Check

Check if the API is running.

**Request:**

```
GET /health
```

**Response:**

```json
{
  "status": "OK",
  "message": "Wedding API is running"
}
```

---

## Guests Management

### Get All Guests

Retrieve all guests with optional filtering.

**Request:**

```
GET /api/guests
```

**Query Parameters:**

- `attending` (boolean) - Filter by attendance status
- `needsTransport` (boolean) - Filter by transport needs
- `search` (string) - Search by name, email, or phone

**Example:**

```
GET /api/guests?attending=true&needsTransport=true
GET /api/guests?search=Juan
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Juan García",
      "email": "juan@example.com",
      "phone": "612345678",
      "attending": 1,
      "mealType": "normal",
      "needsTransport": 1,
      "allergies": null,
      "notes": "Vegetariano",
      "createdAt": "2025-01-25 10:00:00",
      "updatedAt": "2025-01-25 10:00:00"
    }
  ],
  "count": 1
}
```

---

### Get Specific Guest

Get details of a single guest.

**Request:**

```
GET /api/guests/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Juan García",
    "email": "juan@example.com",
    "phone": "612345678",
    "attending": 1,
    "mealType": "normal",
    "needsTransport": 1,
    "allergies": null,
    "notes": "Vegetariano",
    "createdAt": "2025-01-25 10:00:00",
    "updatedAt": "2025-01-25 10:00:00"
  }
}
```

---

### Create Guest

Add a new guest to the wedding.

**Request:**

```
POST /api/guests
Content-Type: application/json

{
  "name": "Juan García",
  "email": "juan@example.com",
  "phone": "612345678",
  "attending": true,
  "mealType": "normal",
  "needsTransport": true,
  "allergies": "Gluten",
  "notes": "Vegetariano"
}
```

**Required Fields:**

- `name` (string)
- `email` (string)

**Optional Fields:**

- `phone` (string)
- `attending` (boolean) - Default: false
- `mealType` (string) - Default: "normal" - Options: normal, vegetarian, vegan, gluten-free
- `needsTransport` (boolean) - Default: false
- `allergies` (string)
- `notes` (string)

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Juan García",
    "email": "juan@example.com",
    "phone": "612345678",
    "attending": true,
    "mealType": "normal",
    "needsTransport": true,
    "allergies": "Gluten",
    "notes": "Vegetariano"
  },
  "message": "Guest created successfully"
}
```

---

### Update Guest

Update an existing guest's information.

**Request:**

```
PUT /api/guests/:id
Content-Type: application/json

{
  "name": "Juan García López",
  "email": "juan.garcia@example.com",
  "phone": "612345678",
  "attending": true,
  "mealType": "vegetarian",
  "needsTransport": false,
  "allergies": "Lactosa",
  "notes": "Intolerante a lactosa"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Juan García López",
    "email": "juan.garcia@example.com",
    "phone": "612345678",
    "attending": true,
    "mealType": "vegetarian",
    "needsTransport": false,
    "allergies": "Lactosa",
    "notes": "Intolerante a lactosa"
  },
  "message": "Guest updated successfully"
}
```

---

### Delete Guest

Remove a guest from the wedding.

**Request:**

```
DELETE /api/guests/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "deletedId": 1,
    "changes": 1
  },
  "message": "Guest deleted successfully"
}
```

---

## Statistics

### Get General Statistics

Get overall wedding statistics.

**Request:**

```
GET /api/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 50,
    "confirmed": 40,
    "pending": 10,
    "needTransport": 25
  }
}
```

---

### Get Attendance Statistics

Get breakdown of attendance confirmations.

**Request:**

```
GET /api/stats/attendance
```

**Response:**

```json
{
  "success": true,
  "data": {
    "confirmed": 40,
    "pending": 10
  }
}
```

---

### Get Transportation Statistics

Get breakdown of transportation needs.

**Request:**

```
GET /api/stats/transportation
```

**Response:**

```json
{
  "success": true,
  "data": {
    "needTransport": 25,
    "noTransport": 25
  }
}
```

---

### Get Allergies Statistics

Get list of allergies and affected guest count.

**Request:**

```
GET /api/stats/allergies
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "allergies": "Gluten",
      "count": 3
    },
    {
      "allergies": "Lactosa",
      "count": 2
    },
    {
      "allergies": "Frutos secos",
      "count": 1
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Name and email are required"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Guest not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

---

## HTTP Status Codes

- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Data Types

### Meal Types

- `normal` - Regular meal
- `vegetarian` - Vegetarian meal
- `vegan` - Vegan meal
- `gluten-free` - Gluten-free meal

### Guest Object

```typescript
{
  id: number;
  name: string;
  email: string;
  phone?: string;
  attending: boolean;
  mealType: 'normal' | 'vegetarian' | 'vegan' | 'gluten-free';
  needsTransport: boolean;
  allergies?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```
