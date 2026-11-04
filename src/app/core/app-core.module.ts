import { NgModule } from '@angular/core';
import { NgxsModule } from '@ngxs/store';
import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { ToastrModule } from 'ngx-toastr';
import {
  UserProfileState, UserState, PropertyState, RoomState, LocataireState,
  AuthTokenState, LocationState, StatisticState, SouscriptionState,
  SouscriptionPeriodState, CityState, CountryState, SearchState, ContractState,
  HistoryLocationPaymentState, GlobalState, ContractTemplateState,
  SubscriptionLimitState, SubscriptionPaymentState, PremiumAccessState
} from '../shared/store';
import { WalletState } from '../shared/store/wallet';
import { LocationPaymentState } from '../shared/store/payment-location';
import { UploadFilesState } from '../shared/store/files-upload';
import { ProspectionState } from '../shared/store/prospection/prospection.state';
import { PropertyManagerState } from '../shared/store/property-manager/property-manager.state';

/**
 * Socle de l'application, chargé au démarrage : états NGXS (utilisés par les
 * services racine, intercepteurs et gardes), persistance du jeton, toasts.
 *
 * La boîte à outils graphique (YoupezModule : composants Carbon, mise en page,
 * barres de défilement…) reste dans SharedModule, importé seulement par les
 * modules chargés à la demande : elle n'est plus téléchargée avant la
 * première page, ni du tout pour la page de paiement d'un locataire.
 *
 * Les `forRoot` (stockage, routeur, toasts) étaient aussi dans SharedModule,
 * donc répétés dans chaque module chargé à la demande.
 */
@NgModule({
  imports: [
    NgxsModule.forFeature([
      GlobalState, UserProfileState, UserState, PropertyState, RoomState,
      LocataireState, LocationState, AuthTokenState, LocationPaymentState,
      HistoryLocationPaymentState, StatisticState, SouscriptionState,
      SouscriptionPeriodState, CityState, CountryState, SearchState,
      UploadFilesState, ContractState, ProspectionState, ContractTemplateState,
      SubscriptionLimitState, SubscriptionPaymentState, PremiumAccessState,
      WalletState,
      PropertyManagerState,
    ]),
    NgxsStoragePluginModule.forRoot({ key: ['ndewa360_auth_token'] }),
    NgxsRouterPluginModule.forRoot(),
    ToastrModule.forRoot({
      progressBar: true, closeButton: true,
      preventDuplicates: true, maxOpened: 3, autoDismiss: true,
    }),
  ],
})
export class AppCoreModule {}
