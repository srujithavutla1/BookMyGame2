import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Game, GameSchema } from './schemas/game.schema';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';


@Module({
  imports: [MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }])],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}