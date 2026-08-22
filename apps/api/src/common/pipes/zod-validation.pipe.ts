import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata?: ArgumentMetadata) {
    // Only validate 'body' arguments. Do not run body schema validation on @CurrentUser() or route params
    if (metadata && metadata.type !== 'body') {
      return value;
    }

    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        const summary = errorDetails.map((e) => `${e.path}: ${e.message}`).join(', ');

        throw new BadRequestException({
          message: summary || 'Validation failed',
          error: 'Bad Request',
          errors: errorDetails,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
