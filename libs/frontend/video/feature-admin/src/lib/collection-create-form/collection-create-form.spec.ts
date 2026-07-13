import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CollectionCreateFormComponent } from './collection-create-form';
import { CollectionApiService } from '@iranianoralhistory/frontend-video-data-access';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

function buildCollection() {
  return {
    id: 'col-uuid',
    slug: 'person-ali',
    type: 'PERSON' as const,
    name: { de: 'Ali', en: 'Ali', fa: 'علی' },
    description: null,
    sortOrder: 0,
  };
}

const mockCollectionApi: Partial<CollectionApiService> = { create: jest.fn() };
const mockI18n = { t: jest.fn().mockImplementation((key: string) => key), lang: jest.fn().mockReturnValue('de') };

async function createComponent() {
  await TestBed.configureTestingModule({
    imports: [CollectionCreateFormComponent],
    providers: [
      { provide: CollectionApiService, useValue: mockCollectionApi },
      { provide: I18nService,          useValue: mockI18n },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CollectionCreateFormComponent);
  return { fixture, component: fixture.componentInstance };
}

describe('CollectionCreateFormComponent', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('submit() — validation', () => {
    it('sets form error when required fields are missing', async () => {
      const { component } = await createComponent();

      component.submit();

      expect(mockCollectionApi.create).not.toHaveBeenCalled();
      expect(component.form.error()).toBeTruthy();
    });
  });

  describe('submit() — success path', () => {
    it('calls collectionApi.create with the correct DTO', async () => {
      (mockCollectionApi.create as jest.Mock).mockReturnValue(of(buildCollection()));
      const { component } = await createComponent();
      component.slug.set('person-ali');
      component.nameDe.set('Ali');
      component.nameEn.set('Ali');
      component.nameFa.set('علی');
      component.type.set('PERSON');

      component.submit();

      expect(mockCollectionApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'person-ali',
          type: 'PERSON',
          name: { de: 'Ali', en: 'Ali', fa: 'علی' },
        }),
      );
    });

    it('uses fixedType input over the type signal when provided', async () => {
      (mockCollectionApi.create as jest.Mock).mockReturnValue(of(buildCollection()));
      const { component } = await createComponent();
      component.slug.set('person-ali');
      component.nameDe.set('Ali');
      component.nameEn.set('Ali');
      component.nameFa.set('علی');
      TestBed.runInInjectionContext(() => {
        Object.defineProperty(component, 'fixedType', { value: () => 'TOPIC' });
      });

      component.submit();

      expect(mockCollectionApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TOPIC' }),
      );
    });

    it('emits collectionCreated with the returned collection', async () => {
      const col = buildCollection();
      (mockCollectionApi.create as jest.Mock).mockReturnValue(of(col));
      const { component } = await createComponent();
      component.slug.set('person-ali');
      component.nameDe.set('Ali');
      component.nameEn.set('Ali');
      component.nameFa.set('علی');

      const emitted: unknown[] = [];
      component.collectionCreated.subscribe((c) => emitted.push(c));
      component.submit();

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual(col);
    });

    it('resets all fields after success', async () => {
      (mockCollectionApi.create as jest.Mock).mockReturnValue(of(buildCollection()));
      const { component } = await createComponent();
      component.slug.set('person-ali');
      component.nameDe.set('Ali');
      component.nameEn.set('Ali');
      component.nameFa.set('علی');

      component.submit();

      expect(component.slug()).toBe('');
      expect(component.nameDe()).toBe('');
    });
  });

  describe('submit() — error path', () => {
    it('sets form error on API failure', async () => {
      (mockCollectionApi.create as jest.Mock).mockReturnValue(
        throwError(() => ({ error: { message: 'Conflict' } })),
      );
      const { component } = await createComponent();
      component.slug.set('person-ali');
      component.nameDe.set('Ali');
      component.nameEn.set('Ali');
      component.nameFa.set('علی');

      component.submit();

      expect(component.form.error()).toBeTruthy();
    });

    it('falls back to the i18n ERR_SAVE key when the error has no message', async () => {
      (mockCollectionApi.create as jest.Mock).mockReturnValue(throwError(() => ({})));
      const { component } = await createComponent();
      component.slug.set('person-ali');
      component.nameDe.set('Ali');
      component.nameEn.set('Ali');
      component.nameFa.set('علی');

      component.submit();

      expect(component.form.error()).toBe('ADMIN.COL.ERR_SAVE');
      expect(mockI18n.t).toHaveBeenCalledWith('ADMIN.COL.ERR_SAVE');
    });
  });
});
