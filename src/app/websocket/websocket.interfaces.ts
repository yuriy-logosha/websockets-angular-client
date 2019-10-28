import { Observable } from 'rxjs';

export interface IWebsocketService {
    status: Observable<boolean>;
    on<T>(message: string): Observable<T>;
    send(type: string, data: any): void;
}

export interface WebSocketConfig {
    url: string;
    reconnectInterval?: number;
    reconnectAttempts?: number;
    reloadInterval?: number;
}

export interface IWsMessage {
    type: string;
}

export interface IWsUser {
  name: string;
  uuid: string;
  status: any;
  raw_status: string;
}

export interface IWsUsers extends IWsMessage {
  users: Array<IWsUser>;
}

export interface IWsSettings extends IWsMessage {
  uuid: string;
  port: number;
}

export interface ICommand {
  name: string;
  display: string;
  cmd: object;
  time: string;
}

