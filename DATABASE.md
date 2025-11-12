# Database Configuration

This application uses MongoDB as the database with Mongoose as the ODM (Object Document Mapper).

## Setup

### 1. Install MongoDB

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

**Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Configure Connection String

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/heatstack
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/heatstack?retryWrites=true&w=majority
```

### 3. Connection Options

The connection is configured in `src/app.module.ts`:

```typescript
MongooseModule.forRoot(process.env.MONGODB_URI)
```

## Schemas

Schemas are defined in the `schemas` folder within each module.

### Event Schema

Located at: `src/events/schemas/event.schema.ts`

**Fields:**
- `title` (String, required)
- `description` (String, required)
- `startDate` (Date, required)
- `endDate` (Date, required)
- `location` (String, optional)
- `organizerId` (String, required)
- `attendees` (Array of Strings, default: [])
- `maxAttendees` (Number, optional)
- `status` (String enum: 'draft', 'published', 'cancelled', default: 'draft')
- `tags` (Array of Strings, default: [])
- `createdAt` (Date, auto-generated)
- `updatedAt` (Date, auto-generated)

## Working with Schemas

### Creating a New Schema

1. Create a new file in the module's `schemas` folder:

```typescript
// src/module-name/schemas/entity.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EntityDocument = Entity & Document;

@Schema({ timestamps: true })
export class Entity {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;
}

export const EntitySchema = SchemaFactory.createForClass(Entity);
```

2. Register the schema in the module:

```typescript
import { MongooseModule } from '@nestjs/mongoose';
import { Entity, EntitySchema } from './schemas/entity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Entity.name, schema: EntitySchema }
    ]),
  ],
  // ...
})
```

3. Inject the model in the service:

```typescript
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Entity, EntityDocument } from './schemas/entity.schema';

@Injectable()
export class EntityService {
  constructor(
    @InjectModel(Entity.name) private entityModel: Model<EntityDocument>,
  ) {}
  
  async findAll(): Promise<Entity[]> {
    return this.entityModel.find().exec();
  }
}
```

## Common Mongoose Operations

### Create
```typescript
const created = new this.model(createDto);
return created.save();
```

### Find All
```typescript
return this.model.find().exec();
```

### Find One
```typescript
return this.model.findById(id).exec();
```

### Find with Query
```typescript
return this.model.find({ status: 'active' }).exec();
```

### Update
```typescript
return this.model
  .findByIdAndUpdate(id, updateDto, { new: true })
  .exec();
```

### Delete
```typescript
return this.model.findByIdAndDelete(id).exec();
```

### Array Operations
```typescript
// Push to array
this.model.findByIdAndUpdate(
  id,
  { $push: { arrayField: value } },
  { new: true }
)

// Pull from array
this.model.findByIdAndUpdate(
  id,
  { $pull: { arrayField: value } },
  { new: true }
)
```

## Best Practices

1. **Always use timestamps**: Add `{ timestamps: true }` to schema options
2. **Validate required fields**: Use `@Prop({ required: true })`
3. **Use enums for fixed values**: Define enums in the schema
4. **Index frequently queried fields**: Add indexes for performance
5. **Handle connection errors**: Implement proper error handling
6. **Use transactions**: For operations requiring multiple updates
7. **Lean queries**: Use `.lean()` for read-only operations

## Troubleshooting

### Connection Issues

1. Verify MongoDB is running:
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Or using systemctl (Linux)
sudo systemctl status mongodb
```

2. Test connection:
```bash
mongosh  # or mongo for older versions
```

3. Check connection string format
4. Verify network access (firewall, cloud IP whitelist)

### Common Errors

**"MongooseServerSelectionError"**
- MongoDB server is not running
- Connection string is incorrect
- Network/firewall blocking connection

**"ValidationError"**
- Required fields are missing
- Data type mismatch
- Enum value not matching defined values

## MongoDB Compass

For a GUI interface, use MongoDB Compass:
- Download: https://www.mongodb.com/products/compass
- Connect using your `MONGODB_URI`

## Additional Resources

- [Mongoose Documentation](https://mongoosejs.com/)
- [NestJS Mongoose Integration](https://docs.nestjs.com/techniques/mongodb)
- [MongoDB Manual](https://docs.mongodb.com/manual/)



