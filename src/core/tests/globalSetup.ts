import { MongoMemoryServer } from 'mongodb-memory-server';

declare global {
  var mongoTestServer: MongoMemoryServer | undefined;
}

export default async function globalSetup(): Promise<void> {
  const mongoTestServer = await MongoMemoryServer.create();

  globalThis.mongoTestServer = mongoTestServer;
  process.env.MONGO_URI = mongoTestServer.getUri('team-app-test');
  process.env.JWT_SECRET = 'test-only-jwt-secret';
  process.env.APP_URL = 'http://localhost:3000/';
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-api-key';
  process.env.CLOUDINARY_SECRET_KEY = 'test-secret-key';
  process.env.CLOUDINARY_URL = 'cloudinary://test-api-key:test-secret-key@test-cloud';
  process.env.RESEND_API_KEY = 're_test_only';
}
