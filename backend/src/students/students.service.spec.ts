import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudentsService } from './students.service';

describe('StudentsService - Profile & Resume Upload', () => {
  let service: StudentsService;

  const mockPrismaService = {
    studentProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCloudinaryService = {
    uploadPdf: jest.fn(),
    deletePdf: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  const validPdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  const validFile: Express.Multer.File = {
    fieldname: 'resume',
    originalname: 'resume.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: validPdfBuffer.length,
    buffer: validPdfBuffer,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const sampleProfile = {
    id: 1,
    userId: 10,
    rollNo: '2024CSE001',
    branch: 'CSE',
    cgpa: 8.5,
    activeBacklogs: 0,
    graduationYear: 2026,
    skills: ['typescript', 'react'],
    phone: '9876543210',
    resumeUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/old_resume.pdf',
    resumePublicId: 'placesync/resumes/resume_10_oldpublicid.pdf',
  };

  // =========================================================================
  // 1. UPLOAD RESUME TESTS
  // =========================================================================
  describe('uploadResume', () => {
    it('upload succeeds and the old file is deleted from Cloudinary', async () => {
      mockPrismaService.studentProfile.findUnique.mockResolvedValue(sampleProfile);
      mockCloudinaryService.uploadPdf.mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/raw/upload/v2/new_resume.pdf',
        publicId: 'placesync/resumes/resume_10_newpublicid.pdf',
      });
      mockPrismaService.studentProfile.update.mockResolvedValue({
        ...sampleProfile,
        resumeUrl: 'https://res.cloudinary.com/demo/raw/upload/v2/new_resume.pdf',
        resumePublicId: 'placesync/resumes/resume_10_newpublicid.pdf',
      });
      mockCloudinaryService.deletePdf.mockResolvedValue({ result: 'ok' });

      const result = await service.uploadResume(10, validFile);

      // Cloudinary upload was called with file buffer and userId
      expect(mockCloudinaryService.uploadPdf).toHaveBeenCalledWith(validFile.buffer, 10);

      // Database profile was updated with new resume URL and publicId
      expect(mockPrismaService.studentProfile.update).toHaveBeenCalledWith({
        where: { userId: 10 },
        data: {
          resumeUrl: 'https://res.cloudinary.com/demo/raw/upload/v2/new_resume.pdf',
          resumePublicId: 'placesync/resumes/resume_10_newpublicid.pdf',
        },
      });

      // Old resume was deleted from Cloudinary
      expect(mockCloudinaryService.deletePdf).toHaveBeenCalledWith(
        'placesync/resumes/resume_10_oldpublicid.pdf',
      );

      // Returns strictly { resumeUrl } without exposing resumePublicId
      expect(result).toEqual({
        resumeUrl: 'https://res.cloudinary.com/demo/raw/upload/v2/new_resume.pdf',
      });
    });

    it('upload without an existing profile is rejected before uploading to Cloudinary', async () => {
      mockPrismaService.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.uploadResume(10, validFile)).rejects.toThrow(
        new BadRequestException('Complete your profile before uploading a resume'),
      );

      // Cloudinary upload must not be triggered
      expect(mockCloudinaryService.uploadPdf).not.toHaveBeenCalled();
    });

    it('a non-PDF is rejected (wrong mimetype AND a fake .pdf whose bytes do not start with %PDF)', async () => {
      // Case A: Wrong mimetype
      const wrongMimeFile: Express.Multer.File = {
        ...validFile,
        mimetype: 'image/png',
        buffer: Buffer.from('\x89PNG\r\n\x1a\n'),
      };

      await expect(service.uploadResume(10, wrongMimeFile)).rejects.toThrow(
        new BadRequestException('Only PDF files are allowed'),
      );
      expect(mockCloudinaryService.uploadPdf).not.toHaveBeenCalled();

      // Case B: Fake .pdf file (application/pdf mimetype but text/corrupt content)
      const fakePdfFile: Express.Multer.File = {
        ...validFile,
        mimetype: 'application/pdf',
        buffer: Buffer.from('Plain text file masquerading as a PDF document'),
      };

      await expect(service.uploadResume(10, fakePdfFile)).rejects.toThrow(
        new BadRequestException('Only PDF files are allowed'),
      );
      expect(mockCloudinaryService.uploadPdf).not.toHaveBeenCalled();

      // Case C: Missing file entirely
      await expect(service.uploadResume(10, undefined)).rejects.toThrow(
        new BadRequestException('Resume file is required'),
      );

      // Case D: File exceeding 2 MB limit
      const oversizedFile: Express.Multer.File = {
        ...validFile,
        size: 2 * 1024 * 1024 + 1,
      };

      await expect(service.uploadResume(10, oversizedFile)).rejects.toThrow(
        new PayloadTooLargeException('Resume must be 2 MB or smaller'),
      );
    });

    it('cleans up the newly uploaded file if database update fails', async () => {
      mockPrismaService.studentProfile.findUnique.mockResolvedValue(sampleProfile);
      mockCloudinaryService.uploadPdf.mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/raw/upload/v2/new_resume.pdf',
        publicId: 'placesync/resumes/resume_10_newpublicid.pdf',
      });
      mockPrismaService.studentProfile.update.mockRejectedValue(new Error('DB failure'));

      await expect(service.uploadResume(10, validFile)).rejects.toThrow('DB failure');

      // The new Cloudinary file must be deleted to avoid orphaned storage
      expect(mockCloudinaryService.deletePdf).toHaveBeenCalledWith(
        'placesync/resumes/resume_10_newpublicid.pdf',
      );
      // The old Cloudinary file must NOT have been deleted
      expect(mockCloudinaryService.deletePdf).not.toHaveBeenCalledWith(
        'placesync/resumes/resume_10_oldpublicid.pdf',
      );
    });
  });

  // =========================================================================
  // 2. PUT /students/me RESUME IMMUTABILITY
  // =========================================================================
  describe('upsertProfile', () => {
    it('PUT /students/me keeps the resume fields and never overwrites resumeUrl or resumePublicId', async () => {
      mockPrismaService.studentProfile.upsert.mockResolvedValue({
        ...sampleProfile,
        cgpa: 9.0,
      });

      const updateDto = {
        rollNo: '2024CSE001',
        branch: 'CSE' as const,
        cgpa: 9.0,
        activeBacklogs: 0,
        graduationYear: 2026,
        skills: ['typescript', 'nestjs'],
        phone: '9876543210',
      };

      const result = await service.upsertProfile(10, updateDto);

      // Verify upsert update payload does NOT touch resumeUrl or resumePublicId
      expect(mockPrismaService.studentProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 10 },
        update: {
          rollNo: updateDto.rollNo,
          branch: updateDto.branch,
          cgpa: updateDto.cgpa,
          activeBacklogs: updateDto.activeBacklogs,
          graduationYear: updateDto.graduationYear,
          skills: updateDto.skills,
          phone: updateDto.phone,
        },
        create: {
          userId: 10,
          rollNo: updateDto.rollNo,
          branch: updateDto.branch,
          cgpa: updateDto.cgpa,
          activeBacklogs: updateDto.activeBacklogs,
          graduationYear: updateDto.graduationYear,
          skills: updateDto.skills,
          phone: updateDto.phone,
        },
      });

      // Result keeps resumeUrl and excludes resumePublicId
      expect(result.resumeUrl).toBe(sampleProfile.resumeUrl);
      expect((result as any).resumePublicId).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. GET /students/me SANITIZATION
  // =========================================================================
  describe('getProfile', () => {
    it('returns resumeUrl but never exposes resumePublicId', async () => {
      mockPrismaService.studentProfile.findUnique.mockResolvedValue(sampleProfile);

      const result = await service.getProfile(10);

      expect(result.isComplete).toBe(true);
      expect(result.profile?.resumeUrl).toBe(sampleProfile.resumeUrl);
      expect((result.profile as any)?.resumePublicId).toBeUndefined();
    });

    it('returns { profile: null, isComplete: false } if no profile exists', async () => {
      mockPrismaService.studentProfile.findUnique.mockResolvedValue(null);

      const result = await service.getProfile(10);

      expect(result).toEqual({ profile: null, isComplete: false });
    });
  });

  // =========================================================================
  // 4. DELETE RESUME TESTS
  // =========================================================================
  describe('deleteResume', () => {
    it('delete resume removes file from Cloudinary and clears profile fields in DB', async () => {
      mockPrismaService.studentProfile.findUnique.mockResolvedValue(sampleProfile);
      mockCloudinaryService.deletePdf.mockResolvedValue({ result: 'ok' });
      mockPrismaService.studentProfile.update.mockResolvedValue({
        ...sampleProfile,
        resumeUrl: null,
        resumePublicId: null,
      });

      const result = await service.deleteResume(10);

      // Cloudinary delete was called
      expect(mockCloudinaryService.deletePdf).toHaveBeenCalledWith(
        'placesync/resumes/resume_10_oldpublicid.pdf',
      );

      // DB update set both resume fields to null
      expect(mockPrismaService.studentProfile.update).toHaveBeenCalledWith({
        where: { userId: 10 },
        data: {
          resumeUrl: null,
          resumePublicId: null,
        },
      });

      expect(result).toEqual({ message: 'Resume deleted successfully' });
    });

    it('delete when none exists throws 404 NotFoundException', async () => {
      // Profile has no resume uploaded
      mockPrismaService.studentProfile.findUnique.mockResolvedValue({
        ...sampleProfile,
        resumeUrl: null,
        resumePublicId: null,
      });

      await expect(service.deleteResume(10)).rejects.toThrow(
        new NotFoundException('No resume uploaded'),
      );

      expect(mockCloudinaryService.deletePdf).not.toHaveBeenCalled();
      expect(mockPrismaService.studentProfile.update).not.toHaveBeenCalled();

      // Profile does not exist at all
      mockPrismaService.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.deleteResume(10)).rejects.toThrow(
        new NotFoundException('No resume uploaded'),
      );
    });
  });
});
