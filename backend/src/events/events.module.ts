// src/events/events.module.ts
import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SlotsModule } from '../slots/slots.module';
import { Slot } from 'src/slots/schemas/slot.schema';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    SlotsModule
  ],
  controllers: [EventsController]
})
export class EventsModule {}