/**
 * Event types for the Stitch Fix Client Engagement Acceleration System
 */

import { User, Order, Email } from './models';

/**
 * Base event interface
 */
export interface Event<T = unknown> {
  type: EventType;
  payload: T;
  timestamp: string;
}

/**
 * Event types enum
 */
export enum EventType {
  // User events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  
  // Order events
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  
  // Email events
  EMAIL_GENERATED = 'EMAIL_GENERATED',
  EMAIL_SENT = 'EMAIL_SENT',
  EMAIL_OPENED = 'EMAIL_OPENED',
  EMAIL_CLICKED = 'EMAIL_CLICKED',
  EMAIL_FAILED = 'EMAIL_FAILED'
}

/**
 * User created event
 */
export interface UserCreatedEvent extends Event<User> {
  type: EventType.USER_CREATED;
}

/**
 * User updated event
 */
export interface UserUpdatedEvent extends Event<User> {
  type: EventType.USER_UPDATED;
}

/**
 * User deleted event
 */
export interface UserDeletedEvent extends Event<{ userId: string }> {
  type: EventType.USER_DELETED;
}

/**
 * Order created event
 */
export interface OrderCreatedEvent extends Event<Order> {
  type: EventType.ORDER_CREATED;
}

/**
 * Order updated event
 */
export interface OrderUpdatedEvent extends Event<Order> {
  type: EventType.ORDER_UPDATED;
}

/**
 * Order cancelled event
 */
export interface OrderCancelledEvent extends Event<{ orderId: string; userId: string }> {
  type: EventType.ORDER_CANCELLED;
}

/**
 * Email generated event
 */
export interface EmailGeneratedEvent extends Event<Email> {
  type: EventType.EMAIL_GENERATED;
}

/**
 * Email sent event
 */
export interface EmailSentEvent extends Event<{ emailId: string; userId: string }> {
  type: EventType.EMAIL_SENT;
}

/**
 * Email opened event
 */
export interface EmailOpenedEvent extends Event<{ emailId: string; userId: string }> {
  type: EventType.EMAIL_OPENED;
}

/**
 * Email clicked event
 */
export interface EmailClickedEvent extends Event<{ emailId: string; userId: string; linkUrl: string }> {
  type: EventType.EMAIL_CLICKED;
}

/**
 * Email failed event
 */
export interface EmailFailedEvent extends Event<{ emailId: string; userId: string; error: string }> {
  type: EventType.EMAIL_FAILED;
}

/**
 * Union type of all events
 */
export type AnyEvent =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | OrderCreatedEvent
  | OrderUpdatedEvent
  | OrderCancelledEvent
  | EmailGeneratedEvent
  | EmailSentEvent
  | EmailOpenedEvent
  | EmailClickedEvent
  | EmailFailedEvent;

/**
 * Create an event with the correct type and timestamp
 */
export function createEvent<T extends EventType, P>(type: T, payload: P): Event<P> {
  return {
    type,
    payload,
    timestamp: new Date().toISOString()
  };
}