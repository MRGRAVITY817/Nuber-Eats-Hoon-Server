import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from 'src/users/users.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [UsersModule],
  providers: [
    {
      // If we want to use a guard everywhere, use APP_GUARD
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
