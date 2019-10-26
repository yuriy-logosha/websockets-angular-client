import { Injectable, OnDestroy, Inject } from '@angular/core';
import { Observable, SubscriptionLike, Subject, Observer, interval } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';

import { share, distinctUntilChanged, takeWhile } from 'rxjs/operators';
import { IWebsocketService, IWsMessage, IWsUsers, IWsSettings, WebSocketConfig } from './websocket.interfaces';
import { config } from './websocket.config';


@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements IWebsocketService, OnDestroy {

  private config: WebSocketSubjectConfig<IWsMessage>;

  private websocketSub: SubscriptionLike;
  private statusSub: SubscriptionLike;

  private reconnection$: Observable<number>;
  private websocket$: WebSocketSubject<any>;
  private connection$: Observer<boolean>;
  private wsMessages$: Subject<IWsMessage>;

  private settings: Subject<IWsSettings>;

  private reconnectInterval: number;
  private reconnectAttempts: number;
  private reloadInterval: number;
  private isConnected: boolean;


  public status: Observable<boolean>;

  constructor(@Inject(config) private wsConfig: WebSocketConfig) {
    this.wsMessages$ = new Subject<IWsMessage>();
    this.settings = new Subject<IWsSettings>();

    this.reconnectInterval = wsConfig.reconnectInterval || 5000; // pause between connections
    this.reconnectAttempts = wsConfig.reconnectAttempts || 10; // number of connection attempts

    this.reloadInterval = wsConfig.reloadInterval || 5;

    this.config = {
      url: wsConfig.url,
      closeObserver: {
        next: (event: CloseEvent) => {
          this.websocket$ = null;
          this.connection$.next(false);
        }
      },
      openObserver: {
        next: (event: Event) => {
          console.log('WebSocket connected!');
          this.connection$.next(true);
        }
      }
    };

    // connection status
    this.status = new Observable<boolean>((observer) => {
      this.connection$ = observer;
    }).pipe(share(), distinctUntilChanged());

    // run reconnect if not connection
    this.statusSub = this.status.subscribe((isConnected) => {
        this.isConnected = isConnected;

        if (!this.reconnection$ && typeof(isConnected) === 'boolean' && !isConnected) {
          this.reconnect();
        }
      });

    // this.websocketSub = this.wsMessages$.subscribe(
    //   null, (error: ErrorEvent) => console.error('WebSocket error!', error)
    // );

    // this.connect();
  }

  ngOnDestroy() {
    if (this.websocketSub) {
      this.websocketSub.unsubscribe();
    }

    if (this.statusSub) {
      this.statusSub.unsubscribe();
    }
  }


  /*
  * connect to WebSocked
  * */
  public connect(): void {
    this.websocket$ = new WebSocketSubject(this.config);

    this.websocket$.subscribe(
      (message) => {
        //console.log(message);
        this.wsMessages$.next(message);

        if (message['type'] === 'settings') {
          // this.settings.next(message as IWsSettings);
          // this.settings = Object.assign(new Subject<IWsSettings>, message);

          this.settings = message;
        }
      },
      (error: Event) => {
        if (!this.websocket$) {
          // run reconnect if errors
          this.reconnect();
        }
      });
  }


  /*
  * reconnect if not connecting or errors
  * */
  public reconnect(): void {
    this.reconnection$ = interval(this.reconnectInterval)
      .pipe(takeWhile((v, index) => index < this.reconnectAttempts && !this.websocket$));

    this.reconnection$.subscribe(
      () => this.connect(),
      null,
      () => {
        // Subject complete if reconnect attemts ending
        this.reconnection$ = null;

        if (!this.websocket$) {
          this.wsMessages$.complete();
          this.connection$.complete();
        }
      });
  }


  /*
  * on message event
  * */
  public on<T>(name: string): Observable<T> {
    let msg = this.wsMessages$.pipe(
      filter((message: IWsMessage) => message.type === name),
      map((message: IWsMessage) => message[name])
    );

    return msg;
  }


  /*
  * on message to server
  * */
  public send(event: string, data: any = {}): void {
    if (event && this.isConnected) {
      this.websocket$.next(data);
    } else {
      console.error('Send error!');
    }
  }

  public getSettings() {
    return this.settings;
  }

}
