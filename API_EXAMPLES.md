# Wedding API - Ejemplos de uso

## Health Check

curl http://localhost:3000/health

## Crear invitado

curl -X POST http://localhost:3000/api/guests \
 -H "Content-Type: application/json" \
 -d '{
"name": "Juan García",
"email": "juan@example.com",
"phone": "612345678",
"attending": true,
"mealType": "normal",
"needsTransport": true,
"allergies": "",
"notes": "Vegano"
}'

## Obtener todos los invitados

curl http://localhost:3000/api/guests

## Obtener invitados que confirman asistencia

curl "http://localhost:3000/api/guests?attending=true"

## Obtener invitados que necesitan transporte

curl "http://localhost:3000/api/guests?needsTransport=true"

## Buscar invitado por nombre

curl "http://localhost:3000/api/guests?search=Juan"

## Obtener invitado específico

curl http://localhost:3000/api/guests/1

## Actualizar invitado

curl -X PUT http://localhost:3000/api/guests/1 \
 -H "Content-Type: application/json" \
 -d '{
"name": "Juan García López",
"email": "juan.garcia@example.com",
"phone": "612345678",
"attending": true,
"mealType": "vegetarian",
"needsTransport": false,
"allergies": "Lactosa",
"notes": "Vegano, alergico a productos lácteos"
}'

## Eliminar invitado

curl -X DELETE http://localhost:3000/api/guests/1

## Agregar ejemplo de solicitud de código para borrado masivo (requiere JWT)

curl -X POST http://localhost:3000/api/guests/request-delete \
 -H "Authorization: Bearer <TOKEN>"

# (en desarrollo la respuesta JSON también incluye el código)

# luego use el código recibido en el email para la petición DELETE:

curl -X DELETE "http://localhost:3000/api/guests?code=123456" \
 -H "Authorization: Bearer <TOKEN>"

## Obtener todas las mesas

curl http://localhost:3000/api/tables \
 -H "Authorization: Bearer <TOKEN>"

## Crear mesa

curl -X POST http://localhost:3000/api/tables \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer <TOKEN>" \
 -d '{
"name": "Mesa 1",
"capacity": 8,
"shape": "round"
}'

## Eliminar mesa específica

curl -X DELETE http://localhost:3000/api/tables/1 \
 -H "Authorization: Bearer <TOKEN>"

## Solicitar código para borrado masivo de mesas (requiere JWT)

curl -X POST http://localhost:3000/api/tables/request-delete \
 -H "Authorization: Bearer <TOKEN>"

# (en desarrollo la respuesta JSON también incluye el código)

# luego use el código recibido en el email:

curl -X DELETE "http://localhost:3000/api/tables?code=123456" \
 -H "Authorization: Bearer <TOKEN>"

## Obtener estadísticas generales

curl http://localhost:3000/api/stats

## Obtener estadísticas de asistencia

curl http://localhost:3000/api/stats/attendance

## Obtener estadísticas de transporte

curl http://localhost:3000/api/stats/transportation

## Obtener estadísticas de alergias

curl http://localhost:3000/api/stats/allergies
