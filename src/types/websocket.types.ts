export interface WebSocketMessage {
  type: string;
  data: string;
  id: number;
}

export interface WebSocketCommandRequest<T = unknown> {
  type: string;
  data: T;
  id: number;
}

export interface WebSocketCommandResponse<T = unknown> {
  type: string;
  data: T;
  id: number;
}

export interface ErrorResponseData {
  error: boolean;
  errorText: string;
}
