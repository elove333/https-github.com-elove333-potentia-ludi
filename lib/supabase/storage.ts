// Supabase Storage
// Handle NFT metadata, player-generated content, and file uploads

import { supabase } from './client';

export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  [key: string]: any; // Allow additional custom properties
}

export interface WalletSnapshot {
  wallet_id: string;
  timestamp: string;
  balance: {
    native: string;
    tokens: Array<{
      address: string;
      symbol: string;
      balance: string;
      usd_value?: number;
    }>;
  };
  nfts_count: number;
  recent_transactions: Array<{
    hash: string;
    timestamp: string;
    type: string;
    value: string;
  }>;
}

export interface FileMetadata {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

export interface UploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

export interface FileUploadResult {
  path: string;
  publicUrl: string;
  error: Error | null;
}

/**
 * Storage Manager for Supabase
 */
export class StorageManager {
  /**
   * Upload a file to a bucket
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: UploadOptions
  ): Promise<FileUploadResult> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: options?.cacheControl || '3600',
          contentType: options?.contentType,
          upsert: options?.upsert || false,
        });

      if (error) {
        console.error('Upload error:', error);
        return { path: '', publicUrl: '', error };
      }

      const publicUrl = this.getPublicUrl(bucket, data.path);

      return {
        path: data.path,
        publicUrl,
        error: null,
      };
    } catch (err) {
      console.error('Unexpected upload error:', err);
      return {
        path: '',
        publicUrl: '',
        error: err as Error,
      };
    }
  }

  /**
   * Upload NFT metadata JSON
   */
  async uploadNFTMetadata(
    playerId: string,
    tokenId: string,
    metadata: NFTMetadata
  ): Promise<FileUploadResult> {
    const path = `${playerId}/${tokenId}.json`;
    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json',
    });

    return this.uploadFile('nft-metadata', path, blob, {
      contentType: 'application/json',
      upsert: true,
    });
  }

  /**
   * Upload game clip or screenshot
   */
  async uploadGameClip(
    playerId: string,
    clipId: string,
    file: File,
    isScreenshot = false
  ): Promise<FileUploadResult> {
    const folder = isScreenshot ? 'screenshots' : 'clips';
    const extension = file.name.split('.').pop() || 'mp4';
    const path = `${playerId}/${folder}/${clipId}.${extension}`;

    return this.uploadFile('game-content', path, file, {
      contentType: file.type,
      upsert: false,
    });
  }

  /**
   * Upload wallet activity snapshot
   */
  async uploadWalletSnapshot(
    playerId: string,
    walletId: string,
    snapshotData: WalletSnapshot
  ): Promise<FileUploadResult> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const path = `${playerId}/wallet-snapshots/${walletId}_${timestamp}.json`;
    const blob = new Blob([JSON.stringify(snapshotData, null, 2)], {
      type: 'application/json',
    });

    return this.uploadFile('wallet-data', path, blob, {
      contentType: 'application/json',
      upsert: false,
    });
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Download a file as blob
   */
  async downloadFile(bucket: string, path: string): Promise<Blob | null> {
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      console.error('Download error:', error);
      return null;
    }

    return data;
  }

  /**
   * Delete a file
   */
  async deleteFile(bucket: string, path: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { error };
    }

    return { error: null };
  }

  /**
   * List files in a bucket folder
   */
  async listFiles(bucket: string, path: string): Promise<FileMetadata[]> {
    const { data, error } = await supabase.storage.from(bucket).list(path);

    if (error) {
      console.error('List files error:', error);
      return [];
    }

    return (data || []) as FileMetadata[];
  }

  /**
   * Create a signed URL for temporary access
   */
  async createSignedUrl(
    bucket: string,
    path: string,
    expiresIn = 3600
  ): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Create signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  }

  /**
   * Move or rename a file
   */
  async moveFile(
    bucket: string,
    fromPath: string,
    toPath: string
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.storage.from(bucket).move(fromPath, toPath);

    if (error) {
      console.error('Move file error:', error);
      return { error };
    }

    return { error: null };
  }

  /**
   * Create a storage bucket (admin only)
   */
  async createBucket(
    bucketName: string,
    options?: {
      public?: boolean;
      fileSizeLimit?: number;
      allowedMimeTypes?: string[];
    }
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: options?.public || false,
      fileSizeLimit: options?.fileSizeLimit,
      allowedMimeTypes: options?.allowedMimeTypes,
    });

    if (error) {
      console.error('Create bucket error:', error);
      return { error };
    }

    return { error: null };
  }
}

// Create and export singleton instance
export const storageManager = new StorageManager();

// Convenience exports
export const {
  uploadFile,
  uploadNFTMetadata,
  uploadGameClip,
  uploadWalletSnapshot,
  getPublicUrl,
  downloadFile,
  deleteFile,
  listFiles,
  createSignedUrl,
  moveFile,
} = storageManager;

export default storageManager;
