import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { contactMessageEmail, sellerReportEmail, sendMail } from '../mail/mailer';
import { listSupport, writeSupport } from '../common/support';
import { ContactDto, SellerReportDto } from './dto';

/** Where messages land. Overridable, with the published address as the default. */
const SUPPORT_INBOX = 'loopynowshopsupport@gmail.com';

@Injectable()
export class SupportService {
  private readonly log = new Logger('Support');

  constructor(private prisma: PrismaService) {}

  private inbox() {
    return (process.env.SUPPORT_EMAIL || SUPPORT_INBOX).trim();
  }

  /**
   * A message from the public contact form.
   *
   * Recorded before it is emailed, and that order matters: email can bounce,
   * be unconfigured, or land in spam, and a visitor's question that exists
   * only in a failed SMTP call is gone. The admin console reads the record, so
   * the message is safe whether or not the mail leaves.
   *
   * The sender's address is quoted in the mail body rather than set as From —
   * mail sent as a stranger fails this domain's SPF.
   */
  async contact(dto: ContactDto) {
    const id = await writeSupport(
      this.prisma,
      'contact',
      { subject: dto.subject, message: dto.message, from: dto.name, email: dto.email },
      { id: `visitor:${dto.email}`, email: dto.email },
    );

    const mail = contactMessageEmail(dto);
    const emailed = await sendMail(this.inbox(), mail.subject, mail.html, mail.text).catch(() => false);
    if (!emailed) {
      this.log.warn(`Contact message ${id} from ${dto.email} is logged but could not be emailed`);
    }

    return { sent: true, emailed, id, supportEmail: this.inbox() };
  }

  /**
   * A seller reporting a problem with the platform.
   *
   * Their store is attached so an operator can open the account without
   * asking who they are, and so the seller can see their own reports and
   * whether each has been dealt with.
   */
  async sellerReport(sellerId: string, dto: SellerReportDto) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { storeName: true, username: true, contactEmail: true, user: { select: { email: true } } },
    });
    const email = seller?.contactEmail || seller?.user?.email || null;

    const id = await writeSupport(
      this.prisma,
      'seller',
      {
        subject: dto.subject,
        message: dto.message,
        topic: dto.topic,
        from: seller?.storeName || 'A seller',
        email,
        sellerId,
      },
      { id: `seller:${sellerId}`, email },
    );

    const mail = sellerReportEmail({
      storeName: seller?.storeName || 'A seller',
      username: seller?.username || null,
      email,
      topic: dto.topic,
      subject: dto.subject,
      message: dto.message,
    });
    const emailed = await sendMail(this.inbox(), mail.subject, mail.html, mail.text).catch(() => false);
    if (!emailed) this.log.warn(`Seller report ${id} is logged but could not be emailed`);

    return { sent: true, emailed, id };
  }

  /** A seller's own reports, newest first, with whether each has been resolved. */
  async mySubmissions(sellerId: string) {
    const all = await listSupport(this.prisma, { take: 500 });
    return all.filter((m) => m.sellerId === sellerId).slice(0, 50);
  }
}
