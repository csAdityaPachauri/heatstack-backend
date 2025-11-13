import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';


// Cache the NestJS app instance
let app: INestApplication;


async function bootstrap() {
  if(app) return app;
  app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    credentials: false,
    preflightContinue: true,
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}

export default async (req: any, res: any) => {
  const nestApp = await bootstrap();
  const server = nestApp.getHttpAdapter().getInstance();
  server(req, res);
};

