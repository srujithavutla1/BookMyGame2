// src/events/events.controller.ts
import { Controller, Sse, MessageEvent, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private eventEmitter: EventEmitter2) {}

  @Sse('slots/expired')
  slotUpdates(): Observable<MessageEvent> {
    console.log("slot updates");
    return new Observable((subscriber) => {
      const handler = (data) => {
        subscriber.next({ data });
      };

      this.eventEmitter.on('slot.expired', handler);

      return () => {
        this.eventEmitter.off('slot.expired', handler);

      };
    });
  }
  @Sse('slots/created')
  slotCreation(): Observable<MessageEvent> {
    console.log("slots creation event emitted");
    return new Observable((subscriber) => {
      const handler = (data) => {
        subscriber.next({ data });
      };

      this.eventEmitter.on('slot.created', handler);

      return () => {
        this.eventEmitter.off('slot.created', handler);
      };
    });
  }
  @Sse('slots/StatusUpdated')
  slotStatusUpdated(): Observable<MessageEvent> {
    console.log("slots updation event emitted");
    return new Observable((subscriber) => {
      const handler = (data) => {
        subscriber.next({ data });
      };

      this.eventEmitter.on('slot.statusUpdated', handler);

      return () => {
        this.eventEmitter.off('slot.statusUpdated', handler);
      };
    });
  }
}