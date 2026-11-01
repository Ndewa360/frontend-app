import { StateContext } from "@ngxs/store";
import { PropertyDetailsAction } from "./property-details.actions";
import { StatisticAction } from "../statistic-data/statistic.actions";

/** Identifiant d'une référence qui peut arriver peuplée (objet) ou non (chaîne). */
export function refId(value: any): string | null {
    if (!value) return null;
    return String(value?._id ?? value);
}

/**
 * Après une action qui modifie un bien (unité, locataire, bail, paiement,
 * fichier), recharge tout l'écran du bien en une requête et invalide ses
 * statistiques : la liste, le statut et les totaux sont à jour sans que
 * l'utilisateur actualise la page.
 *
 * Les mises à jour locales faites par chaque action restent en place pour un
 * affichage immédiat ; ce rechargement les remplace par l'état du serveur.
 */
export function refreshPropertyScreen(ctx: StateContext<any>, property: any): void {
    const propertyId = refId(property);
    if (!propertyId) return;
    ctx.dispatch(new PropertyDetailsAction.Fetch(propertyId));
    ctx.dispatch(new StatisticAction.RefreshStatisticAfterPayment(propertyId, new Date().getFullYear()));
}
