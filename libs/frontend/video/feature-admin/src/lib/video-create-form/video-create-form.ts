import { Component, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoApiService } from '@iranianoralhistory/frontend-video-data-access';
import { IVideo } from '@iranianoralhistory/shared-contracts';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';
import {
  buildTranslation,
  buildOptionalTranslation,
  createFormState,
} from '@iranianoralhistory/frontend-shared-utils';

@Component({
  selector: 'lib-video-create-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-create-form.html',
  styleUrl: './video-create-form.css',
})
export class VideoCreateFormComponent {
  private readonly videoApi = inject(VideoApiService);
  readonly i18n = inject(I18nService);

  readonly videoCreated = output<IVideo>();

  vimeoId = signal('');
  titleDe = signal('');
  titleEn = signal('');
  titleFa = signal('');
  descDe = signal('');
  descEn = signal('');
  descFa = signal('');

  readonly form = createFormState();

  submit(): void {
    if (!this.vimeoId().trim() || !this.titleDe().trim() || !this.titleEn().trim() || !this.titleFa().trim()) {
      this.form.setError(this.i18n.t('ADMIN.VIDEO.ERR_REQUIRED'));
      return;
    }

    this.form.start();

    this.videoApi.create({
      vimeoId: this.vimeoId().trim(),
      title: buildTranslation(this.titleDe(), this.titleEn(), this.titleFa()),
      description: buildOptionalTranslation(this.descDe(), this.descEn(), this.descFa()),
    }).subscribe({
      next: (video) => {
        this.form.setSuccess(this.i18n.t('ADMIN.VIDEO.SAVED', { id: video.id }));
        this.videoCreated.emit(video);
        this.resetForm();
      },
      error: (err) => {
        this.form.setError(err?.error?.message ?? this.i18n.t('ADMIN.VIDEO.ERR_SAVE'));
      },
    });
  }

  private resetForm(): void {
    this.vimeoId.set('');
    this.titleDe.set('');
    this.titleEn.set('');
    this.titleFa.set('');
    this.descDe.set('');
    this.descEn.set('');
    this.descFa.set('');
  }
}
