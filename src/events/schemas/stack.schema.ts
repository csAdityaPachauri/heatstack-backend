import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StackDocument = Stack & Document;

export type Flow = {
  [key: string]: {
    id: string;
    name: string;
    sequence: string[];
  };
}

export type Website = {
  origin: string;
  flows: Flow;
}

@Schema({ timestamps: true })
export class Stack {

  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, default: [] })
  websites: Website[] = [];
}

export const StackSchema = SchemaFactory.createForClass(Stack);

