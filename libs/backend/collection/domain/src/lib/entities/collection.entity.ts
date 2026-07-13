import {
  IVideoTranslation,
  CollectionType,
  DomainException,
} from '@iranianoralhistory/shared-contracts';
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
} from '../repositories/collection-repository.interface';

const COLLECTION_TYPES: readonly CollectionType[] = ['PERSON', 'TOPIC'];
const LANGS = ['de', 'en', 'fa'] as const;

export class CollectionEntity {
  constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly type: CollectionType,
    public readonly name: IVideoTranslation,
    public readonly description: IVideoTranslation | null,
    public readonly sortOrder: number,
    public readonly videoCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory für eine NEUE (noch nicht persistierte) Sammlung. Erzwingt die
   * Domäneninvarianten VOR dem Schreiben — auch die, die die Transportschicht
   * (DTO) nicht abdeckt, etwa rein aus Leerzeichen bestehende Slugs/Namen. Das
   * Repository persistiert aus dieser Entity, nicht aus dem rohen DTO, sodass
   * kein Write die Invarianten umgeht. `id`/`videoCount`/Timestamps sind bis zur
   * Persistierung Platzhalter (die DB vergibt sie beim Anlegen).
   */
  static create(input: CreateCollectionInput): CollectionEntity {
    const slug = input.slug.trim();
    CollectionEntity.assertSlug(slug);
    CollectionEntity.assertType(input.type);
    CollectionEntity.assertName(input.name);
    CollectionEntity.assertSortOrder(input.sortOrder);

    const now = new Date();
    return new CollectionEntity(
      '',
      slug,
      input.type,
      input.name,
      input.description ?? null,
      input.sortOrder,
      0,
      now,
      now,
    );
  }

  /**
   * Validiert einen Partial-Patch VOR dem Schreiben. Nur gesetzte Felder werden
   * geprüft (die Partial-Update-Semantik bleibt erhalten); ein leerer Slug oder
   * ein leergeräumter Name — vom Update-DTO (Optional-Felder) durchgelassen —
   * wird hier abgefangen, bevor er die DB erreicht.
   */
  static assertValidUpdate(patch: UpdateCollectionInput): void {
    if (patch.slug !== undefined) CollectionEntity.assertSlug(patch.slug.trim());
    if (patch.sortOrder !== undefined) CollectionEntity.assertSortOrder(patch.sortOrder);
    if (patch.name) {
      for (const lang of LANGS) {
        const value = patch.name[lang];
        if (value !== undefined && value.trim().length === 0) {
          throw new DomainException(`Collection name (${lang}) must not be blank.`);
        }
      }
    }
  }

  private static assertSlug(slug: string): void {
    if (slug.length === 0) {
      throw new DomainException('Collection slug must not be empty.');
    }
  }

  private static assertType(type: CollectionType): void {
    if (!COLLECTION_TYPES.includes(type)) {
      throw new DomainException(`Invalid collection type: "${type}". Must be PERSON or TOPIC.`);
    }
  }

  private static assertName(name: IVideoTranslation): void {
    for (const lang of LANGS) {
      if (!name[lang] || name[lang].trim().length === 0) {
        throw new DomainException(`Collection name (${lang}) must not be blank.`);
      }
    }
  }

  private static assertSortOrder(sortOrder: number): void {
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new DomainException(
        `Collection sortOrder must be a non-negative integer, got ${sortOrder}.`,
      );
    }
  }

  getName(lang: 'de' | 'en' | 'fa'): string {
    return this.name[lang];
  }

  getDescription(lang: 'de' | 'en' | 'fa'): string | null {
    return this.description?.[lang] ?? null;
  }
}
