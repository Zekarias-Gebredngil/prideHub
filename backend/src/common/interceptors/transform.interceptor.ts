import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown[];
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly reflector?: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const message = this.reflector?.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) || 'Success';

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message,
        data: data ?? null,
        errors: [],
      })),
    );
  }
}
