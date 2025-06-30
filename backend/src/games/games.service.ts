// games.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Game } from './schemas/game.schema';

@Injectable()
export class GamesService {
  constructor(@InjectModel(Game.name) private gameModel: Model<Game>) {}

  async findAll(): Promise<Game[]> {
    return this.gameModel.find().exec();
  }

  async findById(gameId: string): Promise<Game | null> {
    return this.gameModel.findOne({gameId}).exec();
  }
}