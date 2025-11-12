import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class GetLyticsDataDto {
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  lyticsIds: string[];
}

