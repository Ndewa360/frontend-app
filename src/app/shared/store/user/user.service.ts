import { Injectable } from "@angular/core";
import { UserModel } from "./user.model";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, combineLatest, of, throwError } from "rxjs";
import { ApiResultFormat } from "../global";
import { environment } from "src/environments/environment";
import { catchError } from "rxjs/operators";
import { ErrorHandlerService } from "../../services/error-handler.service";

@Injectable({
    providedIn:'root'
})
export class UserService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private errorHandler: ErrorHandlerService
    )
    {}


    /**
     * Update user
     */
    updateUser(user: UserModel, id: string): Observable<ApiResultFormat<UserModel>>
    {
        return this._httpClient.put<ApiResultFormat<UserModel>>(`${environment.apiUrl}/users/${id}`, user)
            .pipe(
                catchError((error: HttpErrorResponse) =>
                    this.errorHandler.handleHttpError(error, 'Mise à jour utilisateur')
                )
            );
    }

    /**
     * Get all users
     */
    getAllUsers(): Observable<ApiResultFormat<UserModel[]>>
    {
        return this._httpClient.get<ApiResultFormat<UserModel[]>>(`${environment.apiUrl}/users/`)
            .pipe(
                catchError((error: HttpErrorResponse) =>
                    this.errorHandler.handleHttpError(error, 'Récupération des utilisateurs')
                )
            );
    }

    /**
     * Get user by ID
     */
    getUser(userId: string): Observable<ApiResultFormat<UserModel>>
    {
        if (!userId) {
            return throwError(() => new Error('User ID is required'));
        }

        return this._httpClient.get<ApiResultFormat<UserModel>>(`${environment.apiUrl}/users/${userId}`)
            .pipe(
                catchError((error: HttpErrorResponse) =>
                    this.errorHandler.handleHttpError(error, 'Récupération de l\'utilisateur')
                )
            );
    }

    /**
     * Get multiple users by IDs
     */
    getUsers(userIds: string[]): Observable<ApiResultFormat<UserModel[]>>
    {
        if (!userIds || userIds.length === 0) {
            return this.getAllUsers();
        }

        // Créer des requêtes parallèles pour chaque utilisateur
        const userRequests = userIds.map(id =>
            this.getUser(id).pipe(
                catchError(() => of(null)) // Ignorer les erreurs individuelles
            )
        );

        return combineLatest(userRequests).pipe(
            catchError((error: HttpErrorResponse) =>
                this.errorHandler.handleHttpError(error, 'Récupération des utilisateurs')
            )
        ) as Observable<ApiResultFormat<UserModel[]>>;
    }

    /**
     * Create a new user
     */
    createUser(user: UserModel): Observable<ApiResultFormat<UserModel>>
    {
        return this._httpClient.post<ApiResultFormat<UserModel>>(`${environment.apiUrl}/users/`, user)
            .pipe(
                catchError((error: HttpErrorResponse) =>
                    this.errorHandler.handleHttpError(error, 'Création d\'utilisateur')
                )
            );
    }

    /**
     * Delete a user
     */
    deleteUser(userId: string): Observable<ApiResultFormat<void>>
    {
        return this._httpClient.delete<ApiResultFormat<void>>(`${environment.apiUrl}/users/${userId}`)
            .pipe(
                catchError((error: HttpErrorResponse) =>
                    this.errorHandler.handleHttpError(error, 'Suppression d\'utilisateur')
                )
            );
    }
}