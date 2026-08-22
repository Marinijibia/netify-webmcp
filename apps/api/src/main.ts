import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security and Middleware
  app.use(helmet());
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefixes and interceptors
  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Netify API')
    .setDescription('AI Collections + Business Memory for African SMEs')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Netify API is running on: http://0.0.0.0:${port}/api/v1 (Local: http://localhost:${port}/api/v1)`);
  logger.log(`📖 Swagger API Docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
