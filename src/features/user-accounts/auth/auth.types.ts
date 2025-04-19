export interface JwtAcessPayload {
  userId: string;
  iat: number;
  exp: number;
}

export interface JwtRefreshPayload {
  userId: string;
  deviceId: string;
  iat: number;
  exp: number;
}

export type JwtPairType = {
  accessToken: string;
  refreshToken: string;
};
