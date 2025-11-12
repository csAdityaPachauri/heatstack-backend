import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { User, UserSchema } from './schemas/user.schema';
import { Stack, StackSchema } from './schemas/stack.schema';
import { VectordbModule } from '../vectordb/vectordb.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Stack.name, schema: StackSchema }]),
    VectordbModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
