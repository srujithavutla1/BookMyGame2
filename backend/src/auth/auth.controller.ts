import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GraphService } from 'src/graph/graph.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly graphService: GraphService,
  ) {}

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // Initiates the Microsoft OAuth flow
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthRedirect(@Req() req, @Res() res: Response) {
    const token = await this.authService.login(req.user);

    res.cookie('access_token', token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });

    res.cookie('refresh_token', token.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect('http://localhost:3000/login/success');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
   //console.log(req.user);
    return req.user;
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)

  async logout(@Req() req, @Res() res: Response) {
    console.log(req.user);
    await this.authService.logout(req.user.email);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.send({ success: true });
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string, @Res() res: Response) {
    const tokens = await this.authService.refreshToken(refreshToken);

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      //maxAge: 3600000,
       maxAge: 2*1000,

    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      //maxAge: 7 * 24 * 60 * 60 * 1000,
     maxAge: 10 * 1000, 
    });

    return res.send({ success: true });
  }
}