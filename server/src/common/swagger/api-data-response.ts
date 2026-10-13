import { Type } from '@nestjs/common';
import { ApiResponseOptions, getSchemaPath } from '@nestjs/swagger';

interface ApiDataResponseOptions {
  description: string;
  status?: number;
}

export function apiDataResponse(
  dataModel: Type<unknown>,
  options: ApiDataResponseOptions,
): ApiResponseOptions {
  return {
    status: options.status,
    description: options.description,
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'number',
          example: 0,
        },
        message: {
          type: 'string',
          example: 'ok',
        },
        data: {
          $ref: getSchemaPath(dataModel),
        },
      },
    },
  };
}
