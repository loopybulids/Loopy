import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function shape(p: any) {
  return { ...p, images: safeParse(p.images) };
}
function safeParse(s: string): string[] {
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { seller: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return {
      ...shape(product),
      seller: {
        id: product.seller.id,
        storeName: product.seller.storeName,
        username: product.seller.username,
        rating: product.seller.rating,
        ratingCount: product.seller.ratingCount,
        city: product.seller.city,
        kycStatus: product.seller.kycStatus,
      },
    };
  }

  async update(sellerId: string, id: string, data: any) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || existing.sellerId !== sellerId) throw new NotFoundException('Product not found');
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        description: data.description ?? existing.description,
        price: data.price != null ? Number(data.price) : existing.price,
        condition: data.condition ?? existing.condition,
        category: data.category ?? existing.category,
        images: data.images ? JSON.stringify(data.images) : existing.images,
        quantity: data.quantity != null ? Number(data.quantity) : existing.quantity,
        isActive: data.isActive != null ? Boolean(data.isActive) : existing.isActive,
        brand: data.brand ?? existing.brand,
        size: data.size ?? existing.size,
      },
    });
    return shape(product);
  }

  async create(sellerId: string, data: any) {
    const slug = String(data.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const product = await this.prisma.product.create({
      data: {
        sellerId,
        title: data.title,
        slug,
        description: data.description || '',
        price: Number(data.price),
        condition: data.condition || 'Good',
        size: data.size,
        brand: data.brand,
        category: data.category || 'Apparel',
        images: JSON.stringify(data.images || []),
        quantity: data.quantity ?? 1,
      },
    });
    return shape(product);
  }
}
