import { Observable } from 'rxjs';
import { SplitInterpolation } from '@angular/compiler';

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

export interface IWsUsers {
  users: IWsUser[];
}

export interface IWsUser {
  name: string;
  uuid: string;
  status: any;
  raw_status: string;
}

export interface IWsResult {
  id: number;
  result: string;
  status: string;
  from: string;
  to: string;
}

export interface IWsUsers extends IWsMessage {
  users: Array<IWsUser>;
}

export interface IWsSettings extends IWsMessage {
  uuid: string;
  port: number;
}

export interface ILog {
  name: string;
  display: string;
  cmd: ICommand;
  time: string;
  result: string;
  status: string;
}

export interface ICommand extends IWsMessage {
  id: number;
  to: string;
  command: string;
}

