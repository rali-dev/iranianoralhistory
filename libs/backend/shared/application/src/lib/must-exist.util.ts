import { NotFoundException } from '@nestjs/common';

export async function mustExist<T>(
  lookup: Promise<T | null>,
  entityName: string,
  id: string,
): Promise<T> {
  const entity = await lookup;
  if (!entity) throw new NotFoundException(`${entityName} ${id} not found`);
  return entity;
}
