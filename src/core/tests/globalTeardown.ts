import { MongoMemoryServer } from 'mongodb-memory-server';

declare global {
  var mongoTestServer: MongoMemoryServer | undefined;
}

export default async function globalTeardown(): Promise<void> {
  await globalThis.mongoTestServer?.stop();
}
