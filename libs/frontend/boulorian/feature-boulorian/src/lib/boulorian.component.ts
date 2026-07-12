import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

@Component({
  selector: 'lib-boulorian',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './boulorian.component.html',
})
export class BoulorianComponent {
  readonly i18n = inject(I18nService);
}
