import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [users, courses, enrollments, paid] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.enrollment.count(),
      this.prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { amountCents: true },
      }),
    ]);
    return {
      users,
      courses,
      enrollments,
      revenueCents: paid._sum.amountCents ?? 0,
    };
  }

  async listUsers(q: PaginationDto) {
    const page = q.page ?? 1;
    const pageSize = Math.min(q.pageSize ?? 20, 50);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      }),
      this.prisma.user.count(),
    ]);
    return { data, page, pageSize, total };
  }

  async listCourses(q: PaginationDto) {
    const page = q.page ?? 1;
    const pageSize = Math.min(q.pageSize ?? 20, 50);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: true,
          instructor: { select: { id: true, name: true } },
          _count: { select: { modules: true, enrollments: true } },
        },
      }),
      this.prisma.course.count(),
    ]);
    const data = rows.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      status: c.status,
      level: c.level,
      priceCents: c.priceCents,
      currency: c.currency,
      ratingAvg: c.ratingAvg,
      ratingCount: c.ratingCount,
      category: { id: c.category.id, name: c.category.name },
      instructor: c.instructor,
      moduleCount: c._count.modules,
      enrollmentCount: c._count.enrollments,
    }));
    return { data, page, pageSize, total };
  }

  async getCourse(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async createCourse(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        categoryId: dto.categoryId,
        instructorId: dto.instructorId,
        level: dto.level,
        durationMinutes: dto.durationMinutes,
        priceCents: dto.priceCents,
        currency: dto.currency ?? 'KZT',
        coverImageUrl: dto.coverImageUrl,
        status: dto.status ?? 'DRAFT',
        modules: dto.modules
          ? {
              create: dto.modules.map((m, mi) => ({
                title: m.title,
                order: mi + 1,
                lessons: {
                  create: (m.lessons ?? []).map((l, li) => ({
                    title: l.title,
                    order: li + 1,
                    videoUrl: l.videoUrl,
                    durationSeconds: l.durationSeconds,
                    isFreePreview: l.isFreePreview ?? false,
                  })),
                },
              })),
            }
          : undefined,
      },
    });
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    await this.ensureCourse(id);
    return this.prisma.course.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        level: dto.level,
        durationMinutes: dto.durationMinutes,
        priceCents: dto.priceCents,
        coverImageUrl: dto.coverImageUrl,
        status: dto.status,
      },
    });
  }

  async deleteCourse(id: string) {
    await this.ensureCourse(id);
    await this.prisma.course.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensureCourse(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
  }
}
