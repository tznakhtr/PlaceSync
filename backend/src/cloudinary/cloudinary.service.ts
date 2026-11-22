import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomBytes } from 'crypto';

export interface UploadPdfResult {
  url: string;
  publicId: string;
}

/**
 * Service managing PDF file uploads and deletions with Cloudinary.
 */
@Injectable()
export class CloudinaryService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'FATAL: Missing Cloudinary configuration (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Please configure them in your .env file.',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  /**
   * Upload a PDF file buffer to Cloudinary.
   * Uploads into the folder "placesync/resumes" with a unique, non-guessable publicId ending in .pdf.
   * Returns { url, publicId } with secure HTTPS URL ending in .pdf and the full publicId.
   */
  async uploadPdf(buffer: Buffer, userId: number): Promise<UploadPdfResult> {
    const randomHex = randomBytes(16).toString('hex');
    const publicId = `placesync/resumes/resume_${userId}_${randomHex}.pdf`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'raw',
        },
        (error, result?: UploadApiResponse) => {
          if (error) {
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary upload returned empty response'));
          }

          const rawUrl = result.secure_url || result.url;
          const url = rawUrl.endsWith('.pdf') ? rawUrl : `${rawUrl}.pdf`;
          const resolvedPublicId = result.public_id?.endsWith('.pdf')
            ? result.public_id
            : `${result.public_id || publicId}.pdf`;

          resolve({
            url,
            publicId: resolvedPublicId,
          });
        },
      );

      // Stream the binary buffer unchanged to avoid text encoding or base64 conversion corruption
      uploadStream.end(buffer);
    });
  }

  /**
   * Delete a PDF from Cloudinary by its full publicId.
   */
  async deletePdf(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: 'raw' },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        },
      );
    });
  }
}
