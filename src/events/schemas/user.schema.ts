import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export type Points = {
  [key: string]: {
    view: number;
    click: number[];
    hover: number;
  };
}

@Schema({ timestamps: true })
export class User {

  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: false })
  lyticsId: string;

  @Prop({ required: true, default: [] })
  points: Points[] = [];
}

export const UserSchema = SchemaFactory.createForClass(User);

