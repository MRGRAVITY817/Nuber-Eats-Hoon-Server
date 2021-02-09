// Middleware gets request, and send response about it, and send to next function
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { JwtService } from './jwt.service';

@Injectable()
// Implements is like Interfaces, it's different from extends
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    if ('x-jwt' in req.headers) {
      // Get jwt token
      const token = req.headers['x-jwt'];
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        try {
          const { user, ok } = await this.userService.findById(decoded['id']);
          if (ok) {
            req['user'] = user;
          }
        } catch (e) {}
      }
    }
    next();
  }
}
