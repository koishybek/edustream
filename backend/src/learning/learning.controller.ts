import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types';
import { RecordProgressDto } from './dto/record-progress.dto';
import { LearningService } from './learning.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class LearningController {
  constructor(private readonly learning: LearningService) {}

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
}
