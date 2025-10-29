import { IsString, IsOptional, IsInt, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateClientDto {

  // -------- CLIENT fields --------
  @IsInt()
  @Min(30)
  @Max(300)
  weight: number; // kg

  @IsInt()
  @Min(100)
  @Max(250)
  height: number; // cm

  @IsInt()
  @Min(10)
  @Max(100)
  age: number;

  @IsString()
  @IsOptional()
  injury?: string;

  @IsString()
  @IsOptional()
  goal?: string;
}