import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';

@Module({
  imports: [AuthModule],
  controllers: [LearningController],
  providers: [LearningService],
})
export class LearningModule {}
