import { Component, signal, inject, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollectionApiService } from '@iranianoralhistory/frontend-video-data-access';
import { ICollection, CollectionType } from '@iranianoralhistory/shared-contracts';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';
import {
  buildTranslation,
  buildOptionalTranslation,
  createFormState,
} from '@iranianoralhistory/frontend-shared-utils';

@Component({
  selector: 'lib-collection-create-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collection-create-form.html',
  styleUrl: './collection-create-form.css',
})
export class CollectionCreateFormComponent {
  private readonly collectionApi = inject(CollectionApiService);
  readonly i18n = inject(I18nService);

  readonly fixedType = input<CollectionType | undefined>(undefined);
  readonly collectionCreated = output<ICollection>();

  slug = signal('');
  type = signal<CollectionType>('PERSON');
  nameDe = signal('');
  nameEn = signal('');
  nameFa = signal('');
  descDe = signal('');
  descEn = signal('');
  descFa = signal('');
  sortOrder = signal(0);

  readonly form = createFormState();

  submit(): void {
    if (!this.slug().trim() || !this.nameDe().trim() || !this.nameEn().trim() || !this.nameFa().trim()) {
      this.form.setError(this.i18n.t('ADMIN.COL.ERR_REQUIRED'));
      return;
    }

    this.form.start();

    this.collectionApi.create({
      slug: this.slug().trim(),
      type: this.fixedType() ?? this.type(),
      name: buildTranslation(this.nameDe(), this.nameEn(), this.nameFa()),
      description: buildOptionalTranslation(this.descDe(), this.descEn(), this.descFa()),
      sortOrder: this.sortOrder(),
    }).subscribe({
      next: (collection) => {
        this.form.setSuccess(this.i18n.t('ADMIN.COL.SAVED', { name: collection.name.de }));
        this.collectionCreated.emit(collection);
        this.resetForm();
      },
      error: (err) => {
        this.form.setError(err?.error?.message ?? this.i18n.t('ADMIN.COL.ERR_SAVE'));
      },
    });
  }

  private resetForm(): void {
    this.slug.set('');
    this.type.set('PERSON');
    this.nameDe.set('');
    this.nameEn.set('');
    this.nameFa.set('');
    this.descDe.set('');
    this.descEn.set('');
    this.descFa.set('');
    this.sortOrder.set(0);
  }
}
