import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

interface HttpErrorBody {
  error?: string;
  message?: string | string[];
}

const SERVER_ERROR_STATUS = 500;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      code: status,
      message: this.getMessage(exception, status),
      data: null,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private getMessage(exception: unknown, status: number): string {
    if (status >= SERVER_ERROR_STATUS && process.env.NODE_ENV === 'production') {
      return '服务器内部错误';
    }

    if (!(exception instanceof HttpException)) {
      return exception instanceof Error ? exception.message : '服务器内部错误';
    }

    const body = exception.getResponse();

    if (typeof body === 'string') {
      return body;
    }

    if (typeof body === 'object' && body !== null) {
      const errorBody = body as HttpErrorBody;

      if (Array.isArray(errorBody.message)) {
        return errorBody.message.join('; ');
      }

      return errorBody.message ?? errorBody.error ?? exception.message;
    }

    return exception.message;
  }
}
