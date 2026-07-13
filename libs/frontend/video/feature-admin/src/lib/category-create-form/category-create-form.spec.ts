import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CategoryCreateFormComponent } from './category-create-form';
import { CollectionApiService } from '@iranianoralhistory/frontend-video-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

function buildCategory() {
  return {
    id: 'cat-uuid',
    slug: 'topic-exile',
    type: 'TOPIC' as const,
    name: { de: 'Exil', en: 'Exile', fa: 'تبعید' },
    description: null,
    sortOrder: 0,
  };
}

const mockCollectionApi: Partial<CollectionApiService> = { create: jest.fn() };
const mockI18n = { t: jest.fn().mockImplementation((key: string) => key), lang: jest.fn().mockReturnValue('de') };

async function createComponent() {
  await TestBed.configureTestingModule({
    imports: [CategoryCreateFormComponent],
    providers: [
      { provide: CollectionApiService, useValue: mockCollectionApi },
      { provide: I18nService,          useValue: mockI18n },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CategoryCreateFormComponent);
  return { fixture, component: fixture.componentInstance };
}

describe('CategoryCreateFormComponent', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('submit() — validation', () => {
    it('sets form error when slug is empty', async () => {
      const { component } = await createComponent();
      component.nameDe.set('Exil');
      component.nameEn.set('Exile');
      component.nameFa.set('تبعید');

      component.submit();

      expect(mockCollectionApi.create).not.toHaveBeenCalled();
      expect(component.form.error()).toBeTruthy();
    });
  });

  describe('submit() — success path', () => {
    it('always sends type=TOPIC regardless of other inputs', async () => {
      (mockCollectionApi.create as jest.Mock).mockReturnValue(of(buildCategory()));
      const { component } = await createComponent();
      component.slug.set('topic-exile');
      component.nameDe.set('Exil');
      component.nameEn.set('Exile');
      component.nameFa.set('تبعید');

      component.submit();

      expect(mockCollectionApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TOPIC' }),
      );
    });

    it('emits categoryCreated with the returned collection', async () => {
      const cat = buildCategory();
      (mockCollectionApi.create as jest.Mock).mockReturnValue(of(cat));
      const { component } = await createComponent();
      component.slug.set('topic-exile');
      component.nameDe.set('Exil');
      component.nameEn.set('Exile');
      component.nameFa.set('تبعید');

      const emitted: unknown[] = [];
      component.categoryCreated.subscribe((c) => emitted.push(c));
      component.submit();

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual(cat);
    });

    it('resets all fields after success', async () => {
      (mockCollectionApi.create as jest.Mock).mockReturnValue(of(buildCategory()));
      const { component } = await createComponent();
      component.slug.set('topic-exile');
      component.nameDe.set('Exil');
      component.nameEn.set('Exile');
      component.nameFa.set('تبعید');

      component.submit();

      expect(component.slug()).toBe('');
      expect(component.nameDe()).toBe('');
    });
  });

  describe('submit() — error path', () => {
    it('sets form error when the API call fails', async () => {
      (mockCollectionApi.create as jest.Mock).mockReturnValue(
        throwError(() => ({ error: { message: 'Slug taken' } })),
      );
      const { component } = await createComponent();
      component.slug.set('topic-exile');
      component.nameDe.set('Exil');
      component.nameEn.set('Exile');
      component.nameFa.set('تبعید');

      component.submit();

      expect(component.form.error()).toBeTruthy();
    });

    it('falls back to the i18n ERR_SAVE key when the error has no message', async () => {
      (mockCollectionApi.create as jest.Mock).mockReturnValue(throwError(() => ({})));
      const { component } = await createComponent();
      component.slug.set('topic-exile');
      component.nameDe.set('Exil');
      component.nameEn.set('Exile');
      component.nameFa.set('تبعید');

      component.submit();

      expect(component.form.error()).toBe('ADMIN.CAT.ERR_SAVE');
      expect(mockI18n.t).toHaveBeenCalledWith('ADMIN.CAT.ERR_SAVE');
    });
  });
});
