import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

export type ViewEventData = {
  duration: number;
}

export type ClickEventData = {
  bubbled?: boolean;
}

export type HoverEventData = {
  duration: number;
  bubbled?: boolean;
}

export type EventType = 'view' | 'click' | 'hover';

@Schema({ timestamps: true })
export class Event {

  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  cslp: string;

  @Prop({ required: true })
  data: ViewEventData | ClickEventData | HoverEventData;

  @Prop({ required: true })
  type: EventType;
}

export const EventSchema = SchemaFactory.createForClass(Event);

