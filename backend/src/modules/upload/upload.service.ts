import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';

export interface UploadedFile {
  url: string;
  thumbUrl?: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

@Injectable()
export class UploadService {
  private readonly provider: string;
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.provider = config.get('storage.provider', 'local');
    this.uploadDir = config.get('storage.uploadDir', './uploads');
    if (this.provider === 'local') {
      ['images', 'videos', 'documents', 'thumbnails'].forEach((dir) => {
        const p = path.join(this.uploadDir, dir);
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      });
    }
  }

  async uploadFile(file: Express.Multer.File, folder = 'images'): Promise<UploadedFile> {
    if (!file) throw new BadRequestException('No file provided');

    const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideos = ['video/mp4', 'video/mpeg', 'video/webm'];
    const allowedDocs = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    const isImage = allowedImages.includes(file.mimetype);
    const isVideo = allowedVideos.includes(file.mimetype);
    const isDoc = allowedDocs.includes(file.mimetype);

    if (!isImage && !isVideo && !isDoc) {
      throw new BadRequestException('File type not allowed');
    }

    if (this.provider === 'local') {
      return this.uploadLocal(file, isImage ? 'images' : isVideo ? 'videos' : 'documents');
    } else if (this.provider === 's3') {
      return this.uploadS3(file);
    } else if (this.provider === 'cloudinary') {
      return this.uploadCloudinary(file);
    }

    throw new BadRequestException('Unknown storage provider');
  }

  private async uploadLocal(file: Express.Multer.File, subfolder: string): Promise<UploadedFile> {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const filePath = path.join(this.uploadDir, subfolder, filename);

    let width: number | undefined;
    let height: number | undefined;
    let thumbUrl: string | undefined;

    if (subfolder === 'images') {
      // Optimize with sharp
      const img = sharp(file.buffer);
      const meta = await img.metadata();
      width = meta.width;
      height = meta.height;

      await img
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .toFile(filePath.replace(ext, '.jpg'));

      // Thumbnail
      const thumbName = `thumb-${filename.replace(ext, '.jpg')}`;
      const thumbPath = path.join(this.uploadDir, 'thumbnails', thumbName);
      await sharp(file.buffer).resize(400, 400, { fit: 'cover' }).jpeg({ quality: 75 }).toFile(thumbPath);
      thumbUrl = `/uploads/thumbnails/${thumbName}`;

      return {
        url: `/uploads/images/${filename.replace(ext, '.jpg')}`,
        thumbUrl,
        originalName: file.originalname,
        mimeType: 'image/jpeg',
        size: file.size,
        width,
        height,
      };
    }

    fs.writeFileSync(filePath, file.buffer);
    return { url: `/uploads/${subfolder}/${filename}`, originalName: file.originalname, mimeType: file.mimetype, size: file.size };
  }

  private async uploadS3(file: Express.Multer.File): Promise<UploadedFile> {
    // AWS S3 upload — requires @aws-sdk/client-s3
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const bucket = this.config.get<string>('storage.aws.bucket', '');
    const region = this.config.get<string>('storage.aws.region', 'us-east-1');
    const key = `uploads/${Date.now()}-${file.originalname}`;

    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: this.config.get<string>('storage.aws.accessKeyId', ''),
        secretAccessKey: this.config.get<string>('storage.aws.secretAccessKey', ''),
      },
    });

    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer, ContentType: file.mimetype }));
    return {
      url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  private async uploadCloudinary(file: Express.Multer.File): Promise<UploadedFile> {
    const cloudinary = await import('cloudinary');
    cloudinary.v2.config({
      cloud_name: this.config.get('storage.cloudinary.cloudName'),
      api_key: this.config.get('storage.cloudinary.apiKey'),
      api_secret: this.config.get('storage.cloudinary.apiSecret'),
    });

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.v2.uploader.upload_stream({ folder: 'pridehub' }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      }).end(file.buffer);
    });

    return {
      url: result.secure_url,
      thumbUrl: result.eager?.[0]?.secure_url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      width: result.width,
      height: result.height,
    };
  }

  async deleteFile(url: string): Promise<void> {
    if (this.provider === 'local' && url.startsWith('/uploads')) {
      const filePath = path.join(process.cwd(), url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
}
