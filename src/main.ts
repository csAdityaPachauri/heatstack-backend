import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';


// Cache the NestJS app instance
let app: INestApplication;


async function bootstrap() {
  if(app) return app;
  app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // or specify your frontend's domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
    preflightContinue: false, // This is the key change
    allowedHeaders: 'Content-Type, Accept, Authorization'
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

