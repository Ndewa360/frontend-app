import { Injectable } from "@angular/core";
import { Store } from "@ngxs/store";
import { AuthTokenAction } from "../auth-token";
import { AuthService } from "./auth.service";
import { catchError } from "rxjs/operators";
import { of } from "rxjs";
import { CityAction } from "../city";
import { ContractAction } from "../contract";
import { CountryAction } from "../country";
import { UploadFilesAction } from "../files-upload";
import { HistoryLocationPaymentAction } from "../history-payment-location";
import { LocataireAction } from "../locataire";
import { LocationAction } from "../location";
import { LocationPaymentAction } from "../payment-location";
import { PropertyAction } from "../properties";
import { RoomAction } from "../rooms";
import { SouscriptionAction } from "../souscription";
import { StatisticAction } from "../statistic-data";
import { SouscriptionPeriodAction } from "../souscription-period";
import { UserAction } from "../user";
import { UserProfileAction } from "./user-profile.actions";

@Injectable({
    providedIn:"root"
})
export class DisconnexionService
{
    constructor(
        private store:Store,
        private authService: AuthService
    ){}
    
    logout()
    {
        // Appeler l'endpoint de déconnexion backend pour nettoyer le refresh token
        this.authService.logout().pipe(
            catchError(error => {
                console.warn('Erreur lors de la déconnexion backend:', error);
                // Continuer la déconnexion côté frontend même si le backend échoue
                return of(null);
            })
        ).subscribe(() => {
            console.log('✅ Déconnexion backend réussie');
        });

        // Nettoyer tous les stores frontend
        this.store.dispatch(new CityAction.Logout())
        this.store.dispatch(new ContractAction.Logout())
        this.store.dispatch(new CountryAction.Logout())
        this.store.dispatch(new UploadFilesAction.Logout())
        this.store.dispatch(new HistoryLocationPaymentAction.Logout())
        this.store.dispatch(new LocataireAction.Logout())
        this.store.dispatch(new LocationAction.Logout())
        this.store.dispatch(new LocationPaymentAction.Logout())
        this.store.dispatch(new PropertyAction.Logout())
        this.store.dispatch(new RoomAction.Logout())
        this.store.dispatch(new SouscriptionAction.Logout())
        this.store.dispatch(new SouscriptionPeriodAction.Logout())
        this.store.dispatch(new StatisticAction.Logout())
        this.store.dispatch(new UserAction.Logout())
        this.store.dispatch(new UserProfileAction.Logout())
        this.store.dispatch(new AuthTokenAction.Logout('Manual logout'));
    }
}