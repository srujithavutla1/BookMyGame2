import { Controller, Get, Post, Body, Param, Put, Delete, Query, Patch, UseGuards, BadRequestException } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UserChancesDto } from './dtos/userChancesDto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SearchResponseDto } from './dtos/searchResponseDto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async find(@Query('email') email?: string): Promise<User[] | User | null> {
    if (email) {
      return this.usersService.findOne(email);
    } else {
      return this.usersService.findAll();
    }
  }

  
  @Put()
  async update(@Body() users: User[]): Promise<User[]> {
    return this.usersService.update(users);
  }

  @Patch('updateChances')
  async updateChances(@Body() updateUserChancesDto: UserChancesDto): Promise<{ modifiedCount: number }> {
    return this.usersService.updateChances(
      updateUserChancesDto.emails,
      updateUserChancesDto.chances
    );
  }
  @Get('search')
  async searchByName(@Query('query') query: string): Promise<SearchResponseDto[]> {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }
    return this.usersService.searchByEmail(query);
  }
}