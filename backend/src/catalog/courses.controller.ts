import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types';
import { CatalogService } from './catalog.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListCoursesDto } from './dto/list-courses.dto';
import { ListReviewsDto } from './dto/list-reviews.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly catalog: CatalogService) {}

  /** GET /courses — published catalog with search/filter/sort/pagination. */
  @Get()
  list(@Query() query: ListCoursesDto) {
    return this.catalog.listCourses(query);
  }

  /** GET /courses/:slug — public detail (modules + lessons, no videoUrl). */
  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.catalog.getCourseBySlug(slug);
  }

  /** GET /courses/:id/reviews — paginated reviews. */
  @Get(':id/reviews')
  reviews(@Param('id') id: string, @Query() query: ListReviewsDto) {
    return this.catalog.listReviews(id, query);
  }

  /** POST /courses/:id/reviews — enrolled users upsert a review. */
  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  createReview(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.catalog.createReview(id, user.sub, dto);
  }
}
