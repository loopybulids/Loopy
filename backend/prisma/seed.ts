import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=72`;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function main() {
  console.log('🌱  Seeding Loopy...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.product.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.user.deleteMany();

  const stores = [
    {
      name: 'Riya', phone: '9876500210', email: 'riya@loopy.dev',
      storeName: 'The Vintage Loop', username: 'riyathrifts', city: 'Mumbai',
      desc: 'Curated 90s & Y2K aesthetics. One-of-one finds.', rating: 4.9, ratingCount: 12400,
      banner: '1445205170230-053b83016050', logo: '1529139574466-a303027c1d8b', kyc: 'approved',
      products: [
        { title: '90s Oversized Wool Blazer', price: 85 * 80, condition: 'Like new', size: 'M', brand: 'Vintage', images: ['1591047139829-d91aecb6caea'] },
        { title: 'High-Waist Vintage Levi’s', price: 64 * 80, condition: 'Good', size: 'L', brand: 'Levi’s', images: ['1542272604-787c3835535d'] },
        { title: 'Curation: 90s Gold Accessory Set', price: 45 * 80, condition: 'Good', size: 'One size', brand: 'Vintage', images: ['1611591437281-460bfbe1220a'] },
        { title: 'Cream Cable-Knit Sweater', price: 52 * 80, condition: 'Like new', size: 'S', brand: 'Handmade', images: ['1576566588028-4147f3842f27'] },
        { title: 'Y2K Floral Slip Dress', price: 649, condition: 'Like new', size: 'M', brand: 'Zara', images: ['1595777457583-95e059d581b8'] },
        { title: 'Vintage Denim Jacket', price: 899, condition: 'Good', size: 'L', brand: 'Levi’s', images: ['1543076447-215ad9ba6923'] },
      ],
    },
    {
      name: 'Kabir', phone: '9811100333', email: 'kabir@loopy.dev',
      storeName: 'Retro Velocity', username: 'retrovelocity', city: 'Bengaluru',
      desc: 'Pre-loved sneakers & street staples, authenticated.', rating: 4.8, ratingCount: 8200,
      banner: '1483985988355-763728e1935b', logo: '1492562080023-ab3db95bfbce', kyc: 'approved',
      products: [
        { title: 'Retro Velocity X1 Sneakers', price: 185 * 14, condition: 'Like new', size: 'UK 9', brand: 'Nike', images: ['1542291026-7eec264c27ff'] },
        { title: 'Classic Leather Boots', price: 2499, condition: 'Good', size: 'UK 8', brand: 'Red Tape', images: ['1520639888713-7851133b1eee'] },
        { title: 'Cherry Top-Handle Bag', price: 720, condition: 'Good', size: 'One size', brand: 'Vintage', images: ['1584917865442-de89df76afd3'] },
        { title: 'Checked Wool Overshirt', price: 690, condition: 'Good', size: 'M', brand: 'Uniqlo', images: ['1539109136881-3be0616acf4b'] },
      ],
    },
    {
      name: 'Ananya', phone: '9822200444', email: 'ananya@loopy.dev',
      storeName: 'Luxe Curates', username: 'luxecurates', city: 'Delhi',
      desc: 'Designer & luxury thrift, quality-checked.', rating: 4.9, ratingCount: 15600,
      banner: '1490481651871-ab68de25d43d', logo: '1438761681033-6461ffad8d80', kyc: 'approved',
      products: [
        { title: 'Hand-Knit Pastel Cape', price: 579, condition: 'Like new', size: 'S', brand: 'Handmade', images: ['1434389677669-e08b4cac3105'] },
        { title: 'Floral Cotton Midi', price: 540, condition: 'Like new', size: 'M', brand: 'Mango', images: ['1490481651871-ab68de25d43d'] },
        { title: 'Satin Slip Cami', price: 399, condition: 'Good', size: 'S', brand: '& Other Stories', images: ['1483985988355-763728e1935b'] },
        { title: 'Corduroy Mini Skirt', price: 450, condition: 'Good', size: '28"', brand: 'Thrifted', images: ['1551489186-cf8726f514f8'] },
      ],
    },
  ];

  let firstSellerId = '';
  for (const s of stores) {
    const user = await prisma.user.create({ data: { name: s.name, phone: s.phone, email: s.email, role: 'seller' } });
    const seller = await prisma.seller.create({
      data: {
        userId: user.id, storeName: s.storeName, username: s.username, description: s.desc,
        bannerUrl: img(s.banner), logoUrl: img(s.logo), rating: s.rating, ratingCount: s.ratingCount,
        city: s.city, kycStatus: s.kyc,
      },
    });
    if (!firstSellerId) firstSellerId = seller.id;
    for (const p of s.products) {
      await prisma.product.create({
        data: {
          sellerId: seller.id, title: p.title, slug: slugify(p.title),
          description: 'One-of-one curated piece. No major flaws — measured and photographed as-is. Held in Loopy Escrow until you confirm delivery.',
          price: p.price, condition: p.condition, size: p.size, brand: p.brand, category: 'Apparel',
          images: JSON.stringify(p.images.map(img)), quantity: 1,
        },
      });
    }
  }

  // pending-KYC store for the admin queue
  const nehaUser = await prisma.user.create({ data: { name: 'Neha', phone: '9833300555', email: 'neha@loopy.dev', role: 'seller' } });
  await prisma.seller.create({ data: { userId: nehaUser.id, storeName: 'Neha Vintage', username: 'nehavintage', description: 'Vintage finds, carefully sourced.', city: 'Pune', rating: 0, ratingCount: 0, kycStatus: 'pending' } });

  // sample dispute
  await prisma.dispute.create({ data: { orderId: 'demo-order', sellerId: firstSellerId, buyerName: 'Aman', issueType: 'Not as described', description: 'Item has a tear near the hem that wasn’t shown in the photos.', status: 'open' } });

  // admin
  await prisma.user.create({ data: { name: 'Ops Admin', phone: '9000000000', email: 'admin@loopy.dev', role: 'admin' } });

  console.log(`✅  Seeded ${stores.length} stores + 1 pending`);
  console.log('   Seller login → phone 9876500210, OTP 0000');
  console.log('   Admin login  → phone 9000000000, OTP 0000');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
