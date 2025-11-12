import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateLyticsIdDto {
  @IsString()
  @IsNotEmpty()
  lyticsId: string;
}

