import { AuthTokenAction, AuthTokenState, LocataireAction, LocataireState, LocationAction, LocationPaymentAction, LocationPaymentState, LocationState, PropertyAction, PropertyState, RoomAction, RoomState, SouscriptionAction, SouscriptionPeriodAction, StatisticAction, StatisticState, UserAction, UserProfileAction, UserProfileState, UserState } from "../store";
import { HistoryLocationPaymentAction, HistoryLocationPaymentState } from "../store/history-payment-location";

export class StoreHelper
{
    static resetAllState(store)
    {
        store.dispatch(new AuthTokenAction.SetAuthToken(null))
        store.dispatch(new HistoryLocationPaymentAction.ResetAllState())
        store.dispatch(new LocataireAction.ResetAllState())
        store.dispatch(new LocationAction.ResetAllState())
        store.dispatch(new LocationPaymentAction.ResetAllState())
        store.dispatch(new PropertyAction.ResetAllState())
        store.dispatch(new RoomAction.ResetAllState())
        store.dispatch(new StatisticAction.ResetAllState())
        store.dispatch(new UserAction.ResetAllState())
        store.dispatch(new UserProfileAction.ResetAllState())
        store.dispatch(new SouscriptionAction.ResetAllState())
        store.dispatch(new SouscriptionPeriodAction.ResetAllState())
    }
}