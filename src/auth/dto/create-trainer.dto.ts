import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ArrayNotEmpty
} from 'class-validator';

export class CreateTrainerDto {
  @IsInt()
  @Min(18)
  @Max(100)
  age: number;

  @IsArray()
  @IsOptional()
  specialties?: string[]; // e.g. Hipertrofia, Pilates, Bajar de Peso

  @IsBoolean()
  @IsOptional()
  freeClass?: boolean;

  @IsArray()
  @IsOptional()
  certifications?: string[];

  @IsString()
  @IsOptional()
  experience?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  languages?: string[];

  @IsString()
  @IsOptional()
  stateUbication?: string;

  @IsString()
  @IsOptional()
  city?: string;
}