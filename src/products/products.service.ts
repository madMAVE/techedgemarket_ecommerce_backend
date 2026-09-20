import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { UploadsService } from "../common/uploads/uploads.service";
import { CreateProductDto, UpdateProductDto, BulkProductItemDto } from "../common/dto/product.dto";
import { extname } from "path";
import { randomUUID } from "crypto";
import { Pool } from "pg";

const BRAND_SIMILARITY_THRESHOLD = 0.85;

/**
 * Normalize keywords: split by both commas and semicolons,
 * trim whitespace, remove empty strings and junk values.
 */
function normalizeKeywords(keywords: string[] | null | undefined): string[] {
  if (!keywords || keywords.length === 0) return [];
  return keywords
    .flatMap(kw => kw.split(/[;,]/))
    .map(w => w.trim())
    .filter(w => w.length > 0 && w !== "[object Object]");
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private uploadsService: UploadsService,
  ) {}

  async findAllBrands() {
    const brands = await this.prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return brands;
  }

  async updateBrand(id: string, dto: { name?: string; description?: string }) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return this.prisma.brand.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async uploadBrandLogo(id: string, file: Express.Multer.File) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    const ext = extname(file.originalname);
    const customFileName = `${id}-logo`;
    const uploadResult = await this.uploadsService.uploadFile(file, "brands", undefined, customFileName);
    return this.prisma.brand.update({
      where: { id },
      data: { logo: uploadResult.publicUrl },
    });
  }

  async deleteBrand(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    const productCount = await this.prisma.product.count({ where: { brandId: id } });
    if (productCount > 0) {
      throw new BadRequestException(`Cannot delete brand "${brand.name}" — it has ${productCount} product(s). Delete or reassign products first.`);
    }
    await this.prisma.brand.delete({ where: { id } });
    return { message: `Brand "${brand.name}" deleted` };
  }

  async findAll(query: { page?: string; limit?: string; keyword?: string; sort?: string; order?: string; category?: string; brand?: string }) {
    const where: Record<string, unknown> = {};

    if (query.category) {
      where.category = query.category;
    }
    if (query.brand) {
      where.brand = { name: { equals: query.brand, mode: "insensitive" as const } };
    }
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword, mode: "insensitive" as const } },
        { brand: { name: { contains: query.keyword, mode: "insensitive" as const } } },
        { partNumber: { contains: query.keyword, mode: "insensitive" as const } },
        { model: { contains: query.keyword, mode: "insensitive" as const } },
        { sku: { contains: query.keyword, mode: "insensitive" as const } },
        { keywords: { some: { word: { contains: query.keyword, mode: "insensitive" as const } } } },
      ];
      await this.prisma.keyword.updateMany({
        where: { word: { contains: query.keyword, mode: "insensitive" as const } },
        data: { score: { increment: 1 } },
      });
    }

    this.logger.debug(`findAll where clause: ${JSON.stringify(where)}`);

    const sortField = query.sort || "createdAt";
    const sortOrder = query.order === "desc" ? "desc" : "asc";

    const page = Math.max(1, parseInt(query.page ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10)));

    try {
      const [items, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortField]: sortOrder },
          include: { brand: true, keywords: true },
        }),
        this.prisma.product.count({ where }),
      ]);

      // Log the specific product's data
      const testProduct = items.find((i: { id: string }) => i.id === "e57cc003-e0eb-456f-8289-16348df656c3");
      if (testProduct) {
        console.log(`[findAll] Product e57cc003 in results - image: "${testProduct.image}", images: ${JSON.stringify(testProduct.images)}`);
      }

      // Also check directly with raw SQL
      const rawCheck = await this.prisma.$queryRaw`SELECT id, image, images FROM products WHERE id = 'e57cc003-e0eb-456f-8289-16348df656c3'`;
      console.log(`[findAll] Raw SQL check for e57cc003: ${JSON.stringify(rawCheck)}`);

      // Also check with shared pg pool
      const { rows } = await this.prisma.pool.query(`SELECT id, image, images FROM products WHERE id = $1`, ['e57cc003-e0eb-456f-8289-16348df656c3']);
      console.log(`[findAll] Shared pg pool check: ${JSON.stringify(rows)}`);

      this.logger.log(`findAll returned ${items.length} items (total: ${total})`);

      return {
        items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (err) {
      this.logger.error(`findAll error: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async suggestKeywords(q: string, limit?: string) {
    const max = Math.min(20, Math.max(1, parseInt(limit ?? "10", 10)));
    const keywords = await this.prisma.keyword.findMany({
      where: { word: { startsWith: q, mode: "insensitive" as const } },
      orderBy: [{ score: "desc" }, { word: "asc" }],
      take: max,
      select: { word: true, score: true },
    });
    return { suggestions: keywords };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { brand: true, keywords: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findBySku(sku: string) {
    return this.prisma.product.findUnique({
      where: { sku },
      include: { brand: true, keywords: true },
    });
  }

  private async resolveBrandId(brandName: string): Promise<string> {
    const existing = await this.prisma.brand.findFirst({
      where: { name: { equals: brandName, mode: "insensitive" } },
    });
    if (existing) return existing.id;

    const allBrands = await this.prisma.brand.findMany({ select: { name: true } });
    for (const b of allBrands) {
      if (similarity(brandName.toLowerCase(), b.name.toLowerCase()) >= BRAND_SIMILARITY_THRESHOLD) {
        throw new BadRequestException(
          `Brand "${brandName}" is too similar to existing brand "${b.name}". Did you mean "${b.name}"?`,
        );
      }
    }

    const brand = await this.prisma.brand.create({ data: { name: brandName } });
    return brand.id;
  }

  private generateSKU(name: string, brandName: string): string {
    const nameInitials = name.split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").join("");
    const brandInitial = brandName[0]?.toUpperCase() ?? "";
    const uuid = randomUUID();
    return `${nameInitials}-${brandInitial}-${uuid}`;
  }

  async create(dto: CreateProductDto) {
    const brandId = await this.resolveBrandId(dto.brand);
    const sku = this.generateSKU(dto.name, dto.brand);
    const normalizedKeywords = normalizeKeywords(dto.keywords);
    const keywordConnections = normalizedKeywords.length
      ? {
          connectOrCreate: normalizedKeywords.map((word: string) => ({
            where: { word },
            create: { word },
          })),
        }
      : undefined;

    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        originalPrice: dto.originalPrice ?? null,
        category: dto.category,
        subcategory: dto.subcategory ?? null,
        brandId,
        model: dto.model ?? "",
        partNumber: dto.partNumber ?? "",
        sku,
        image: dto.image ?? "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
        images: dto.images ?? [],
        stock: dto.stock ?? 0,
        leadTime: dto.leadTime ?? "2-3 days",
        featured: dto.featured ?? false,
        badge: dto.badge ?? null,
        specs: dto.specs ?? {},
        isActive: dto.isActive ?? true,
        rating: 4.5,
        ...(keywordConnections && { keywords: keywordConnections }),
      },
      include: { brand: true, keywords: true },
    });
  }

  async bulkCreate(items: BulkProductItemDto[]) {
    this.logger.log(`Bulk upload received: ${items.length} items`);
    this.logger.debug(`Brands: ${[...new Set(items.map(i => i.brand))].join(", ")}`);

    if (items.length === 0) {
      throw new BadRequestException("Product list cannot be empty");
    }
    if (items.length > 500) {
      throw new BadRequestException("Maximum 500 products per bulk upload");
    }

    const brandNames = [...new Set(items.map(i => i.brand))];
    const brands = await this.prisma.brand.findMany({
      where: { name: { in: brandNames, mode: "insensitive" as const } },
    });
    const brandMap = new Map(brands.map((b: { name: string; id: string }) => [b.name.toLowerCase(), b.id]));

    const missingBrands = brandNames.filter(n => !brandMap.has(n.toLowerCase()));
    if (missingBrands.length > 0) {
      const allBrands = await this.prisma.brand.findMany({ select: { name: true } });
      for (const missing of missingBrands) {
        for (const b of allBrands) {
          if (similarity(missing.toLowerCase(), b.name.toLowerCase()) >= BRAND_SIMILARITY_THRESHOLD) {
            throw new BadRequestException(
              `Brand "${missing}" is too similar to existing brand "${b.name}". Did you mean "${b.name}"?`,
            );
          }
        }
      }
      const newBrands = await this.prisma.brand.createManyAndReturn({
        data: missingBrands.map(n => ({ name: n })),
        select: { id: true, name: true },
      });
      for (const b of newBrands) {
        brandMap.set(b.name.toLowerCase(), b.id);
      }
    }

    const created: { id: string; name: string; sku: string }[] = [];
    const errors: { index: number; error: string }[] = [];

    const batchSize = 20;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (item, batchIdx) => {
          const globalIdx = i + batchIdx;
          const brandId = brandMap.get(item.brand.toLowerCase())!;
          const sku = this.generateSKU(item.name, item.brand);
          const normalizedKeywords = normalizeKeywords(item.keywords);
          const keywordConnections = normalizedKeywords.length
            ? {
                connectOrCreate: normalizedKeywords.map((word: string) => ({
                  where: { word },
                  create: { word },
                })),
              }
            : undefined;

          const product = await this.prisma.product.create({
            data: {
              name: item.name,
              description: item.description,
              price: item.price,
              originalPrice: item.originalPrice ?? null,
              category: item.category,
              subcategory: item.subcategory ?? null,
              brandId,
              model: item.model ?? "",
              partNumber: item.partNumber ?? "",
              sku,
              image: item.image ?? "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
              images: item.images ?? [],
              stock: item.stock ?? 0,
              leadTime: item.leadTime ?? "2-3 days",
              featured: item.featured ?? false,
              badge: item.badge ?? null,
              specs: (item.specs ?? {}) as object,
              isActive: item.isActive ?? true,
              rating: 4.5,
              ...(keywordConnections && { keywords: keywordConnections }),
            },
            select: { id: true, name: true, sku: true },
          });
          return { globalIdx, product };
        }),
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const globalIdx = i + j;
        if (result.status === "fulfilled") {
          created.push(result.value.product);
        } else {
          const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
          this.logger.error(`Bulk item[${globalIdx}] failed: ${message}`);
          errors.push({ index: globalIdx, error: message });
        }
      }
    }

    this.logger.log(`Bulk upload complete: ${created.length} succeeded, ${errors.length} failed`);
    return { created, errors, total: items.length, successCount: created.length, failureCount: errors.length };
  }

  async uploadImages(productId: string, files: Express.Multer.File[]) {
    const pool = this.prisma.pool;

    // Check for triggers on the products table
    const { rows: triggers } = await pool.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'products'
    `);
    console.log(`[Product Upload] Product ID: ${productId} - Triggers on products table: ${JSON.stringify(triggers)}`);

    // Check initial state
    const { rows: initialRows } = await pool.query(`SELECT image, images FROM products WHERE id = $1`, [productId]);
    console.log(`[Product Upload] Product ID: ${productId} - Initial state (raw pg): ${JSON.stringify(initialRows)}`);

    if (initialRows.length === 0) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const product = initialRows[0];
    const shouldSetCover = !product.image || (product.images as string[]).length === 0;
    console.log(`[Product Upload] Product ID: ${productId} - Should set cover: ${shouldSetCover}`);

    const uploadResults = await this.uploadsService.uploadFiles(files, "products");
    const imageUrls = uploadResults.map((r) => r.publicUrl);

    console.log(`[Product Upload] Product ID: ${productId} - URLs extracted: ${JSON.stringify(imageUrls)}`);

    const currentImages = product.images as string[];
    const newImages = [...currentImages, ...imageUrls];
    const coverImage = shouldSetCover ? imageUrls[0] : product.image;

    // Use explicit transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE products SET image = $1, images = $2::text[] WHERE id = $3`,
        [coverImage, newImages, productId]
      );
      console.log(`[Product Upload] Product ID: ${productId} - UPDATE executed in transaction`);

      // Verify inside transaction
      const { rows: inTxRows } = await client.query(`SELECT image, images FROM products WHERE id = $1`, [productId]);
      console.log(`[Product Upload] Product ID: ${productId} - Inside transaction: ${JSON.stringify(inTxRows)}`);

      await client.query('COMMIT');
      console.log(`[Product Upload] Product ID: ${productId} - Transaction committed`);

      // Verify after commit on same connection
      const { rows: postCommitRows } = await client.query(`SELECT image, images FROM products WHERE id = $1`, [productId]);
      console.log(`[Product Upload] Product ID: ${productId} - After commit (same connection): ${JSON.stringify(postCommitRows)}`);
    } finally {
      client.release();
    }

    // Verify via pool (different connection)
    const { rows: poolVerify } = await pool.query(`SELECT image, images FROM products WHERE id = $1`, [productId]);
    console.log(`[Product Upload] Product ID: ${productId} - Pool verify (different connection): ${JSON.stringify(poolVerify)}`);

    // Prisma read
    const prismaRead = await this.prisma.product.findUnique({ where: { id: productId } });
    console.log(`[Product Upload] Product ID: ${productId} - Prisma findUnique: image: "${prismaRead?.image}", images: ${JSON.stringify(prismaRead?.images)}`);

    // Delayed verification to catch async reversion
    await new Promise(resolve => setTimeout(resolve, 2000));
    const { rows: delayedVerify } = await pool.query(`SELECT image, images FROM products WHERE id = $1`, [productId]);
    console.log(`[Product Upload] Product ID: ${productId} - 2s delayed verify: ${JSON.stringify(delayedVerify)}`);

    return { message: `${imageUrls.length} image(s) uploaded`, uploaded: imageUrls, product: prismaRead! };
  }

  async deleteImage(productId: string, imageUrl: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const currentImages = (product.images as string[]) || [];
    const foundInDb = currentImages.includes(imageUrl);

    let deletedFromStorage = false;
    const fileName = this.uploadsService.extractFileNameFromUrl(imageUrl);

    if (fileName) {
      try {
        await this.uploadsService.deleteFile(fileName);
        deletedFromStorage = true;
      } catch {
        this.logger.warn(`File not found in Supabase storage: ${fileName}, removing from DB only`);
      }
    }

    const updatedImages = foundInDb
      ? currentImages.filter((img) => img !== imageUrl)
      : currentImages;

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { images: updatedImages },
      include: { brand: true, keywords: true },
    });

    return {
      message: foundInDb
        ? `Image deleted${deletedFromStorage ? " from storage and database" : " from database only"}`
        : `Image not found in database, but attempted storage cleanup${deletedFromStorage ? " — file deleted from storage" : ""}`,
      deletedFromStorage,
      foundInDatabase: foundInDb,
      product: updated,
    };
  }

  async update(id: string, dto: UpdateProductDto) {
    const { keywords, brand, images, image, ...rest } = dto;
    console.log(`[Product Update] Product ID: ${id} - Received DTO image: "${image}", images: ${JSON.stringify(images)}`);
    const data: Record<string, unknown> = { ...rest };

    if (brand) {
      data.brandId = await this.resolveBrandId(brand);
    }

    if (keywords) {
      const normalizedKeywords = normalizeKeywords(keywords);
      data.keywords = {
        set: [],
        connectOrCreate: normalizedKeywords.map((word: string) => ({
          where: { word },
          create: { word },
        })),
      };
    }

    if (image !== undefined) {
      data.image = image;
    }

    if (images !== undefined) {
      data.images = { set: images };
    }

    try {
      console.log(`[Product Update] Product ID: ${id} - Final data object: image="${data.image}", images=${JSON.stringify(data.images)}`);
      return await this.prisma.product.update({
        where: { id },
        data,
        include: { brand: true, keywords: true },
      });
    } catch {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const orderItemCount = await this.prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      throw new BadRequestException(`Cannot delete product "${product.name}" — it has ${orderItemCount} order item(s). Remove associated orders first.`);
    }

    const inventoryExists = await this.prisma.inventory.findUnique({ where: { productId: id } });
    if (inventoryExists) {
      await this.prisma.inventory.delete({ where: { productId: id } });
    }

    try {
      await this.prisma.product.delete({ where: { id } });
      return { message: "Product deleted" };
    } catch (err) {
      this.logger.error(`Failed to delete product: ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException(`Failed to delete product: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async toggleFeatured(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.prisma.product.update({
      where: { id },
      data: { featured: !product.featured },
      include: { brand: true, keywords: true },
    });
  }
}
