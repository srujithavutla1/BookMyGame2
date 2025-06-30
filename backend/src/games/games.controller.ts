// games.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { Game } from './schemas/game.schema';
import { GamesService } from './games.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  async findAll(): Promise<Game[]|null> {
    return this.gamesService.findAll();
  }

  @Get(':gameId')
  async findOne(@Param('gameId') gameId: string): Promise<Game|null> {

    return this.gamesService.findById(gameId);
  }
}