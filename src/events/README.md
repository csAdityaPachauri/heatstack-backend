# Events Module

The Events module provides a complete RESTful API for managing events with full CRUD operations.

## DTOs (Data Transfer Objects)

### CreateEventDto

Used for creating new events:

```typescript
{
  title: string;              // Event title (required)
  description: string;        // Event description (required)
  startDate: Date;           // Event start date/time (required)
  endDate: Date;             // Event end date/time (required)
  location?: string;         // Event location (optional)
  organizerId: string;       // ID of the event organizer (required)
  attendees?: string[];      // Array of attendee IDs (optional)
  maxAttendees?: number;     // Maximum number of attendees (optional)
  status?: 'draft' | 'published' | 'cancelled';  // Event status (optional, defaults to 'draft')
  tags?: string[];           // Event tags (optional)
}
```

### UpdateEventDto

Used for updating existing events (all fields optional):

```typescript
{
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  attendees?: string[];
  maxAttendees?: number;
  status?: 'draft' | 'published' | 'cancelled';
  tags?: string[];
}
```

## API Endpoints

### Create Event
- **POST** `/event`
- **Body**: `CreateEventDto`
- **Response**: Created event object with ID

```bash
curl -X POST http://localhost:3000/event \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Conference 2025",
    "description": "Annual technology conference",
    "startDate": "2025-12-01T09:00:00Z",
    "endDate": "2025-12-01T17:00:00Z",
    "location": "Convention Center",
    "organizerId": "user123",
    "maxAttendees": 100,
    "status": "published",
    "tags": ["tech", "conference"]
  }'
```

### Get All Events
- **GET** `/event`
- **Query Parameters**: 
  - `status` (optional): Filter by status ('draft', 'published', 'cancelled')
- **Response**: Array of events

```bash
# Get all events
curl http://localhost:3000/event

# Get only published events
curl http://localhost:3000/event?status=published
```

### Get Event by ID
- **GET** `/event/:id`
- **Response**: Single event object

```bash
curl http://localhost:3000/event/1
```

### Get Events by Organizer
- **GET** `/event/organizer/:organizerId`
- **Response**: Array of events organized by the specified user

```bash
curl http://localhost:3000/event/organizer/user123
```

### Update Event
- **PATCH** `/event/:id`
- **Body**: `UpdateEventDto`
- **Response**: Updated event object

```bash
curl -X PATCH http://localhost:3000/event/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Event Title",
    "status": "published"
  }'
```

### Delete Event
- **DELETE** `/event/:id`
- **Response**: 204 No Content

```bash
curl -X DELETE http://localhost:3000/event/1
```

### Add Attendee to Event
- **POST** `/event/:id/attendees/:attendeeId`
- **Response**: Updated event object with new attendee

```bash
curl -X POST http://localhost:3000/event/1/attendees/user456
```

### Remove Attendee from Event
- **DELETE** `/event/:id/attendees/:attendeeId`
- **Response**: Updated event object without the attendee

```bash
curl -X DELETE http://localhost:3000/event/1/attendees/user456
```

## Event Entity

The complete event object structure:

```typescript
{
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  organizerId: string;
  attendees: string[];
  maxAttendees?: number;
  status: 'draft' | 'published' | 'cancelled';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Testing

Run the unit tests:

```bash
npm test events
```

## Database Integration

This module is integrated with MongoDB using Mongoose:

- **Schema**: Defined in `schemas/event.schema.ts`
- **Connection**: Configured via `MONGODB_URI` environment variable
- **Timestamps**: Automatically managed by Mongoose (createdAt, updatedAt)
- **ObjectId**: MongoDB's `_id` field is used as the primary identifier

### Schema Features

- Required fields validation
- Default values for arrays and status
- Enum validation for status field
- Automatic timestamp management

## Notes

- ✅ MongoDB integration with Mongoose complete
- Consider adding validation decorators from `class-validator` to DTOs for request validation
- Consider adding API documentation with Swagger/OpenAPI
- Consider adding indexes for frequently queried fields (organizerId, status, startDate)
- For production, ensure proper error handling and connection retry logic

