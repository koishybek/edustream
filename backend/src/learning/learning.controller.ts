import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types';
import { RecordProgressDto } from './dto/record-progress.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { LearningService } from './learning.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class LearningController {
  constructor(private readonly learning: LearningService) {}

  @Post('courses/:id/enroll')
  @HttpCode(HttpStatus.OK)
  enroll(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.learning.enroll(user.sub, id);
  }

  @Get('me/enrollments')
  enrollments(@CurrentUser() user: JwtPayload) {
    return this.learning.myEnrollments(user.sub);
  }

  @Get('me/courses/:id/progress')
  progress(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.learning.courseProgress(user.sub, id);
  }

  @Post('lessons/:id/progress')
  record(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordProgressDto,
  ) {
    return this.learning.recordProgress(user.sub, id, dto);
  }

  @Get('me/courses/:courseId/quiz/:quizId')
  quiz(
    @Param('courseId') courseId: string,
    @Param('quizId') quizId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.learning.getQuiz(user.sub, courseId, quizId);
  }

  @Post('me/courses/:courseId/quiz/:quizId/submit')
  @HttpCode(HttpStatus.OK)
  submitQuiz(
    @Param('courseId') courseId: string,
    @Param('quizId') quizId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.learning.submitQuiz(user.sub, courseId, quizId, dto);
  }
}
