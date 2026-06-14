import { IsOptional, IsString, Length } from 'class-validator';

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
