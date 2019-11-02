import { Component, OnInit } from '@angular/core';
// import { ClientsService } from './clients.service';
import {WebsocketService} from './websocket';
import { WS } from './websocket.events';
import { Observable } from 'rxjs';
import { ImageService } from './image.service';
import { IWsUser, IWsMessage, ICommand } from './websocket/websocket.interfaces';
import { faRedo, faPlay } from '@fortawesome/free-solid-svg-icons';

declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'websockets-angular-client';
  faRedo = faRedo;
  faPlay = faPlay;

  imgUrl = 'http://localhost.zyxel.com/screen?id=7';
  imageToShow: any;
  isImageLoading: boolean;

  // clientsSrvs = new ClientsService();

  commands = [
    {name: 'restart-thread', type: 'command'},
    {name: 'clean-queue', type: 'command'},
    {name: 'refresh', type: 'command'},
    {name: 'help-clan', type: 'command'},
    {name: 'reload-data', type: 'command'},
    {name: 'prize', type: 'command'},
    {name: 'install', type: 'command'},
    {name: 'myerrors-check', type: 'command'},
    {name: 'restartserver', type: 'command'},
    {name: 'restartlauncher', type: 'command'},
    {name: 'exercises 1', type: 'command'},
    {name: 'exercises 2', type: 'command'},
    {name: 'exercises 3', type: 'command'},
    {name: 'rss-to "rig" food 10', type: 'incremental'},
    {name: 'rss-to "rig" lumber 10', type: 'incremental'},
    {name: 'rss-to "rig" iron 10', type: 'incremental'},
    {name: 'rss-to "rig" stone 10', type: 'incremental'},
    {name: 'rss-to "rig" silver 10', type: 'incremental'},
    {name: 'rss-to "r i c h" food 10', type: 'incremental'},
    {name: 'rss-to "r i c h" lumber 10', type: 'incremental'},
    {name: 'rss-to "r i c h" iron 10', type: 'incremental'},
    {name: 'rss-to "r i c h" stone 10', type: 'incremental'},
    {name: 'rss-to "r i c h" silver 10', type: 'incremental'},
    {name: 'rss-to "k u p" food 10', type: 'incremental'},
    {name: 'rss-to "k u p" lumber 10', type: 'incremental'},
    {name: 'rss-to "k u p" iron 10', type: 'incremental'},
    {name: 'rss-to "k u p" stone 10', type: 'incremental'},
    {name: 'rss-to "k u p" silver 10', type: 'incremental'},
    {name: 'rss-to "r o m" food 10', type: 'incremental'},
    {name: 'rss-to "r o m" lumber 10', type: 'incremental'},
    {name: 'rss-to "r o m" iron 10', type: 'incremental'},
    {name: 'rss-to "r o m" stone 10', type: 'incremental'},
    {name: 'rss-to "r o m" silver 10', type: 'incremental'},
    {name: 'rss-to "v a r" food 10', type: 'incremental'},
    {name: 'rss-to "v a r" lumber 10', type: 'incremental'},
    {name: 'rss-to "v a r" iron 10', type: 'incremental'},
    {name: 'rss-to "v a r" stone 10', type: 'incremental'},
    {name: 'rss-to "v a r" silver 10', type: 'incremental'},
    {name: '', type: 'command'}
  ];

  public logs: ICommand[] = [];

  public messages$: Observable<IWsUser[]>;

  public messages: IWsUser[];

  constructor(private wsService: WebsocketService, private imageService: ImageService) { }

  public ngOnInit() {
    $(document).ready(() => {
      $('.ui-layout-container').layout({ applyDefaultStyles: true });
    });

    // get messages
    this.messages$ = this.wsService.on<IWsUser[]>('users');

    this.messages$.subscribe(msg => {
      this.messages = msg;
      console.log(msg);

      this.messages.forEach(usr => {
        if (usr.raw_status) {
          usr.status = JSON.parse(usr.raw_status);
        } else if (typeof usr.status === 'string' ) {
          usr.status = JSON.parse(usr.status);
        }
        if (usr.status) {
          usr.status.history = this.reverseArray(usr.status.history);
          usr.status.queue = this.reverseArray(usr.status.queue);
        }
      });

    });
  }

  createImageFromBlob(image: Blob) {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      this.imageToShow = reader.result;
    }, false);

    if (image) {
      reader.readAsDataURL(image);
    }
  }

  getImageFromService() {
    this.isImageLoading = true;
    $.ajax({
      url: this.imgUrl,
      beforeSend( xhr ) {
        xhr.setRequestHeader ('Authorization', 'Basic cm9vdDohU2hhbWFuaXNoZTIwMTc=');
      },
      success: ( data ) => {
        this.createImageFromBlob(data);
        this.isImageLoading = false;
      },
      error: (error) => {
        this.isImageLoading = false;
        this.imageToShow = '';
        console.log(error);
      }
    });
  }

  reverseArray(arr: any[]) {
    const newArray = [];
    for (let i = arr.length - 1; i >= 0; i--) {
      newArray.push(arr[i]);
    }
    return newArray;
  }

  _buildMessage(user: string, msg: object): ICommand {
    const date = new Date(Date.now());
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return {cmd: msg, time: `${hours}:${minutes}:${seconds}`, display: `Send to ${user}: ${JSON.stringify(msg)}`, name: `${user}`};
  }

  send(): void {
    const uuid = $('#uuid').val();
    if (uuid === '') {
      alert('No user! Please select user.');
    } else {
      const val = $('#val');
      const msg = {type: 'command', uuid, command: $('#cmd').val() + (val.is(':visible') ? (' ' + val.val()) : '')};
      this.wsService.send(WS.SEND.TYPE, msg);
      this.addLog(this._buildMessage($('#user-name').text(), msg));
    }
  }

  send2(msg: ICommand): void {
    this.wsService.send(WS.SEND.TYPE, msg.cmd);
    this.addLog(this._buildMessage(msg.name, msg.cmd));
  }

  sendToAll(): void {
    const val = $('#val');
    $.each($('#users a'), (idx, btn) => {
      const msg = {type: 'command', uuid: btn.id, command: $('#cmd').val() + (val.is(':visible') ? (' ' + val.val()) : '')};
      this.wsService.send(WS.SEND.TYPE, msg);
      this.addLog(this._buildMessage(btn.name, msg));
    });
  }

  setCmd(cmd, type: string): void {
    if (type.includes('incremental')) {
      $('.addit').show();
      $('#val').show();
      if ($('#cmd').val().length > 0) {
        const cmdMain = $('#cmd').val();
        const targetMain = cmd.split(' ');
        const inc = targetMain.pop();

        if (cmdMain !== targetMain.join(' ')) {
          $('#cmd').val(targetMain.join(' '));
          $('#val').val(parseInt(inc));
        } else {
          $('#val').val(parseInt($('#val').val()) + parseInt(inc));
        }
      } else {
        const targetMain = cmd.split(' ');
        const wasBefore = targetMain.pop();
        $('#cmd').val(targetMain.join(' '));
        $('#val').val(parseInt(wasBefore));
      }
    } else {
      $('#val').hide();
      $('.addit').hide();
      $('#cmd').val(cmd);
    }
  }

  addLog(logMsg: ICommand): void {
    this.logs.unshift(logMsg);
  }

  setUpdateInterval(): void {
    if ($('#reload')[0].checked === true) {
      this.wsService.connect();
    } else {
      if (this.wsService) {
        this.wsService.ngOnDestroy();
      }
    }
  }

  reloadUser(userId: string): void {
    let msg = {type: 'command', uuid: userId, command: 'status'};
    this.wsService.send(WS.SEND.TYPE, msg);
  }

  reload(): void {
    $.each($('#users a'), (idx, btn) => {
      let msg = {type: 'command', uuid: btn.id, command: 'status'};
      this.wsService.send(WS.SEND.TYPE, msg);
    });
  }

  selectUser(id, name): void {
    $('#user-name').text(name);
    $('#uuid').val(id);
    this.getImageFromService();
  }

  inc(): void {
    $('#val').val(parseFloat($('#val').val()) + 10);
  }

  dec(): void {
    const oldValue = $('#val').val();
    if (oldValue > 0) {
      $('#val').val(parseFloat(oldValue) - 10);
    }
  }

  generateTime(time: number): string {
    if (!time) {return; }
    const offset = 3;
    return new Date(time * 1000 + (3600000 * offset)).toISOString().slice(11, -1);
  }

}
