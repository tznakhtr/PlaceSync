import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from './cloudinary.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'CLOUDINARY_CLOUD_NAME') return 'test_cloud';
      if (key === 'CLOUDINARY_API_KEY') return 'test_key';
      if (key === 'CLOUDINARY_API_SECRET') return 'test_secret';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should initialize and configure Cloudinary on module init', () => {
    service.onModuleInit();
    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'test_cloud',
      api_key: 'test_key',
      api_secret: 'test_secret',
      secure: true,
    });
  });

  it('should throw an error on startup if Cloudinary credentials are missing', () => {
    mockConfigService.get.mockReturnValue(null);

    expect(() => service.onModuleInit()).toThrow(
      /FATAL: Missing Cloudinary configuration/,
    );
  });

  it('uploadPdf should stream buffer to Cloudinary raw upload and return secure url', async () => {
    const fakeResult = {
      secure_url: 'https://res.cloudinary.com/test_cloud/raw/upload/v1/resume.pdf',
      public_id: 'placesync/resumes/resume_10_abc123',
    };

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (options, callback) => {
        return {
          end: jest.fn((buffer) => {
            callback(null, fakeResult);
          }),
        };
      },
    );

    const buffer = Buffer.from('%PDF-1.4 test');
    const result = await service.uploadPdf(buffer, 10);

    expect(result).toEqual({
      url: fakeResult.secure_url,
      publicId: fakeResult.public_id,
    });
  });

  it('deletePdf should call cloudinary.uploader.destroy with raw resource_type', async () => {
    (cloudinary.uploader.destroy as jest.Mock).mockImplementation(
      (publicId, options, callback) => {
        callback(null, { result: 'ok' });
      },
    );

    const result = await service.deletePdf('placesync/resumes/resume_10_abc123');

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      'placesync/resumes/resume_10_abc123',
      { resource_type: 'raw' },
      expect.any(Function),
    );
    expect(result).toEqual({ result: 'ok' });
  });
});
