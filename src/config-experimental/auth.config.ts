import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { IsBase64, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

@Injectable()
export class AuthConfigProvider {
  @IsString()
  @IsNotEmpty()
  @IsBase64()
  readonly adminCredentialsBase64: string;

  @IsString()
  @IsNotEmpty()
  readonly jwtPrivateKey: string;

  @IsString()
  @IsNotEmpty()
  readonly accessTokenExpiresIn: JwtSignOptions['expiresIn'];

  @IsString()
  @IsNotEmpty()
  readonly refreshTokenExpiresIn: JwtSignOptions['expiresIn'];

  @IsInt()
  @Min(1)
  readonly confirmationCodeExpiresIn: number;

  @IsInt()
  @Min(1)
  readonly recoveryCodeExpiresIn: number;

  constructor(private readonly configService: ConfigService) {
    this.adminCredentialsBase64 = this.configService.getOrThrow<string>('ADMIN_CREDENTIALS_BASE64');
    this.jwtPrivateKey = this.configService.getOrThrow<string>('JWT_PRIVATE_KEY');
    this.accessTokenExpiresIn =
      this.configService.getOrThrow<JwtSignOptions['expiresIn']>('ACCESS_TOKEN_EXPIRES_IN');
    this.refreshTokenExpiresIn =
      this.configService.getOrThrow<JwtSignOptions['expiresIn']>('REFRESH_TOKEN_EXPIRES_IN');
    this.confirmationCodeExpiresIn = this.configService.getOrThrow<number>('CONFIRMATION_CODE_EXPIRES_IN');
    this.recoveryCodeExpiresIn = this.configService.getOrThrow<number>('RECOVERY_CODE_EXPIRES_IN');
  }
}
