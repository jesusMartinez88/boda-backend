- [x] Project Requirements Clarified
  - Wedding guest management API with Node.js + Express
  - SQLite database for persistence
  - Features: RSVP, transport, allergies, attendance, preferences

- [x] Scaffold the Project
  - Created basic Node.js project structure with Express
  - Initialized package.json with all dependencies
  - Set up directory structure (src/, data/, scripts/, .vscode/)

- [x] Customize the Project
  - Implemented SQLite database schema (3 tables: guests, companions, preferences)
  - Created guest model with complete CRUD operations
  - Implemented guest controller with filtering, search, and statistics
  - Created REST API routes for guests CRUD and statistics endpoints
  - Added CORS and JSON middleware for API handling
  - Configured environment variables (.env file)
  - Created seed-data.js script for loading example data
  - Configured VS Code tasks and settings

- [x] Install Required Extensions
  - No extensions required for Node.js REST API

- [x] Compile/Verify the Project
  - npm dependencies installed successfully (218 packages)
  - Database initialization configured to run on startup
  - API server verified and running on port 3000
  - All database tables created successfully

- [x] Create and Run Task
  - Created .vscode/tasks.json with npm:dev and npm:start tasks
  - Build task configured as default
  - Background execution enabled for dev mode

- [x] Launch the Project
  - Server running successfully on http://localhost:3000
  - Database connection established
  - All endpoints ready for testing

- [x] Documentation Complete
  - API_DOCUMENTATION.md: Complete API reference with examples
  - API_EXAMPLES.md: curl command examples for all endpoints
  - QUICK_START.md: Quick start guide for setup and first use
  - README.md: Project overview and setup instructions

## Project Structure

- `src/index.js` - Express app entry point
- `src/db.js` - SQLite database configuration
- `src/models/guest.js` - Guest data model with queries
- `src/controllers/guestController.js` - Request handlers
- `src/routes/guests.js` - Guest CRUD routes
- `src/routes/stats.js` - Statistics routes
- `scripts/seed-data.js` - Example data loader
- `.env` - Environment configuration

## Running the Project

- Development: `npm run dev` (with auto-reload)
- Production: `npm start`
- Load examples: `node scripts/seed-data.js`

## API Endpoints

- GET/POST /api/guests - Guest CRUD operations
- GET/PUT/DELETE /api/guests/:id - Single guest operations
- GET /api/stats - General statistics
- GET /api/stats/attendance - Attendance breakdown
- GET /api/stats/transportation - Transport requirements
- GET /api/stats/allergies - Allergy analysis
