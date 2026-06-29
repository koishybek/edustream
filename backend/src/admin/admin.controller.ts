import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  users(@Query() q: PaginationDto) {
    return this.admin.listUsers(q);
  }

  @Get('courses')
  courses(@Query() q: PaginationDto) {
    return this.admin.listCourses(q);
  }

  @Get('courses/:id')
  getOne(@Param('id') id: string) {
    return this.admin.getCourse(id);
  }

  @Post('courses')
  create(@Body() dto: CreateCourseDto) {
    return this.admin.createCourse(dto);
  }

  @Patch('courses/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.admin.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  remove(@Param('id') id: string) {
    return this.admin.deleteCourse(id);
  }
}
