import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.products.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.products.create(req.user.sellerId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.products.update(req.user.sellerId, id, dto);
  }
}
