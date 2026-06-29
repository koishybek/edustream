import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
  it('reports ok + database up when the DB responds', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;

    const result = await new HealthService(prisma).check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(result.service).toBe('edustream-api');
  });

  it('reports degraded + database down when the DB throws', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as PrismaService;

    const result = await new HealthService(prisma).check();

    expect(result.status).toBe('degraded');
    expect(result.database).toBe('down');
  });
});
