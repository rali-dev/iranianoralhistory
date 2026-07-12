import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionType as PrismaCollectionType } from '@prisma/client';
import { PrismaService } from '@iranianoralhistory/backend-shared-database';
import {
  IVideoRepository,
  VideoEntity,
  DocumentEntity,
  VimeoId,
  CreateVideoInput,
  UpdateVideoInput,
  CreateDocumentInput,
  UpdateDocumentInput,
} from '@iranianoralhistory/backend-video-domain';
import { IVideoCollectionRef } from '@iranianoralhistory/shared-contracts';

@Injectable()
export class PrismaVideoRepository implements IVideoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<VideoEntity[]> {
    const rows = await this.prisma.video.findMany({
      include: {
        documents: true,
        collections: { include: { collection: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<VideoEntity | null> {
    const row = await this.prisma.video.findUnique({
      where: { id },
      include: {
        documents: true,
        collections: { include: { collection: true } },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateVideoInput): Promise<VideoEntity> {
    const row = await this.prisma.video.create({
      data: {
        vimeoId: data.vimeoId.toString(),
        titleDe: data.title.de,
        titleEn: data.title.en,
        titleFa: data.title.fa,
        descDe: data.description?.de,
        descEn: data.description?.en,
        descFa: data.description?.fa,
      },
      include: {
        documents: true,
        collections: { include: { collection: true } },
      },
    });
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateVideoInput): Promise<VideoEntity> {
    const row = await this.prisma.video.update({
      where: { id },
      data: {
        ...(data.vimeoId !== undefined && { vimeoId: data.vimeoId }),
        ...(data.title?.de !== undefined && { titleDe: data.title.de }),
        ...(data.title?.en !== undefined && { titleEn: data.title.en }),
        ...(data.title?.fa !== undefined && { titleFa: data.title.fa }),
        ...(data.description === null
          ? { descDe: null, descEn: null, descFa: null }
          : data.description !== undefined && {
              ...(data.description.de !== undefined && { descDe: data.description.de }),
              ...(data.description.en !== undefined && { descEn: data.description.en }),
              ...(data.description.fa !== undefined && { descFa: data.description.fa }),
            }),
      },
      include: {
        documents: true,
        collections: { include: { collection: true } },
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.video.delete({ where: { id } });
  }

  async findDocumentById(docId: string): Promise<DocumentEntity | null> {
    const doc = await this.prisma.document.findUnique({ where: { id: docId } });
    if (!doc) return null;
    return new DocumentEntity(doc.id, doc.title, doc.storagePath, doc.videoId, doc.createdAt);
  }

  async addDocument(data: CreateDocumentInput): Promise<DocumentEntity> {
    const doc = await this.prisma.document.create({
      data: { title: data.title, storagePath: data.storagePath, videoId: data.videoId },
    });
    return new DocumentEntity(doc.id, doc.title, doc.storagePath, doc.videoId, doc.createdAt);
  }

  async updateDocument(docId: string, data: UpdateDocumentInput): Promise<DocumentEntity> {
    const doc = await this.prisma.document.update({
      where: { id: docId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.storagePath !== undefined && { storagePath: data.storagePath }),
      },
    });
    return new DocumentEntity(doc.id, doc.title, doc.storagePath, doc.videoId, doc.createdAt);
  }

  async deleteDocument(docId: string): Promise<void> {
    const exists = await this.prisma.document.findUnique({ where: { id: docId } });
    if (!exists) throw new NotFoundException(`Document ${docId} not found`);
    await this.prisma.document.delete({ where: { id: docId } });
  }

  private toEntity(row: {
    id: string;
    vimeoId: string;
    titleDe: string;
    titleEn: string;
    titleFa: string;
    descDe: string | null;
    descEn: string | null;
    descFa: string | null;
    createdAt: Date;
    updatedAt: Date;
    documents: { id: string; title: string; storagePath: string; videoId: string; createdAt: Date }[];
    collections: {
      collection: {
        id: string;
        slug: string;
        type: PrismaCollectionType;
        nameDe: string;
        nameEn: string;
        nameFa: string;
      };
    }[];
  }): VideoEntity {
    const documents = row.documents.map(
      (d) => new DocumentEntity(d.id, d.title, d.storagePath, d.videoId, d.createdAt),
    );
    const collections: IVideoCollectionRef[] = row.collections.map(({ collection: c }) => ({
      id: c.id,
      slug: c.slug,
      type: c.type,
      name: { de: c.nameDe, en: c.nameEn, fa: c.nameFa },
    }));
    return new VideoEntity(
      row.id,
      VimeoId.create(row.vimeoId),
      { de: row.titleDe, en: row.titleEn, fa: row.titleFa },
      row.descDe ? { de: row.descDe, en: row.descEn ?? '', fa: row.descFa ?? '' } : null,
      documents,
      collections,
      row.createdAt,
      row.updatedAt,
    );
  }
}
