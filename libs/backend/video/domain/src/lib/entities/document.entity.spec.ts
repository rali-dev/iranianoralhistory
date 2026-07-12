import { DocumentEntity } from './document.entity';

describe('DocumentEntity', () => {
  it('exposes all constructor fields as readonly properties', () => {
    const createdAt = new Date('2024-01-15');
    const doc = new DocumentEntity(
      'doc-uuid',
      'Lebenslauf.pdf',
      'uploads/lebenslauf.pdf',
      'video-uuid',
      createdAt,
    );

    expect(doc.id).toBe('doc-uuid');
    expect(doc.title).toBe('Lebenslauf.pdf');
    expect(doc.storagePath).toBe('uploads/lebenslauf.pdf');
    expect(doc.videoId).toBe('video-uuid');
    expect(doc.createdAt).toBe(createdAt);
  });
});
