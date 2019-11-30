import { Component, OnInit } from '@angular/core';
// import { ClientsService } from './clients.service';
import {WebsocketService} from './websocket';
import { WS } from './websocket.events';
import { Observable } from 'rxjs';
import { ImageService } from './image.service';
import { ILog, IWsUser, IWsUsers, IWsResult, ICommand } from './websocket/websocket.interfaces';
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

  commands = [];

  public logs: ILog[] = [];

  public websocketService: Observable<IWsUsers>;

  public users: IWsUser[] = [];

  constructor(private wsService: WebsocketService, private imageService: ImageService) { }

  public ngOnInit() {
    $(document).ready(() => {
      $('.ui-layout-container').layout({ applyDefaultStyles: true });
    });

    this.wsService.on<IWsResult>('result-container').subscribe(msg => {
      console.log(msg);
      this.logs.filter((log:ILog) => log.cmd.id === msg.id).map(log => {
        if(log.cmd.id === msg.id) {
          log.result = msg.result
          log.status = msg.status
        }
      });
    });

    this.wsService.on<IWsResult>('status-container').subscribe(msg => {
      console.log(msg);
      this.users.filter((u:IWsUser) => u.uuid === msg.from).map(usr => {
        usr.status = msg.result;
        if (usr.status) {
          usr.status.history = this.reverseArray(usr.status.history);
          usr.status.queue = this.reverseArray(usr.status.queue);
        }
      });
    });

    // get messages
    this.wsService.on<IWsUser[]>('users').subscribe(msg => {
      console.log(msg);

      this.users = msg;

      msg.forEach(usr => {
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

  _buildMessage(user: string, cmd: any): ILog {
    const date = new Date(cmd.id);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return {status: '', cmd: Object.assign({}, cmd), result: '', time: `${hours}:${minutes}:${seconds}`, display: `Send to ${user}: ${JSON.stringify(cmd)}`, name: `${user}`};
  }

  send(): void {
    const uuid = $('#uuid').val();
    if (uuid === '') {
      alert('No user selected! Please select a user.');
    } else {
      const val = $('#val');
      const command = this._buildCommand(Date.now(), uuid, $('#cmd').val() + (val.is(':visible') ? (' ' + val.val()) : ''));
      this.wsService.send(WS.SEND.TYPE, command);
      this.addLog(this._buildMessage($('#user-name').text(), command));
      if (this.commands.findIndex(it => command.command === it.command) === -1) {
        this.commands.unshift(command);
      }
    }
  }

  repeatExecution(msg: ILog): void {
    const newLogLine = this._buildMessage(msg.name, msg.cmd);
    newLogLine.cmd.id = Date.now();
    this.wsService.send(WS.SEND.TYPE, newLogLine.cmd);
    this.addLog(newLogLine);
  }

  sendToAll(): void {
    const val = $('#val');
    $.each($('#users a'), (idx, btn) => {
      const msg = this._buildCommand(Date.now(), btn.id, $('#cmd').val() + (val.is(':visible') ? (' ' + val.val()) : ''));
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

  setUpdateInterval(): void {
    if ($('#reload')[0].checked === true) {
      this.wsService.connect();
    } else {
      if (this.wsService) {
        this.wsService.ngOnDestroy();
      }
    }
  }

  selectUser(id, name): void {
    $('#user-name').text(name);
    $('#uuid').val(id);
    //this.getImageFromService();
  }

  _buildCommand = (_id: number, _to: string, commandString: string): ICommand => {return {type: 'command', id: _id, to: _to, command: commandString}};
  addLog = (logMsg: ILog) => this.logs.unshift(logMsg);
  reloadUser = (userId: string) => this.wsService.send(WS.SEND.TYPE, this._buildCommand(Date.now(), userId, 'status'));
  reload = () => this.users.forEach(usr => this.reloadUser(usr.uuid));
  inc = ():void => $('#val').val(parseFloat($('#val').val()) + 10);
  dec (): void {
    const oldValue = $('#val').val();
    if (oldValue > 0) {
      $('#val').val(parseFloat(oldValue) - 10);
    }
  }

  generateTime(time: number): string {
    if (!time) {return; }
    const offset = 2;
    return new Date(time * 1000 + (3600000 * offset)).toISOString().slice(11, -1);
  }

}
