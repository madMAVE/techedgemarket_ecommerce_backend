import { Injectable, BadRequestException } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { extname } from "path";
import { randomUUID } from "crypto";

export interface UploadResult {
  fileName: string;
  publicUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface AllowedFileConfig {
  mimeTypes: RegExp;
  maxSize: number;
  allowedExtensions?: string[];
}

export const IMAGE_FILE_CONFIG: AllowedFileConfig = {
  mimeTypes: /^image\/(jpeg|png|webp|gif)$/,
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
};

@Injectable()
export class UploadsService {
  constructor(private supabase: SupabaseService) {}

  validateFile(file: Express.Multer.File, config: AllowedFileConfig = IMAGE_FILE_CONFIG) {
    if (!config.mimeTypes.test(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${config.allowedExtensions?.join(", ")}`,
      );
    }
    if (file.size > config.maxSize) {
      throw new BadRequestException(
        `File size exceeds limit. Max size: ${config.maxSize / (1024 * 1024)}MB`,
      );
    }
  }

  generateFileName(originalName: string, prefix: string = "", customName?: string): string {
    const ext = extname(originalName);
    if (customName) {
      return `${prefix}${customName}${ext}`;
    }
    return `${prefix}${randomUUID()}${ext}`;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    config: AllowedFileConfig = IMAGE_FILE_CONFIG,
    customFileName?: string,
  ): Promise<UploadResult> {
    this.validateFile(file, config);

    const fileName = this.generateFileName(file.originalname, `${folder}/`, customFileName);
    console.log(`[Upload] Uploading file: ${fileName} (${file.mimetype}, ${file.size} bytes)`);

    const publicUrl = await this.supabase.uploadFile(fileName, file.buffer, file.mimetype);
    console.log(`[Upload] URL got back: ${publicUrl}`);

    return {
      fileName,
      publicUrl,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder: string,
    config: AllowedFileConfig = IMAGE_FILE_CONFIG,
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (const file of files) {
      const result = await this.uploadFile(file, folder, config);
      results.push(result);
    }
    return results;
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.supabase.deleteFile(fileName);
  }

  async deleteFiles(fileNames: string[]): Promise<void> {
    for (const fileName of fileNames) {
      await this.supabase.deleteFile(fileName);
    }
  }

  extractFileNameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      const storageIndex = pathParts.findIndex((p) => p === "object" || p === "storage");
      if (storageIndex !== -1 && storageIndex + 2 < pathParts.length) {
        return pathParts.slice(storageIndex + 2).join("/");
      }
      if (pathParts.length >= 2) {
        return pathParts.slice(-2).join("/");
      }
      return pathParts[pathParts.length - 1] || null;
    } catch {
      return null;
    }
  }
}
