import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, Course, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecordProgressDto } from './dto/record-progress.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

type CourseWithRels = Course & { category: Category; instructor: User };

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  /** POST /courses/:id/enroll — free, idempotent. */
  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      return { enrollmentId: existing.id, alreadyEnrolled: true };
    }
    const created = await this.prisma.enrollment.create({
      data: { userId, courseId },
    });
    return { enrollmentId: created.id, alreadyEnrolled: false };
  }

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

  /**
   * GET /me/courses/:id/progress — enrolled-only. Returns the curriculum
   * grouped by module, each module carrying its lessons (with videoUrl) and
   * its quiz status (passed or not).
   */
  async courseProgress(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');

    const modules = await this.prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        quiz: { select: { id: true, title: true, _count: { select: { questions: true } } } },
      },
    });

    const lessonProgress = await this.prisma.lessonProgress.findMany({
      where: { enrollmentId: enrollment.id },
    });
    const byLesson = new Map(lessonProgress.map((p) => [p.lessonId, p]));
    const passedQuizIds = await this.passedQuizIds(enrollment.id);

    return {
      progressPercent: enrollment.progressPercent,
      status: enrollment.status,
      completedAt: enrollment.completedAt,
      modules: modules.map((m) => ({
        id: m.id,
        title: m.title,
        order: m.order,
        lessons: m.lessons.map((l) => {
          const p = byLesson.get(l.id);
          return {
            lessonId: l.id,
            title: l.title,
            order: l.order,
            moduleTitle: m.title,
            videoUrl: l.videoUrl,
            durationSeconds: l.durationSeconds,
            completed: p?.completed ?? false,
            watchedSeconds: p?.watchedSeconds ?? 0,
          };
        }),
        quiz: m.quiz
          ? {
              id: m.quiz.id,
              title: m.quiz.title,
              questionCount: m.quiz._count.questions,
              passed: passedQuizIds.has(m.quiz.id),
            }
          : null,
      })),
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

    const progressPercent = await this.recompute(enrollment.id, courseId);
    return { progressPercent };
  }

  /** GET /me/courses/:courseId/quiz/:quizId — enrolled-only, no isCorrect leak. */
  async getQuiz(userId: string, courseId: string, quizId: string) {
    await this.requireEnrollment(userId, courseId);
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, module: { courseId } },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { order: 'asc' },
              select: { id: true, text: true, order: true },
            },
          },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    return {
      id: quiz.id,
      title: quiz.title,
      passingScore: quiz.passingScore,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        order: q.order,
        options: q.options,
      })),
    };
  }

  /** POST /me/courses/:courseId/quiz/:quizId/submit — grade, store, recompute. */
  async submitQuiz(
    userId: string,
    courseId: string,
    quizId: string,
    dto: SubmitQuizDto,
  ) {
    const enrollment = await this.requireEnrollment(userId, courseId);
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, module: { courseId } },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: true },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.questions.length === 0) {
      throw new BadRequestException('Quiz has no questions');
    }

    const chosenByQuestion = new Map(
      dto.answers.map((a) => [a.questionId, a.optionId]),
    );

    let correctCount = 0;
    const results = quiz.questions.map((q) => {
      const correctOption = q.options.find((o) => o.isCorrect);
      const chosenOptionId = chosenByQuestion.get(q.id) ?? null;
      const correct =
        chosenOptionId !== null && correctOption?.id === chosenOptionId;
      if (correct) correctCount += 1;
      return {
        questionId: q.id,
        correctOptionId: correctOption?.id ?? null,
        chosenOptionId,
        correct,
        explanation: q.explanation,
      };
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    await this.prisma.quizAttempt.create({
      data: { enrollmentId: enrollment.id, quizId, score, passed },
    });

    const progressPercent = await this.recompute(enrollment.id, courseId);

    return {
      score,
      passed,
      passingScore: quiz.passingScore,
      correctCount,
      totalQuestions: quiz.questions.length,
      progressPercent,
      results,
    };
  }

  // ---------- internals ----------

  /** The set of quizIds this enrollment has at least one passing attempt for. */
  private async passedQuizIds(enrollmentId: string): Promise<Set<string>> {
    const passed = await this.prisma.quizAttempt.findMany({
      where: { enrollmentId, passed: true },
      select: { quizId: true },
      distinct: ['quizId'],
    });
    return new Set(passed.map((p) => p.quizId));
  }

  /**
   * Recompute enrollment progress. Units = all lessons + all quizzes in the
   * course. Done = completed lessons + passed quizzes. A course is COMPLETED
   * only when every lesson is watched AND every quiz is passed.
   */
  private async recompute(
    enrollmentId: string,
    courseId: string,
  ): Promise<number> {
    const [totalLessons, totalQuizzes, doneLessons, passedQuizzes] =
      await this.prisma.$transaction([
        this.prisma.lesson.count({ where: { module: { courseId } } }),
        this.prisma.quiz.count({ where: { module: { courseId } } }),
        this.prisma.lessonProgress.count({
          where: { enrollmentId, completed: true },
        }),
        this.prisma.quizAttempt.findMany({
          where: { enrollmentId, passed: true },
          select: { quizId: true },
          distinct: ['quizId'],
        }),
      ]);

    const units = totalLessons + totalQuizzes;
    const done = doneLessons + passedQuizzes.length;
    const progressPercent = units === 0 ? 0 : Math.round((done / units) * 100);

    const nowCompleted = progressPercent >= 100;
    const current = await this.prisma.enrollment.findUniqueOrThrow({
      where: { id: enrollmentId },
      select: { completedAt: true },
    });
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPercent,
        status: nowCompleted ? 'COMPLETED' : 'ACTIVE',
        // Stamp once, on first reaching 100%; never overwrite an existing stamp.
        completedAt:
          nowCompleted && !current.completedAt ? new Date() : undefined,
      },
    });
    return progressPercent;
  }

  private async requireEnrollment(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');
    return enrollment;
  }

  private toCard(course: CourseWithRels) {
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
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
