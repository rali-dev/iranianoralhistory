import { Injectable } from '@nestjs/common';
import { User } from '@iranianoralhistory/types';
@Injectable()
export class AppService {
  getData(): User {
    return { 
      id: '1', 
      name: 'John Doe', 
      email: 'john.doe@example.com', 
      password: 'password' };
  }
}
