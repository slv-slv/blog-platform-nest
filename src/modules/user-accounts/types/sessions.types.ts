import { WithId } from 'mongodb';

export type SessionDbType = WithId<{
  userId: string;
  devices: DeviceType[];
}>;

export type DeviceType = {
  id: string;
  name: string;
  ip: string;
  iat: number;
  exp: number;
};

export type DeviceViewType = {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
};

export type CreateSessionParams = {
  userId: string;
  deviceId: string;
  deviceName: string;
  ip: string;
  iat: number;
  exp: number;
};

export type CheckSessionParams = {
  userId: string;
  deviceId: string;
  iat: number;
};
