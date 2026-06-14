import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=72`;

async function main() {
  console.log('🌱  Seeding Loopy...');

  // wipe (dev only)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.user.deleteMany();

  // --- demo seller ---
  const sellerUser = await prisma.user.create({
    data: {
      name: 'Riya',
      phone: '9876500210',
      email: 'riya@loopy.dev',
      role: 'seller',
    },
  });

  const seller = await prisma.seller.create({
    data: {
      userId: sellerUser.id,
      storeName: 'Riya’s Thrift Loop',
      username: 'riyathrifts',
      description: 'Curated one-of-one vintage & thrift, hand-picked in Mumbai.',
      bannerUrl: img('1445205170230-053b83016050'),
      logoUrl: img('1529139574466-a303027c1d8b'),
      rating: 4.9,
      ratingCount: 212,
      city: 'Mumbai',
      kycStatus: 'approved',
    },
  });

  const products = [
    { title: 'Y2K floral slip dress', price: 649, condition: 'Like new', size: 'M', brand: 'Zara', images: [img('1595777457583-95e059d581b8')] },
    { title: 'Vintage denim jacket', price: 899, condition: 'Good', size: 'L', brand: 'Levi’s', images: [img('1543076447-215ad9ba6923')] },
    { title: 'Cherry top-handle bag', price: 720, condition: 'Good', size: 'One size', brand: 'Vintage', images: [img('1584917865442-de89df76afd3')] },
    { title: 'Hand-knit pastel cape', price: 579, condition: 'Like new', size: 'S', brand: 'Handmade', images: [img('1434389677669-e08b4cac3105')] },
    { title: 'Floral cotton midi', price: 540, condition: 'Like new', size: 'M', brand: 'Mango', images: [img('1490481651871-ab68de25d43d')] },
    { title: 'Satin slip cami', price: 399, condition: 'Good', size: 'S', brand: '& Other Stories', images: [img('1483985988355-763728e1935b')] },
    { title: 'Corduroy mini skirt', price: 450, condition: 'Good', size: '28"', brand: 'Thrifted', images: [img('1551489186-cf8726f514f8')] },
    { title: 'Checked wool overshirt', price: 690, condition: 'Good', size: 'M', brand: 'Uniqlo', images: [img('1539109136881-3be0616acf4b')] },
  ];

  for (const p of products) {
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await prisma.product.create({
      data: {
        sellerId: seller.id,
        title: p.title,
        slug,
        description:
          'One-of-one curated piece. No major flaws — measured and photographed as-is. Styled and ready to loop into your wardrobe.',
        price: p.price,
        condition: p.condition,
        size: p.size,
        brand: p.brand,
        category: 'Apparel',
        images: JSON.stringify(p.images),
        quantity: 1,
      },
    });
  }

  // --- second seller, pending KYC (gives the admin queue something to review) ---
  const nehaUser = await prisma.user.create({
    data: { name: 'Neha', phone: '9811100222', email: 'neha@loopy.dev', role: 'seller' },
  });
  await prisma.seller.create({
    data: {
      userId: nehaUser.id,
      storeName: 'Neha Vintage',
      username: 'nehavintage',
      description: 'Vintage finds, carefully sourced.',
      city: 'Delhi',
      rating: 0,
      ratingCount: 0,
      kycStatus: 'pending',
    },
  });

  // --- a sample dispute so the admin console isn't empty ---
  await prisma.dispute.create({
    data: {
      orderId: 'demo-order',
      sellerId: seller.id,
      buyerName: 'Aman',
      issueType: 'Not as described',
      description: 'Dress has a tear near the hem that wasn’t shown in the photos.',
      status: 'open',
    },
  });

  // --- demo admin ---
  await prisma.user.create({
    data: { name: 'Ops Admin', phone: '9000000000', email: 'admin@loopy.dev', role: 'admin' },
  });

  console.log(`✅  Seeded store /s/${seller.username} with ${products.length} products`);
  console.log('   Seller login → phone 9876500210, OTP 0000');
  console.log('   Admin login  → phone 9000000000, OTP 0000');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
