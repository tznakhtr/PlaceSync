import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService], // Exported so AuthService and JwtStrategy can use it
})
export class UsersModule {}

