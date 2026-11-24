import { validate } from 'class-validator';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';

describe('Auth DTOs - Input Hardening & Length Constraints', () => {
  describe('RegisterDto', () => {
    it('should fail when password is less than 8 characters', async () => {
      const dto = new RegisterDto();
      dto.name = 'Test Student';
      dto.email = 'student@college.edu';
      dto.password = 'short';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints?.minLength).toBe(
        'Password must be at least 8 characters long',
      );
    });

    it('should fail when password exceeds 72 characters', async () => {
      const dto = new RegisterDto();
      dto.name = 'Test Student';
      dto.email = 'student@college.edu';
      dto.password = 'A'.repeat(73);

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints?.maxLength).toBe(
        'Password cannot exceed 72 characters',
      );
    });

    it('should pass with valid password (between 8 and 72 characters)', async () => {
      const dto = new RegisterDto();
      dto.name = 'Test Student';
      dto.email = 'student@college.edu';
      dto.password = 'ValidP@ssword123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('LoginDto', () => {
    it('should fail when password exceeds 72 characters', async () => {
      const dto = new LoginDto();
      dto.email = 'student@college.edu';
      dto.password = 'B'.repeat(73);

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints?.maxLength).toBe(
        'Password cannot exceed 72 characters',
      );
    });

    it('should pass with a normal password', async () => {
      const dto = new LoginDto();
      dto.email = 'student@college.edu';
      dto.password = 'ValidPassword';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
