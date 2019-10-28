import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { WebsocketModule } from './websocket';
import { environment } from '../environments/environment';
import { ImageService } from './image.service';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    FontAwesomeModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    WebsocketModule.config({
      url: environment.ws
    })
  ],
  providers: [ImageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
