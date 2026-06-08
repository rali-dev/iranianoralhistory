import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { User } from '@iranianoralhistory/types';

@Injectable({
  providedIn: 'root',
})
export class DataAccessService {
  userResource = httpResource<User>(() => '/api');
}
