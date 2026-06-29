import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogService } from './catalog.service';
import { CategoriesController } from './categories.controller';
import { CoursesController } from './courses.controller';

@Module({
  // AuthModule exports JwtAuthGuard (+ JwtModule) used by the review POST route.
  imports: [AuthModule],
  controllers: [CategoriesController, CoursesController],
  providers: [CatalogService],
})
export class CatalogModule {}
