import { IsEmail, IsIn, IsString, Length } from 'class-validator';
import { SELLER_TOPICS } from '../common/support';

export class ContactDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(2, 120)
  subject: string;

  // Long enough to be a question, short enough not to be a payload.
  @IsString()
  @Length(10, 2000)
  message: string;
}

export class SellerReportDto {
  @IsIn(SELLER_TOPICS as unknown as string[])
  topic: string;

  @IsString()
  @Length(2, 120)
  subject: string;

  @IsString()
  @Length(10, 2000)
  message: string;
}
