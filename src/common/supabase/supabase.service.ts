import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.client = createClient(
      this.config.get<string>("SUPABASE_URL")!,
      this.config.get<string>("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    this.bucket = this.config.get<string>("SUPABASE_STORAGE_BUCKET")!;
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getBucket(): string {
    return this.bucket;
  }

  getPublicUrl(path: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async uploadFile(path: string, buffer: Buffer, contentType: string) {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    return this.getPublicUrl(data.path);
  }

  async deleteFile(path: string) {
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }
}
