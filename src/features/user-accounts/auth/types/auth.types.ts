export interface JwtAcessPayload {
  sub: string;
  iat: number;
  exp: number;
}

export interface JwtRefreshPayload {
  sub: string;
  deviceId: string;
  iat: number;
  exp: number;
}

export type JwtPairType = {
  accessToken: string;
  refreshToken: string;
};
