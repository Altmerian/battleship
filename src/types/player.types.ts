import { ErrorResponseData } from './websocket.types';

export interface PlayerData {
  name: string;
  password: string;
  index: string;
  wins: number;
}

export interface RegRequestData {
  name: string;
  password: string;
}

export interface RegResponseData extends Partial<ErrorResponseData> {
  name: string;
  index: string;
}

export interface WinnerData {
  name: string;
  wins: number;
} 