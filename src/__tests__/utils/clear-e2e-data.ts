import request from 'supertest';
import type { App } from 'supertest/types.js';
import { HTTP_STATUS } from './http-status.js';

export async function clearE2eData(httpServer: App): Promise<void> {
  await request(httpServer).delete('/testing/all-data').expect(HTTP_STATUS.NO_CONTENT_204);
}
