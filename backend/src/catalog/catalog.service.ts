import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListCoursesDto } from './dto/list-courses.dto';
import { ListReviewsDto } from './dto/list-reviews.dto';

/** Hard cap on every list endpoint's page size. */
const MAX_PAGE_SIZE = 50;
const DEFAULT_COURSES_PAGE_SIZE = 12;
const DEFAULT_REVIEWS_PAGE_SIZE = 12;

/** Selects exactly the CourseCard shape (+ relations) from a Course row. */
const courseCardSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  level: true,
  durationMinutes: true,
  ratingAvg: true,
  ratingCount: true,
  coverImageUrl: true,
  category: { select: { slug: true, name: true, icon: true } },
  instructor: { select: { id: true, name: true } },
} satisfies Prisma.CourseSelect;

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /** Clamp/normalise a requested page + pageSize against the 50-row cap. */
  private resolvePaging(
    page: number | undefined,
    pageSize: number | undefined,
    defaultPageSize: number,
  ): { page: number; pageSize: number; skip: number; take: number } {
    const resolvedPage = page && page > 0 ? page : 1;
    const requested = pageSize && pageSize > 0 ? pageSize : defaultPageSize;
    const resolvedPageSize = Math.min(requested, MAX_PAGE_SIZE);
    return {
      page: resolvedPage,
      pageSize: resolvedPageSize,
      skip: (resolvedPage - 1) * resolvedPageSize,
      take: resolvedPageSize,
    };
  }

  async listCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, icon: true },
    });
  }

  async listCourses(query: ListCoursesDto): Promise<Paginated<unknown>> {
    const { page, pageSize, skip, take } = this.resolvePaging(
      query.page,
      query.pageSize,
      DEFAULT_COURSES_PAGE_SIZE,
    );

    const where: Prisma.CourseWhereInput = { status: CourseStatus.PUBLISHED };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.level) where.level = query.level;

    if (query.minDuration !== undefined || query.maxDuration !== undefined) {
      where.durationMinutes = {
        ...(query.minDuration !== undefined ? { gte: query.minDuration } : {}),
        ...(query.maxDuration !== undefined ? { lte: query.maxDuration } : {}),
      };
    }

    const orderBy = this.courseOrderBy(query.sort);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy,
        skip,
        take,
        select: courseCardSelect,
      }),
      this.prisma.course.count({ where }),
    ]);

    return { data, page, pageSize, total };
  }

  private courseOrderBy(
    sort: ListCoursesDto['sort'],
  ): Prisma.CourseOrderByWithRelationInput[] {
    switch (sort) {
      case 'rating':
        return [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }];
      case 'newest':
        return [{ createdAt: 'desc' }];
      case 'popular':
      default:
        // Default: most reviewed first, then best rated.
        return [{ ratingCount: 'desc' }, { ratingAvg: 'desc' }];
    }
  }

  async getCourseBySlug(slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, status: CourseStatus.PUBLISHED },
      select: {
        ...courseCardSelect,
        modules: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            lessons: {
              orderBy: { order: 'asc' },
              // NB: videoUrl is deliberately omitted from this public endpoint.
              select: {
                id: true,
                title: true,
                order: true,
                durationSeconds: true,
                isFreePreview: true,
              },
            },
            quiz: {
              select: { id: true, _count: { select: { questions: true } } },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Flatten each module's quiz to a small { id, questionCount } shape.
    const { modules, ...rest } = course;
    return {
      ...rest,
      modules: modules.map((m) => {
        const { quiz, ...mod } = m;
        return {
          ...mod,
          quiz: quiz ? { id: quiz.id, questionCount: quiz._count.questions } : null,
        };
      }),
    };
  }

  async listReviews(
    courseId: string,
    query: ListReviewsDto,
  ): Promise<Paginated<unknown>> {
    await this.ensureCourseExists(courseId);

    const { page, pageSize, skip, take } = this.resolvePaging(
      query.page,
      query.pageSize,
      DEFAULT_REVIEWS_PAGE_SIZE,
    );

    const where: Prisma.ReviewWhereInput = { courseId };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return { data, page, pageSize, total };
  }

  async createReview(courseId: string, userId: string, dto: CreateReviewDto) {
    await this.ensureCourseExists(courseId);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    });
    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled to review this course');
    }

    const review = await this.prisma.review.upsert({
      where: { courseId_userId: { courseId, userId } },
      create: { courseId, userId, rating: dto.rating, comment: dto.comment },
      update: { rating: dto.rating, comment: dto.comment },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    await this.recomputeCourseRating(courseId);

    return review;
  }

  /** Recompute Course.ratingAvg (mean, 1 decimal) and ratingCount. */
  private async recomputeCourseRating(courseId: string): Promise<void> {
    const agg = await this.prisma.review.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const count = agg._count._all;
    const avg = agg._avg.rating ?? 0;
    const ratingAvg = Math.round(avg * 10) / 10;
    await this.prisma.course.update({
      where: { id: courseId },
      data: { ratingAvg, ratingCount: count },
    });
  }

  private async ensureCourseExists(courseId: string): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
  }
}
