import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class RecordProgressDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  watchedSeconds?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
