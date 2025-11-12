import { IsArray, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateFlowDto {
  
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  sequence: string[];
}

