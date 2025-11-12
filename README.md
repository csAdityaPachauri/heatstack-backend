# Heatstack Backend

A NestJS backend application built with TypeScript.

## Description

This is a boilerplate NestJS application with TypeScript, providing a solid foundation for building scalable server-side applications.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

```bash
# Install dependencies
npm install
```

## Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The application will be available at `http://localhost:3000/api`

## Available Endpoints

- `GET /api` - Welcome message
- `GET /api/health` - Health check endpoint

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
src/
├── app.controller.ts    # Main controller with route handlers
├── app.module.ts        # Root module
├── app.service.ts       # Business logic service
└── main.ts             # Application entry point

test/
├── app.e2e-spec.ts     # End-to-end tests
└── jest-e2e.json       # E2E test configuration
```

## Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/heatstack
```

## Database Setup

This application uses MongoDB with Mongoose. 

### Quick Start with MongoDB:

**Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Or install locally:**
- macOS: `brew install mongodb-community && brew services start mongodb-community`
- Ubuntu: `sudo apt-get install mongodb`
- Windows: Download from [mongodb.com](https://www.mongodb.com/try/download/community)

For detailed database configuration, see [DATABASE.md](./DATABASE.md)

## Building for Production

```bash
npm run build
```

The compiled files will be in the `dist/` directory.

## Technologies

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [Jest](https://jestjs.io/) - Testing framework
- [ESLint](https://eslint.org/) - Code linting
- [Prettier](https://prettier.io/) - Code formatting

## Next Steps

1. Install dependencies: `npm install`
2. Start development server: `npm run start:dev`
3. Visit `http://localhost:3000/api` to see your application running
4. Begin adding your own modules, controllers, and services

## Adding New Features

To create new modules, controllers, or services, you can use NestJS CLI:

```bash
# Generate a new module
nest g module users

# Generate a new controller
nest g controller users

# Generate a new service
nest g service users

# Generate a complete resource (CRUD)
nest g resource users
```

## License

MIT

