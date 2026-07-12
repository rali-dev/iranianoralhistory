import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DocumentAddFormComponent } from './document-add-form';
import { VideoApiService } from '@iranianoralhistory/frontend-video-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

function buildDocument() {
  return { id: 'doc-uuid', title: 'Zeugnis', storagePath: 'docs/zeugnis.pdf' };
}

const mockVideoApi: Partial<VideoApiService> = { addDocument: jest.fn() };
const mockI18n = { t: jest.fn().mockImplementation((key: string) => key), lang: jest.fn().mockReturnValue('de') };

async function createComponent(videoId = 'v-uuid') {
  await TestBed.configureTestingModule({
    imports: [DocumentAddFormComponent],
    providers: [
      { provide: VideoApiService, useValue: mockVideoApi },
      { provide: I18nService,     useValue: mockI18n },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(DocumentAddFormComponent);
  fixture.componentRef.setInput('videoId', videoId);
  return { fixture, component: fixture.componentInstance };
}

describe('DocumentAddFormComponent', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('submit() — validation', () => {
    it('sets form error when title is empty', async () => {
      const { component } = await createComponent();
      component.storagePath.set('docs/file.pdf');

      component.submit();

      expect(mockVideoApi.addDocument).not.toHaveBeenCalled();
      expect(component.form.error()).toBeTruthy();
    });

    it('sets form error when storagePath is empty', async () => {
      const { component } = await createComponent();
      component.title.set('Zeugnis');

      component.submit();

      expect(mockVideoApi.addDocument).not.toHaveBeenCalled();
    });
  });

  describe('submit() — success path', () => {
    it('calls videoApi.addDocument with videoId and correct DTO', async () => {
      (mockVideoApi.addDocument as jest.Mock).mockReturnValue(of(buildDocument()));
      const { component } = await createComponent('v-uuid');
      component.title.set('Zeugnis');
      component.storagePath.set('docs/zeugnis.pdf');

      component.submit();

      expect(mockVideoApi.addDocument).toHaveBeenCalledWith('v-uuid', {
        title: 'Zeugnis',
        storagePath: 'docs/zeugnis.pdf',
      });
    });

    it('emits documentAdded with the returned document', async () => {
      const doc = buildDocument();
      (mockVideoApi.addDocument as jest.Mock).mockReturnValue(of(doc));
      const { component } = await createComponent();
      component.title.set('Zeugnis');
      component.storagePath.set('docs/zeugnis.pdf');

      const emitted: unknown[] = [];
      component.documentAdded.subscribe((d) => emitted.push(d));
      component.submit();

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual(doc);
    });

    it('clears title and storagePath after success', async () => {
      (mockVideoApi.addDocument as jest.Mock).mockReturnValue(of(buildDocument()));
      const { component } = await createComponent();
      component.title.set('Zeugnis');
      component.storagePath.set('docs/zeugnis.pdf');

      component.submit();

      expect(component.title()).toBe('');
      expect(component.storagePath()).toBe('');
    });
  });

  describe('submit() — error path', () => {
    it('sets form error on API failure', async () => {
      (mockVideoApi.addDocument as jest.Mock).mockReturnValue(
        throwError(() => ({ error: { message: 'Upload failed' } })),
      );
      const { component } = await createComponent();
      component.title.set('Zeugnis');
      component.storagePath.set('docs/zeugnis.pdf');

      component.submit();

      expect(component.form.error()).toBeTruthy();
    });
  });
});
