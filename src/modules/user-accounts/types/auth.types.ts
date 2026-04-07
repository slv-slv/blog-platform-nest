export interface JwtAcсessPayload {
  sub: string;
  iat: number;
  exp: number;
}

export interface JwtRefreshPayload {
  sub: string;
  deviceId: string;
  jti: string;
  iat: number;
  exp: number;
}

export type JwtPairType = {
  accessToken: string;
  refreshToken: string;
};

export type GenerateTokenPairParams = {
  userId: string;
  ip: string;
  deviceName: string;
  deviceId?: string;
};
