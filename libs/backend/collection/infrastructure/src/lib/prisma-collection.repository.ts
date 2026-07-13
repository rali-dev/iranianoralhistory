import { Injectable } from '@nestjs/common';
import { CollectionType as PrismaCollectionType } from '@prisma/client';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import {
  ICollectionRepository,
  CollectionEntity,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '@iranianoralhistory/backend-collection-domain';
import { CollectionType } from '@iranianoralhistory/shared-contracts';

@Injectable()
export class PrismaCollectionRepository implements ICollectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CollectionEntity[]> {
    const rows = await this.prisma.collection.findMany({
      include: { _count: { select: { videos: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findBySlug(slug: string): Promise<CollectionEntity | null> {
    const row = await this.prisma.collection.findUnique({
      where: { slug },
      include: { _count: { select: { videos: true } } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByType(type: CollectionType): Promise<CollectionEntity[]> {
    const rows = await this.prisma.collection.findMany({
      where: { type: type as PrismaCollectionType },
      include: { _count: { select: { videos: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => this.toEntity(r));
  }

  async create(data: CreateCollectionInput): Promise<CollectionEntity> {
    // Write-Pfad läuft durch die Domäne: `create` erzwingt die Invarianten und
    // normalisiert (Slug-Trim), bevor irgendetwas persistiert wird.
    const draft = CollectionEntity.create(data);
    const row = await this.prisma.collection.create({
      data: {
        slug: draft.slug,
        type: draft.type as PrismaCollectionType,
        nameDe: draft.name.de,
        nameEn: draft.name.en,
        nameFa: draft.name.fa,
        descDe: draft.description?.de,
        descEn: draft.description?.en,
        descFa: draft.description?.fa,
        sortOrder: draft.sortOrder,
      },
      include: { _count: { select: { videos: true } } },
    });
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateCollectionInput): Promise<CollectionEntity> {
    // Invarianten auch auf dem Patch-Pfad erzwingen: ein leerer Slug oder ein
    // leergeräumter Name (vom Optional-DTO durchgelassen) wird hier abgefangen.
    CollectionEntity.assertValidUpdate(data);
    const row = await this.prisma.collection.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: data.slug.trim() }),
        ...(data.name?.de !== undefined && { nameDe: data.name.de }),
        ...(data.name?.en !== undefined && { nameEn: data.name.en }),
        ...(data.name?.fa !== undefined && { nameFa: data.name.fa }),
        ...(data.description === null
          ? { descDe: null, descEn: null, descFa: null }
          : data.description !== undefined && {
              ...(data.description.de !== undefined && { descDe: data.description.de }),
              ...(data.description.en !== undefined && { descEn: data.description.en }),
              ...(data.description.fa !== undefined && { descFa: data.description.fa }),
            }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: { _count: { select: { videos: true } } },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.collection.delete({ where: { id } });
  }

  async assignVideo(videoId: string, collectionId: string): Promise<void> {
    await this.prisma.videoCollection.upsert({
      where: { videoId_collectionId: { videoId, collectionId } },
      create: { videoId, collectionId },
      update: {},
    });
  }

  async removeVideo(videoId: string, collectionId: string): Promise<void> {
    // Idempotent — mirrors assignVideo's upsert: no error if the link is already gone.
    await this.prisma.videoCollection.deleteMany({ where: { videoId, collectionId } });
  }

  private toEntity(row: {
    id: string;
    slug: string;
    type: PrismaCollectionType;
    nameDe: string;
    nameEn: string;
    nameFa: string;
    descDe: string | null;
    descEn: string | null;
    descFa: string | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    _count: { videos: number };
  }): CollectionEntity {
    // Eine Beschreibung existiert, sobald IRGENDEIN Sprach-Feld gesetzt ist.
    // Früher an `descDe` allein gekoppelt — dabei gingen EN/FA still verloren,
    // wenn nur die (oft zuletzt gepflegte) deutsche Fassung fehlte.
    const hasDescription =
      row.descDe !== null || row.descEn !== null || row.descFa !== null;

    return new CollectionEntity(
      row.id,
      row.slug,
      row.type as CollectionType,
      { de: row.nameDe, en: row.nameEn, fa: row.nameFa },
      hasDescription
        ? { de: row.descDe ?? '', en: row.descEn ?? '', fa: row.descFa ?? '' }
        : null,
      row.sortOrder,
      row._count.videos,
      row.createdAt,
      row.updatedAt,
    );
  }
}
