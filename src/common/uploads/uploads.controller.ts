import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { UploadsService, IMAGE_FILE_CONFIG } from "./uploads.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { RolesGuard } from "../guards/roles.guard";
import { Roles } from "../guards/roles.decorator";

@ApiTags("Uploads")
@Controller("uploads")
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post("file")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager")
  @ApiBearerAuth("jwt")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!IMAGE_FILE_CONFIG.mimeTypes.test(file.mimetype)) {
          cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: IMAGE_FILE_CONFIG.maxSize },
    }),
  )
  @ApiOperation({ summary: "Upload a single file to Supabase storage (admin/manager only)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: {
        file: { type: "string", format: "binary", description: "File to upload (JPEG, PNG, WebP, GIF) - max 5MB" },
        folder: { type: "string", description: "Folder path in storage (optional, default: 'general')" },
      },
    },
  })
  @ApiResponse({ status: 201, description: "File uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid file type or size" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body("folder") folder?: string,
  ) {
    if (!file) {
      throw new Error("No file provided");
    }
    return this.uploadsService.uploadFile(file, folder || "general");
  }

  @Post("files")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager")
  @ApiBearerAuth("jwt")
  @UseInterceptors(
    FilesInterceptor("files", 10, {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!IMAGE_FILE_CONFIG.mimeTypes.test(file.mimetype)) {
          cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: IMAGE_FILE_CONFIG.maxSize },
    }),
  )
  @ApiOperation({ summary: "Upload multiple files to Supabase storage (max 10 files, 5MB each)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["files"],
      properties: {
        files: {
          type: "array",
          items: { type: "string", format: "binary" },
          description: "Files to upload (JPEG, PNG, WebP, GIF) - max 10 files, 5MB each",
        },
        folder: { type: "string", description: "Folder path in storage (optional, default: 'general')" },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Files uploaded successfully" })
  @ApiResponse({ status: 400, description: "Invalid file type or size" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body("folder") folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }
    return this.uploadsService.uploadFiles(files, folder || "general");
  }

  @Delete("file/:fileName")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager")
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Delete a file from Supabase storage (admin/manager only)" })
  @ApiParam({ name: "fileName", example: "products/abc123-logo.png" })
  @ApiResponse({ status: 200, description: "File deleted successfully" })
  @ApiResponse({ status: 404, description: "File not found" })
  async deleteFile(@Param("fileName") fileName: string) {
    await this.uploadsService.deleteFile(decodeURIComponent(fileName));
    return { message: "File deleted successfully", fileName };
  }

  @Delete("files")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager")
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Delete multiple files from Supabase storage (admin/manager only)" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["fileNames"],
      properties: {
        fileNames: {
          type: "array",
          items: { type: "string" },
          example: ["products/abc123-logo.png", "brands/xyz456-banner.jpg"],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Files deleted successfully" })
  @ApiResponse({ status: 404, description: "One or more files not found" })
  async deleteFiles(@Body("fileNames") fileNames: string[]) {
    if (!fileNames || fileNames.length === 0) {
      throw new Error("No file names provided");
    }
    await this.uploadsService.deleteFiles(fileNames.map((name) => decodeURIComponent(name)));
    return { message: `${fileNames.length} file(s) deleted successfully`, fileNames };
  }
}
