import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export type Points = {
  [key: string]: {
    view: number;
    click: number[];
    hover: number;
  };
};

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  stackId: string;

  @Prop({ required: true })
  origin: string;

  @Prop({ required: false })
  lyticsId: string;

  @Prop({ type: Object, required: true, default: {} })
  points: Points;

  @Prop()
  lastUpdated: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create compound index for efficient querying
UserSchema.index({ userId: 1, stackId: 1, origin: 1 }, { unique: true });
