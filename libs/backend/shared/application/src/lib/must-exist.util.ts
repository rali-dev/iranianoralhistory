import { NotFoundException } from '@nestjs/common';

export async function mustExist<T>(
  lookup: Promise<T | null>,
  entityName: string,
  id: string,
): Promise<T> {
  const entity = await lookup;
  // Nur ein tatsächlich fehlender Wert (null/undefined) ist "not found" — ein
  // legitim falsy Wert (0, '', false) bleibt ein gültiges Ergebnis.
  if (entity == null) throw new NotFoundException(`${entityName} ${id} not found`);
  return entity;
}
