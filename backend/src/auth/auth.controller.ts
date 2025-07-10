// src/auth/auth.controller.ts
import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GraphService } from 'src/graph/graph.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,private readonly graphService: GraphService) {}

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // Initiates the Microsoft OAuth flow
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthRedirect(@Req() req, @Res() res: Response) {
   // console.log(req.user)
    const token = await this.authService.login(req.user);
    
    res.cookie('access_token', token.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 1000, 
  });

    res.redirect('http://localhost:3000/login/success');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    return req.user;
  }
  @Get('logout')
  logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.send({ success: true });
  }

}