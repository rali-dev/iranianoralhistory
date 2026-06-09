import { IsNotEmpty, IsString, IsEmail, Length } from 'class-validator';

export class AuthDto {
  @IsNotEmpty()
  @IsEmail()
  public email!: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 20, { message: 'Password must be between 8 and 20 characters' })
  public password!: string;
}
