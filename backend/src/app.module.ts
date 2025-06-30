// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GamesModule } from './games/games.module';
import { UsersModule } from './users/users.module';
import { InvitationsModule } from './invitations/invitations.module';
import { SlotsModule } from './slots/slots.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventsModule } from './events/events.module'; // Add this import
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
     ConfigModule.forRoot({
    isGlobal: true, // This makes ConfigService available throughout the app
    envFilePath: '.env', // Explicitly specify the env file path
  }),
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    GamesModule,
    UsersModule,
    InvitationsModule,
    SlotsModule,
    EventsModule,
    AuthModule
  ],
})
export class AppModule {}