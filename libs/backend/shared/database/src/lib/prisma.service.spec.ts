import { PrismaService } from './prisma.service';

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

// Mock must assign to 'this', NOT return a new object —
// returning a new object from a constructor replaces 'this' in the derived class
// and causes PrismaService methods to be lost.
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(function (this: Record<string, unknown>) {
    this['$connect']    = jest.fn().mockResolvedValue(undefined);
    this['$disconnect'] = jest.fn().mockResolvedValue(undefined);
  }),
}));

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test';
    service = new PrismaService();
  });

  afterEach(() => {
    delete process.env['DATABASE_URL'];
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('calls $connect on onModuleInit', async () => {
    await service.onModuleInit();

    expect((service as any).$connect).toHaveBeenCalledTimes(1);
  });

  it('calls $disconnect on onModuleDestroy', async () => {
    await service.onModuleDestroy();

    expect((service as any).$disconnect).toHaveBeenCalledTimes(1);
  });

  it('uses empty string as connectionString when DATABASE_URL is not set', () => {
    delete process.env['DATABASE_URL'];
    const { PrismaPg } = jest.requireMock('@prisma/adapter-pg');

    new PrismaService();

    expect(PrismaPg).toHaveBeenCalledWith({ connectionString: '' });
  });

  it('uses DATABASE_URL as connectionString when set', () => {
    process.env['DATABASE_URL'] = 'postgresql://user:pass@host:5432/db';
    const { PrismaPg } = jest.requireMock('@prisma/adapter-pg');

    new PrismaService();

    expect(PrismaPg).toHaveBeenCalledWith({
      connectionString: 'postgresql://user:pass@host:5432/db',
    });
  });
});
