import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const tokenObj = request.cookies?.accessToken ;
    const token = tokenObj.accessToken 
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decoded = this.jwtService.verify(token, { secret: process.env.SECRET });  
      (request as any).user = decoded;   
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
