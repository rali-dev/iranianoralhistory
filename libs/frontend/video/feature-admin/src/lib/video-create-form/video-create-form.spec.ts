import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VideoCreateFormComponent } from './video-create-form';
import { VideoApiService } from '@iranianoralhistory/frontend-video-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

function buildVideo() {
  return {
    id: 'v-uuid',
    vimeoId: '111222333',
    title: { de: 'Titel', en: 'Title', fa: 'عنوان' },
    description: null,
    documents: [],
    collections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const mockVideoApi: Partial<VideoApiService> = { create: jest.fn() };
const mockI18n = { t: jest.fn().mockImplementation((key: string) => key), lang: jest.fn().mockReturnValue('de') };

async function createComponent() {
  await TestBed.configureTestingModule({
    imports: [VideoCreateFormComponent],
    providers: [
      { provide: VideoApiService, useValue: mockVideoApi },
      { provide: I18nService,     useValue: mockI18n },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(VideoCreateFormComponent);
  return { fixture, component: fixture.componentInstance };
}

describe('VideoCreateFormComponent', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('submit() — validation', () => {
    it('sets form error when vimeoId is empty', async () => {
      const { component } = await createComponent();
      component.titleDe.set('T');
      component.titleEn.set('T');
      component.titleFa.set('ت');

      component.submit();

      expect(mockVideoApi.create).not.toHaveBeenCalled();
      expect(component.form.error()).toBeTruthy();
    });

    it('sets form error when any title field is empty', async () => {
      const { component } = await createComponent();
      component.vimeoId.set('123456789');
      component.titleDe.set('Titel');
      component.titleEn.set('');
      component.titleFa.set('عنوان');

      component.submit();

      expect(mockVideoApi.create).not.toHaveBeenCalled();
    });
  });

  describe('submit() — success path', () => {
    it('calls videoApi.create with the correct DTO', async () => {
      (mockVideoApi.create as jest.Mock).mockReturnValue(of(buildVideo()));
      const { component } = await createComponent();
      component.vimeoId.set('111222333');
      component.titleDe.set('Titel');
      component.titleEn.set('Title');
      component.titleFa.set('عنوان');
      component.descDe.set('Beschreibung');
      component.descEn.set('Description');
      component.descFa.set('توضیح');

      component.submit();

      expect(mockVideoApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vimeoId: '111222333',
          title: { de: 'Titel', en: 'Title', fa: 'عنوان' },
        }),
      );
    });

    it('emits videoCreated with the returned video', async () => {
      const video = buildVideo();
      (mockVideoApi.create as jest.Mock).mockReturnValue(of(video));
      const { component } = await createComponent();
      component.vimeoId.set('111222333');
      component.titleDe.set('Titel');
      component.titleEn.set('Title');
      component.titleFa.set('عنوان');

      const emitted: unknown[] = [];
      component.videoCreated.subscribe((v) => emitted.push(v));
      component.submit();

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual(video);
    });

    it('resets all fields after a successful submit', async () => {
      (mockVideoApi.create as jest.Mock).mockReturnValue(of(buildVideo()));
      const { component } = await createComponent();
      component.vimeoId.set('111222333');
      component.titleDe.set('Titel');
      component.titleEn.set('Title');
      component.titleFa.set('عنوان');

      component.submit();

      expect(component.vimeoId()).toBe('');
      expect(component.titleDe()).toBe('');
    });
  });

  describe('submit() — error path', () => {
    it('sets form error when the API call fails', async () => {
      (mockVideoApi.create as jest.Mock).mockReturnValue(
        throwError(() => ({ error: { message: 'Conflict' } })),
      );
      const { component } = await createComponent();
      component.vimeoId.set('111222333');
      component.titleDe.set('Titel');
      component.titleEn.set('Title');
      component.titleFa.set('عنوان');

      component.submit();

      expect(component.form.error()).toBeTruthy();
    });

    it('falls back to the i18n ERR_SAVE key when the error has no message', async () => {
      (mockVideoApi.create as jest.Mock).mockReturnValue(throwError(() => ({})));
      const { component } = await createComponent();
      component.vimeoId.set('111222333');
      component.titleDe.set('Titel');
      component.titleEn.set('Title');
      component.titleFa.set('عنوان');

      component.submit();

      expect(component.form.error()).toBe('ADMIN.VIDEO.ERR_SAVE');
      expect(mockI18n.t).toHaveBeenCalledWith('ADMIN.VIDEO.ERR_SAVE');
    });
  });
});
