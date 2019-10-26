import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ImageService {

  constructor(private httpClient: HttpClient) { }

  getImage(imageUrl: string): Observable<Blob> {
    return this.httpClient.get(imageUrl, {
      headers: new HttpHeaders({
        'Content-Type':  'image/png',
        Authorization: 'Basic cm9vdDohU2hhbWFuaXNoZTIwMTc='
      }),
      responseType: 'blob',
      params: new HttpParams().set('id', '7')
    });
  }

}
