import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Body for POST /courses/:id/reviews. */
export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
