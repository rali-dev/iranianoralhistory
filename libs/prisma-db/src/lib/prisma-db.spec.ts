import { prismaDb } from './prisma-db';

describe('prismaDb', () => {
  it('should work', () => {
    expect(prismaDb()).toEqual('prisma-db');
  });
});
