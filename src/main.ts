import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';


// Cache the NestJS app instance
let app: INestApplication;


async function bootstrap() {
  if(app) return app;
  app = await NestFactory.create(AppModule);
  
  // Enable CORS
  const allowedOrigins = [
    'https://apple.contentstackapps.com', // Your live frontend
    'http://localhost:3000', // Your local frontend (adjust port if needed)
    'http://localhost:4000' // Your local frontend (adjust port if needed)
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests if the origin is in your list or if there's no origin (like Postman)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
    credentials: true, // Required for sending Authorization headers or cookies
    preflightContinue: false,
    optionsSuccessStatus: 204,
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

