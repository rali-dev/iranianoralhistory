import { Component, signal, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoApiService } from '@iranianoralhistory/frontend-video-data-access';
import { IDocument } from '@iranianoralhistory/shared-contracts';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';
import { createFormState } from '@iranianoralhistory/frontend-shared-utils';

@Component({
  selector: 'lib-document-add-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-add-form.html',
  styleUrl: './document-add-form.css',
})
export class DocumentAddFormComponent {
  private readonly videoApi = inject(VideoApiService);
  readonly i18n = inject(I18nService);

  readonly videoId = input.required<string>();
  readonly documentAdded = output<IDocument>();

  title = signal('');
  storagePath = signal('');

  readonly form = createFormState();

  submit(): void {
    if (!this.title().trim() || !this.storagePath().trim()) {
      this.form.setError(this.i18n.t('ADMIN.DOC.ERR_REQUIRED'));
      return;
    }

    this.form.start();

    this.videoApi.addDocument(this.videoId(), {
      title: this.title().trim(),
      storagePath: this.storagePath().trim(),
    }).subscribe({
      next: (doc) => {
        this.form.setSuccess(this.i18n.t('ADMIN.DOC.SAVED', { title: doc.title }));
        this.documentAdded.emit(doc);
        this.title.set('');
        this.storagePath.set('');
      },
      error: (err) => {
        this.form.setError(err?.error?.message ?? this.i18n.t('ADMIN.DOC.ERR_SAVE'));
      },
    });
  }
}
