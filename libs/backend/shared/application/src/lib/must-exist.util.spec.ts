import { NotFoundException } from '@nestjs/common';
import { mustExist } from './must-exist.util';

describe('mustExist()', () => {
  it('returns the entity when it is found', async () => {
    const entity = { id: 'some-uuid' };
    const result = await mustExist(Promise.resolve(entity), 'Video', 'some-uuid');
    expect(result).toBe(entity);
  });

  it('throws NotFoundException with entity name and id when null is returned', async () => {
    await expect(
      mustExist(Promise.resolve(null), 'Video', 'missing-uuid'),
    ).rejects.toThrow(NotFoundException);
  });

  it('includes the entity name and id in the error message', async () => {
    await expect(
      mustExist(Promise.resolve(null), 'Collection', 'col-abc'),
    ).rejects.toThrow('Collection col-abc not found');
  });

  it('works with any entity type (generic)', async () => {
    const arr = [1, 2, 3];
    const result = await mustExist(Promise.resolve(arr), 'List', 'list-id');
    expect(result).toBe(arr);
  });
});
