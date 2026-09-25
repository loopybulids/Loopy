import { Body, Controller, Get, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { IMAGE_CACHE_CONTROL } from '../common/product-images';
import { CreateProductDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SellerGuard } from '../auth/seller.guard';

@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.products.findOne(id);
  }

  /**
   * One product image, as bytes.
   *
   * Public and unauthenticated, like the storefront it serves. The URL carries
   * a digest of the image, so the response is cached forever — see
   * common/product-images for why that is safe and why this exists at all.
   */
  @Get(':id/image/:index')
  async image(
    @Param('id') id: string,
    @Param('index') index: string,
    @Res() res: Response,
  ) {
    const img = await this.products.image(id, index);
    if (!img) {
      res.status(404).json({ message: 'Image not found' });
      return;
    }
    res.setHeader('Content-Type', img.type);
    res.setHeader('Cache-Control', IMAGE_CACHE_CONTROL);
    res.send(img.body);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.products.create(req.user.sellerId, dto);
  }

  @UseGuards(JwtAuthGuard, SellerGuard)
  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.products.update(req.user.sellerId, id, dto);
  }
}
