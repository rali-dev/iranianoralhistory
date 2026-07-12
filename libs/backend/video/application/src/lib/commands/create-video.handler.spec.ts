import { CreateVideoHandler } from './create-video.handler';
import { CreateVideoCommand } from './create-video.command';
import { VideoEntity, VimeoId, VideoCreatedEvent } from '@iranianoralhistory/backend-video-domain';
import { DomainException } from '@iranianoralhistory/shared-contracts';

function buildVideoEntity(): VideoEntity {
  return new VideoEntity(
    'video-uuid',
    VimeoId.create('123456789'),
    { de: 'Deutscher Titel', en: 'English Title', fa: 'عنوان' },
    null,
    [],
    [],
    new Date(),
    new Date(),
  );
}

const mockVideoRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockEventPublisher = {
  publish: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
};

describe('CreateVideoHandler', () => {
  let handler: CreateVideoHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new CreateVideoHandler(mockVideoRepo as any, mockEventPublisher as any);
    (handler as any).logger = mockLogger;
  });

  it('creates a video and returns the entity', async () => {
    const video = buildVideoEntity();
    mockVideoRepo.create.mockResolvedValue(video);

    const result = await handler.execute(
      new CreateVideoCommand({
        vimeoId: '123456789',
        title: { de: 'Deutscher Titel', en: 'English Title', fa: 'عنوان' },
      }),
    );

    expect(result).toBe(video);
    expect(mockVideoRepo.create).toHaveBeenCalledWith({
      vimeoId: expect.any(VimeoId),
      title: { de: 'Deutscher Titel', en: 'English Title', fa: 'عنوان' },
      description: null,
    });
  });

  it('publishes a VideoCreatedEvent after creation', async () => {
    mockVideoRepo.create.mockResolvedValue(buildVideoEntity());

    await handler.execute(
      new CreateVideoCommand({
        vimeoId: '123456789',
        title: { de: 'Titel', en: 'Title', fa: 'عنوان' },
      }),
    );

    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      expect.any(VideoCreatedEvent),
    );
    const event = mockEventPublisher.publish.mock.calls[0][0] as VideoCreatedEvent;
    expect(event.videoId).toBe('video-uuid');
    expect(event.vimeoId).toBe('123456789');
  });

  it('passes the description when provided', async () => {
    mockVideoRepo.create.mockResolvedValue(buildVideoEntity());

    await handler.execute(
      new CreateVideoCommand({
        vimeoId: '987654321',
        title: { de: 'Titel', en: 'Title', fa: 'عنوان' },
        description: { de: 'Beschr.', en: 'Desc', fa: 'توضیح' },
      }),
    );

    expect(mockVideoRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: { de: 'Beschr.', en: 'Desc', fa: 'توضیح' },
      }),
    );
  });

  it('throws DomainException for a non-numeric Vimeo ID', async () => {
    await expect(
      handler.execute(
        new CreateVideoCommand({
          vimeoId: 'not-a-number',
          title: { de: 'T', en: 'T', fa: 'ت' },
        }),
      ),
    ).rejects.toThrow(DomainException);

    expect(mockVideoRepo.create).not.toHaveBeenCalled();
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });
});
