import { Component, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollectionApiService } from '@iranianoralhistory/frontend-video-data-access';
import { ICollection } from '@iranianoralhistory/shared-contracts';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';
import {
  buildTranslation,
  buildOptionalTranslation,
  createFormState,
} from '@iranianoralhistory/frontend-shared-utils';

@Component({
  selector: 'lib-category-create-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-create-form.html',
  styleUrl: './category-create-form.css',
})
export class CategoryCreateFormComponent {
  private readonly collectionApi = inject(CollectionApiService);
  readonly i18n = inject(I18nService);

  readonly categoryCreated = output<ICollection>();

  slug = signal('');
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
      this.form.setError(this.i18n.t('ADMIN.CAT.ERR_REQUIRED'));
      return;
    }

    this.form.start();

    this.collectionApi.create({
      slug: this.slug().trim(),
      type: 'TOPIC',
      name: buildTranslation(this.nameDe(), this.nameEn(), this.nameFa()),
      description: buildOptionalTranslation(this.descDe(), this.descEn(), this.descFa()),
      sortOrder: this.sortOrder(),
    }).subscribe({
      next: (category) => {
        this.form.setSuccess(this.i18n.t('ADMIN.CAT.SAVED', { name: category.name.de }));
        this.categoryCreated.emit(category);
        this.resetForm();
      },
      error: (err) => {
        this.form.setError(err?.error?.message ?? this.i18n.t('ADMIN.CAT.ERR_SAVE'));
      },
    });
  }

  private resetForm(): void {
    this.slug.set('');
    this.nameDe.set('');
    this.nameEn.set('');
    this.nameFa.set('');
    this.descDe.set('');
    this.descEn.set('');
    this.descFa.set('');
    this.sortOrder.set(0);
  }
}
