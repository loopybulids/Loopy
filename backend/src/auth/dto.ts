import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(2, 60)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @Length(2, 60)
  storeName: string;

  @IsOptional()
  @IsString()
  username?: string;
}

export class EmailLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RequestOtpDto {
  @IsString()
  @Length(10, 10)
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @Length(10, 10)
  phone: string;

  @IsString()
  @Length(4, 4)
  code: string;

  @IsOptional()
  @IsString()
  name?: string;
}
