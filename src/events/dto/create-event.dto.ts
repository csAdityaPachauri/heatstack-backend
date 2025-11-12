import { IsEnum, IsNotEmpty, IsObject, IsString, IsUUID, ValidateNested } from "class-validator";

export type ViewEventData = {
  duration: number;
}

export type ClickEventData = {
  timestamp: number;
  bubbled?: boolean;
}

export type HoverEventData = {
  duration: number;
  bubbled?: boolean;
}

export enum EventType {
  VIEW = 'view',
  CLICK = 'click',
  HOVER = 'hover',
}

export class CreateEventDto {
  
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(EventType)
  type: EventType;

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  data: ViewEventData | ClickEventData | HoverEventData;

  @IsString()
  @IsNotEmpty()
  cslp: string;
}

