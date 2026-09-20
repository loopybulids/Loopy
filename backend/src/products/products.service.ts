import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { imageBytes, restoreImages, withImageUrls } from '../common/product-images';

function shape(p: any) {
  return { ...p, images: safeParse(p.images), variants: safeParse(p.variants), sizes: safeParse(p.sizes) };
}
function safeParse(s: string): any[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
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
      // Public route: images travel as URLs, not as base64 in the response.
      ...withImageUrls(shape(product)),
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

  /** One stored image's bytes. Only `images` is read — the row can be large. */
  async image(id: string, index: number) {
    if (!Number.isInteger(index) || index < 0) return null;
    const row = await this.prisma.product.findUnique({ where: { id }, select: { images: true } });
    if (!row) return null;
    return imageBytes(safeParse(row.images), index);
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
        mrp: data.mrp !== undefined ? (data.mrp === null || data.mrp === '' ? null : Number(data.mrp)) : existing.mrp,
        condition: data.condition ?? existing.condition,
        category: data.category ?? existing.category,
        // URLs we served are mapped back to the images they stand for — see
        // common/product-images.restoreImages.
        images: data.images
          ? JSON.stringify(restoreImages(data.images, safeParse(existing.images)))
          : existing.images,
        variants: data.variants !== undefined ? JSON.stringify(data.variants || []) : existing.variants,
        sizes: data.sizes !== undefined ? JSON.stringify(data.sizes || []) : existing.sizes,
        sizeChartUrl: data.sizeChartUrl !== undefined ? (data.sizeChartUrl || null) : existing.sizeChartUrl,
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
        mrp: data.mrp ? Number(data.mrp) : null,
        condition: data.condition || 'Good',
        size: data.size,
        brand: data.brand,
        category: data.category || 'Apparel',
        images: JSON.stringify(data.images || []),
        variants: JSON.stringify(data.variants || []),
        sizes: JSON.stringify(data.sizes || []),
        sizeChartUrl: data.sizeChartUrl || null,
        quantity: data.quantity ?? 1,
      },
    });
    return shape(product);
  }
}
