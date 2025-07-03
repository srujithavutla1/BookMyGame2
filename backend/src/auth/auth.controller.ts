// src/auth/auth.controller.ts
import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // Initiates the Microsoft OAuth flow
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthRedirect(@Req() req, @Res() res: Response) {
    console.log(req.user)
    const token = await this.authService.login(req.user);
    
    res.cookie('access_token', token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, 
    });
    //console.log(req);
   if(req.user.hasPassword)
    res.redirect('http://localhost:3000/BookMyGame');
    else
    res.redirect('http://localhost:3000/setPassword');

  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    return req.user;
  }
  @Get('has-password')
  @UseGuards(JwtAuthGuard)
  checkHasPassword(@Req() req) {
    return this.authService.checkHasPassword(req.user.email);
  }


  @Get('logout')
  logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.send({ success: true });
  }

   @Post('set-password')
  @UseGuards(JwtAuthGuard)
  async setPassword(@Req() req, @Body() body: { password: string }, @Res() res: Response) {
    try {
      const user = req.user;
      await this.authService.setPassword(user.email, body.password);
      res.send({ success: true });
    } catch (error) {
      res.status(400).send({ success: false, message: error.message });
    }
  }

  // src/auth/auth.controller.ts
@Post('login')
async loginWithEmailPassword(
  @Body() body: { email: string; password: string },
  @Res() res: Response
) {
  try {
    const user = await this.authService.validateEmailPassword(body.email, body.password);
    const token = await this.authService.login(user);
    
    res.cookie('access_token', token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });

    return res.send({ success: true });
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}
  
}