import { AuthTokenState, LocataireState, LocationPaymentState, LocationState, PropertyState, RoomState, StatisticState, UserProfileState, UserState } from "../store";
import { HistoryLocationPaymentState } from "../store/history-payment-location";

export class StoreHelper
{
    static resetAllState(store)
    {
        store.reset(AuthTokenState)
        store.reset(HistoryLocationPaymentState);
        store.reset(LocataireState)
        store.reset(LocationState)
        store.reset(LocationPaymentState)
        store.reset(PropertyState)
        store.reset(RoomState)
        store.reset(StatisticState)
        store.reset(UserState)
        store.reset(UserProfileState)
    }
}