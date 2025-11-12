import { IsString, IsOptional, IsObject } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  question: string;

  @IsString()
  @IsOptional()
  stackId?: string;

  @IsString()
  @IsOptional()
  origin?: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsObject()
  @IsOptional()
  filters?: {
    timeRange?: string;
    userId?: string;
  };
}
