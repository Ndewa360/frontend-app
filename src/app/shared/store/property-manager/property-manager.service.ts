import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiResultFormat } from '../global';
import { PropertyManagerAssignment, ManagedPropertyItem, CreateAndAssignManagerPayload, AssignExistingManagerPayload } from './property-manager.model';

@Injectable({ providedIn: 'root' })
export class PropertyManagerApiService {
  private base = `${environment.apiUrl}/property-manager`;

  constructor(private http: HttpClient) {}

  createAndAssign(payload: CreateAndAssignManagerPayload): Observable<ApiResultFormat<PropertyManagerAssignment>> {
    return this.http.post<ApiResultFormat<PropertyManagerAssignment>>(`${this.base}/create-and-assign`, payload);
  }

  assignExisting(payload: AssignExistingManagerPayload): Observable<ApiResultFormat<PropertyManagerAssignment>> {
    return this.http.post<ApiResultFormat<PropertyManagerAssignment>>(`${this.base}/assign-existing`, payload);
  }

  getMyAssignments(): Observable<ApiResultFormat<ManagedPropertyItem[]>> {
    return this.http.get<ApiResultFormat<ManagedPropertyItem[]>>(`${this.base}/my-assignments`);
  }

  getManagersForProperty(propertyId: string): Observable<ApiResultFormat<PropertyManagerAssignment[]>> {
    return this.http.get<ApiResultFormat<PropertyManagerAssignment[]>>(`${this.base}/managers/${propertyId}`);
  }

  searchUserByEmail(email: string): Observable<ApiResultFormat<any>> {
    return this.http.get<ApiResultFormat<any>>(`${this.base}/search-user`, { params: { email } });
  }

  updatePermissions(assignmentId: string, permissions: string[]): Observable<ApiResultFormat<PropertyManagerAssignment>> {
    return this.http.patch<ApiResultFormat<PropertyManagerAssignment>>(`${this.base}/${assignmentId}/permissions`, { permissions });
  }

  revokeManager(assignmentId: string): Observable<ApiResultFormat<any>> {
    return this.http.delete<ApiResultFormat<any>>(`${this.base}/${assignmentId}`);
  }
}
