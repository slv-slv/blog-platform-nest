import { WithId } from 'mongodb';

export type SessionDbType = WithId<{
  userId: string;
  devices: DeviceModel[];
}>;

export type DeviceModel = {
  id: string;
  name: string;
  ip: string;
  jti: string;
  iat: number;
  exp: number;
};

export type DeviceViewModel = {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
};

export type CheckSessionParams = {
  userId: string;
  deviceId: string;
  iat: number;
};

export type CreateSessionParams = {
  userId: string;
  deviceId: string;
  deviceName: string;
  ip: string;
  jti: string;
  iat: number;
  exp: number;
};
