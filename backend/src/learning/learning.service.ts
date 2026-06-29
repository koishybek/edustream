import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, Course, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecordProgressDto } from './dto/record-progress.dto';

type CourseWithRels = Course & { category: Category; instructor: User };

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /me/enrollments */
  async myEnrollments(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { course: { include: { category: true, instructor: true } } },
    });
    return enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      progressPercent: e.progressPercent,
      course: this.toCard(e.course),
    }));
  }

  /** GET /me/courses/:id/progress — enrolled-only; exposes videoUrl. */
  async courseProgress(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');

    const lessons = await this.prisma.lesson.findMany({
      where: { module: { courseId } },
      orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
      include: { module: true },
    });
    const progress = await this.prisma.lessonProgress.findMany({
      where: { enrollmentId: enrollment.id },
    });
    const byLesson = new Map(progress.map((p) => [p.lessonId, p]));

    return {
      progressPercent: enrollment.progressPercent,
      status: enrollment.status,
      lessons: lessons.map((l) => {
        const p = byLesson.get(l.id);
        return {
          lessonId: l.id,
          title: l.title,
          order: l.order,
          moduleTitle: l.module.title,
          videoUrl: l.videoUrl,
          durationSeconds: l.durationSeconds,
          completed: p?.completed ?? false,
          watchedSeconds: p?.watchedSeconds ?? 0,
        };
      }),
    };
  }

  /** POST /lessons/:id/progress — upsert + recompute enrollment percent. */
  async recordProgress(userId: string, lessonId: string, dto: RecordProgressDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const courseId = lesson.module.courseId;
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');

    await this.prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
      },
      update: {
        watchedSeconds: dto.watchedSeconds,
        completed: dto.completed,
        completedAt: dto.completed ? new Date() : undefined,
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        watchedSeconds: dto.watchedSeconds ?? 0,
        completed: dto.completed ?? false,
        completedAt: dto.completed ? new Date() : null,
      },
    });

    const total = await this.prisma.lesson.count({
      where: { module: { courseId } },
    });
    const done = await this.prisma.lessonProgress.count({
      where: { enrollmentId: enrollment.id, completed: true },
    });
    const progressPercent = total === 0 ? 0 : Math.round((done / total) * 100);

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPercent,
        status: progressPercent >= 100 ? 'COMPLETED' : 'ACTIVE',
      },
    });
    return { progressPercent };
  }

  private toCard(course: CourseWithRels) {
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      priceCents: course.priceCents,
      currency: course.currency,
      level: course.level,
      durationMinutes: course.durationMinutes,
      ratingAvg: course.ratingAvg,
      ratingCount: course.ratingCount,
      coverImageUrl: course.coverImageUrl,
      category: {
        slug: course.category.slug,
        name: course.category.name,
        icon: course.category.icon,
      },
      instructor: { id: course.instructor.id, name: course.instructor.name },
    };
  }
}
