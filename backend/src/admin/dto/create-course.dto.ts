import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CourseStatus, Level } from '@prisma/client';

class LessonInput {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  videoUrl!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationSeconds!: number;

  @IsOptional()
  @IsBoolean()
  isFreePreview?: boolean;
}

class ModuleInput {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonInput)
  lessons?: LessonInput[];
}

export class CreateCourseDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsString()
  description!: string;

  @IsString()
  categoryId!: string;

  @IsString()
  instructorId!: string;

  @IsEnum(Level)
  level!: Level;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleInput)
  modules?: ModuleInput[];
}
