import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataAccessService } from '@iranianoralhistory/data-access';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = 'frontend';
  private readonly dataAccessService = inject(DataAccessService);
  protected readonly userResource = this.dataAccessService.userResource;
}
