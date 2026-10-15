import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { isCustomApiMessage } from '../response/api-message';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor<unknown, ApiResponse<unknown>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ApiResponse<unknown>> {
    return next.handle().pipe(
      map((data) => {
        if (isCustomApiMessage(data)) {
          return {
            code: 0,
            message: data.message,
            data: data.data,
          };
        }

        return {
          code: 0,
          message: 'ok',
          data,
        };
      }),
    );
  }
}
