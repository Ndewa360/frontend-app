import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserBreachReportService {
  private url = `${environment.apiUrl}/breach/report`;

  constructor(private http: HttpClient) {}

  report(description: string): Observable<any> {
    return this.http.post(this.url, { description });
  }
}
