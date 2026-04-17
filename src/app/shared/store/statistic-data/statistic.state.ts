import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { StatisticAction } from "./statistic.actions";
import { StatisticService } from "./statistic.service";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { UtilsString } from "../../utils";
import { ToastrService } from "ngx-toastr";
import { StatisticAllPaymentLocataireYearModel, StatisticLocataireYearModel, StatisticPaymentOfAllPropertyByYear, StatisticRoomYearModel, PropertyMetrics, ComprehensiveReport, EnrichedStatisticResponse } from "./statistic.model";

export interface StatisticError {
    message: string;
    code?: string;
    timestamp: Date;
}

export class StatisticStateModel {
    roomStatistic:StatisticRoomYearModel[] //statistic de chambre
    locataireStatistic:StatisticLocataireYearModel[] //statistic de locataire
    allLocatairePayementByYear:StatisticAllPaymentLocataireYearModel[] //statistique de paiement
    
    
    // 🆕 DONNÉES ENRICHIES DU BACKEND
    propertyMetrics: { [key: string]: PropertyMetrics } // Clé: propertyId-year
    comprehensiveReports: { [key: string]: ComprehensiveReport } // Clé: propertyId-year

    loadingStatistic:boolean
    loadingRoomStatistic:boolean
    locataireStatisticLoading:boolean
    allLocatairePayementByYearLoading:boolean
    loadingStatisticRecaptilationLoading:boolean
    loadingPropertyStatistic:boolean
    statisticRecapitulationPayment:StatisticPaymentOfAllPropertyByYear[] //statistique de recaptiulation de paiement par ans

    // Error handling
    error: StatisticError | null
    roomStatisticError: StatisticError | null
    locataireStatisticError: StatisticError | null
    allLocatairePayementByYearError: StatisticError | null
    statisticRecapitulationPaymentError: StatisticError | null

    // Last update timestamps for cache management
    lastUpdated: Date | null
    roomStatisticLastUpdated: Date | null
    locataireStatisticLastUpdated: Date | null
    allLocatairePayementByYearLastUpdated: Date | null
    statisticRecapitulationPaymentLastUpdated: Date | null

    //PropertyStatistic
    propertyStatistic:{key:string,data:EnrichedStatisticResponse}[]
}


@State<StatisticStateModel>({
    name: "statistics",
    defaults:{
        loadingStatistic:false,
        loadingRoomStatistic:false,
        locataireStatisticLoading:false,
        loadingStatisticRecaptilationLoading:false,
        loadingPropertyStatistic:false,
        allLocatairePayementByYearLoading:false,
        
        roomStatistic:[],
        locataireStatistic:[],
        allLocatairePayementByYear:[],
        statisticRecapitulationPayment:[],
        
        // 🆕 DONNÉES ENRICHIES
        propertyMetrics: {},
        comprehensiveReports: {},

        // Error states
        error: null,
        roomStatisticError: null,
        locataireStatisticError: null,
        allLocatairePayementByYearError: null,
        statisticRecapitulationPaymentError: null,

        propertyStatistic:[],

        // Timestamps
        lastUpdated: null,
        roomStatisticLastUpdated: null,
        locataireStatisticLastUpdated: null,
        allLocatairePayementByYearLastUpdated: null,
        statisticRecapitulationPaymentLastUpdated: null
    }
})
@Injectable()
export class StatisticState{
   
    constructor(
        private _statisticsService:StatisticService,
        private _toastrService:ToastrService,
    ){}

    @Selector()
    static selectStateLoading(state:StatisticStateModel)
    {
        return state.loadingStatistic
    }

    @Selector()
    static selectStateLocataireStatisticLoading(state:StatisticStateModel)
    {
        return state.locataireStatisticLoading
    }

    @Selector()
    static selectStateLocatairePaymentStatisticLoading(state:StatisticStateModel)
    {
        return state.allLocatairePayementByYearLoading
    }


    @Selector()
    static selectStateRoomStatisticLoading(state:StatisticStateModel)
    {
        return state.loadingRoomStatistic
    }

    @Selector()
    static selectPaymentRecapitulationStatisticLoading(state:StatisticStateModel)
    {
        return state.loadingStatisticRecaptilationLoading
    }

    // Error selectors
    @Selector()
    static selectError(state: StatisticStateModel) {
        return state.error;
    }

    @Selector()
    static selectRoomStatisticError(state: StatisticStateModel) {
        return state.roomStatisticError;
    }

    @Selector()
    static selectLocataireStatisticError(state: StatisticStateModel) {
        return state.locataireStatisticError;
    }

    @Selector()
    static selectAllLocatairePayementByYearError(state: StatisticStateModel) {
        return state.allLocatairePayementByYearError;
    }

    @Selector()
    static selectStatisticRecapitulationPaymentError(state: StatisticStateModel) {
        return state.statisticRecapitulationPaymentError;
    }

    // Combined error selector - returns true if any error exists
    @Selector()
    static selectHasAnyError(state: StatisticStateModel) {
        return !!(state.error || state.roomStatisticError || state.locataireStatisticError ||
                 state.allLocatairePayementByYearError || state.statisticRecapitulationPaymentError);
    }

    // Data selectors
    @Selector()
    static selectStateRoomStatistic(state:StatisticStateModel)
    {
        return state.roomStatistic
    }

    @Selector()
    static selectStateLocataireStatistic(state:StatisticStateModel)
    {
        return state.locataireStatistic
    }

    @Selector()
    static selectStateAllLocatairePayementByYear(state:StatisticStateModel)
    {
        return state.allLocatairePayementByYear
    }

    @Selector()
    static selectStateStatisticRecapitulationPayment(state:StatisticStateModel)
    {
        return state.statisticRecapitulationPayment
    }

    // Loading state selectors for combined loading states
    @Selector()
    static selectStateLoadingRoomStatistic(state:StatisticStateModel)
    {
        return state.loadingRoomStatistic
    }

    @Selector()
    static selectStateLoadingPropertyStatistic(state:StatisticStateModel)
    {
        return state.loadingPropertyStatistic
    }

    @Selector()
    static selectStateAllLocatairePayementByYearLoading(state:StatisticStateModel)
    {
        return state.allLocatairePayementByYearLoading
    }

    @Selector()
    static selectStateLoadingStatisticRecaptilationLoading(state:StatisticStateModel)
    {
        return state.loadingStatisticRecaptilationLoading
    }


    static selectStateStatisticByRoom(roomId)
    {
        return createSelector([StatisticState],(state)=>{
            if(!roomId) return null;
            let data=state.roomStatistic.find((u)=>u.room._id==roomId)
            if(data) return data
            return null;
        })
    }

    static selectStateStatisticRecapitulationPaymentBydYear(year:number|string=new Date().getFullYear())
    {
        return createSelector([StatisticState],(state)=> state.statisticRecapitulationPayment.filter((u)=> u.year==year.toString()))    
    }

    static selectStateStatisticLocataireByPropertyIdAndYear(propertyID,year:number|string=new Date().getFullYear())
    {
        return createSelector([StatisticState],(state)=> state.locataireStatistic.filter((u)=>u.locataire.property==propertyID && u.year==year.toString()))    
    }

    static selectStateStatisticAllPaymentLocataireByPropertyIdAndYear(propertyID,year:number|string=new Date().getFullYear())
    {
        return createSelector([StatisticState],(state)=> state.allLocatairePayementByYear.filter((u)=>u.locataire.property==propertyID && u.year==year.toString()))
    }

    static selectStateStatisticRoomByPropertyIdAndYear(propertyID,year:number|string=new Date().getFullYear())
    {
        return createSelector([StatisticState],(state)=> {            
            const filtered = state.roomStatistic.filter((u)=>u && u.room && u.room.property==propertyID && u.year==year.toString());
            return filtered;
        })
    }

    static selectStateStatisticPropertyIdAndYear(propertyID,year:number|string=new Date().getFullYear())
    {
        return createSelector([StatisticState],(state)=> {            
            const filtered = state.propertyStatistic.filter((u)=> u.key==`${propertyID}-${year}`);
            return filtered;
        })
    }

    // 🆕 SÉLECTEURS POUR LES DONNÉES ENRICHIES
    static selectPropertyMetrics(propertyID: string, year: string)
    {
        return createSelector([StatisticState], (state) => {
            const key = `${propertyID}-${year}`;
            return state.propertyMetrics[key] || null;
        });
    }

    static selectComprehensiveReport(propertyID: string, year: string)
    {
        return createSelector([StatisticState], (state) => {
            const key = `${propertyID}-${year}`;
            return state.comprehensiveReports[key] || null;
        });
    }

    @Action(StatisticAction.FetchStaticByPropertyIdAndYear)
    fetchRoomStatisticByPropertyAndYear(ctx:StateContext<StatisticStateModel>,{propertyID,year}:StatisticAction.FetchStaticRoomDataByPropertyIdAndYear)
    {
        const state = ctx.getState();

        ctx.patchState({
            loadingPropertyStatistic:true,
        })

        return this._statisticsService.getStatisticPropertyDataByYear(propertyID,year).pipe(
            tap(
                result => {
                    const key = `${propertyID}-${year}`;
                    // ✅ result est ApiResultFormat<EnrichedStatisticResponse>
                    // result.data est l'EnrichedStatisticResponse (qui contient lui-même data: EnrichedStatisticData)
                    // On stocke directement result.data pour que les composants accèdent à propertyStats[0].data.data.rooms
                    // CORRECTION : on stocke result (l'enveloppe complète) pour éviter la confusion
                    // Les composants accèdent via propertyStats[0].data qui est EnrichedStatisticResponse
                    const filteredPropertyStats = state.propertyStatistic.filter((u) => u.key !== key);
                    const finalStatistic = [...filteredPropertyStats, { key, data: result.data }];

                    ctx.patchState({
                        loadingPropertyStatistic: false,
                        propertyStatistic: finalStatistic,
                        error: null
                    });
                }
            ),
            catchError(error => {
                console.error('❌ Error loading room statistics:', error);
                const errorObj: StatisticError = {
                    message: error.error?.message || 'Erreur lors du chargement des statistiques des chambres',
                    code: error.error?.error || 'ROOM_STATS_ERROR',
                    timestamp: new Date()
                };

                ctx.patchState({
                    loadingPropertyStatistic: false,
                    roomStatisticError: errorObj
                });

                this._toastrService.error(errorObj.message, 'Erreur');
                return throwError(error);
            })
        )
    }

    @Action(StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear)
    fetchPaymentRecapitulationByYear(ctx:StateContext<StatisticStateModel>,{year}:StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear)
    {
        const state = ctx.getState();
        let index = state.statisticRecapitulationPayment.findIndex((u)=>u.year==year.toString());
        if(index>-1) return of(true);

        ctx.patchState({
            loadingStatisticRecaptilationLoading:true
        })
        return this._statisticsService.getPaymentRecapitulationAccountOfAllPropertyByYear(year).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingStatisticRecaptilationLoading:false,
                        statisticRecapitulationPayment:[...state.statisticRecapitulationPayment, result.data]
                    })
                }
            ),
            catchError(error => {
                const errorObj: StatisticError = {
                    message: error.error?.message || 'Erreur lors du chargement du récapitulatif',
                    code: error.error?.error || 'RECAP_STATS_ERROR',
                    timestamp: new Date()
                };
                ctx.patchState({
                    loadingStatisticRecaptilationLoading: false,
                    statisticRecapitulationPaymentError: errorObj
                });
                this._toastrService.error(errorObj.message, 'Erreur');
                return throwError(error);
            })
        )
    }

    @Action(StatisticAction.ResetAllState)
    resetAllState(ctx:StateContext<StatisticStateModel>)
    {
        ctx.patchState({
            loadingStatistic:false,
            loadingRoomStatistic:false,
            locataireStatisticLoading:false,
            allLocatairePayementByYearLoading:false,
            roomStatistic:[],
            locataireStatistic:[],
            allLocatairePayementByYear:[],
            propertyMetrics: {},
            comprehensiveReports: {}
            // initLoadingState:'NO_LOADED',
        })
    }

    @Action(StatisticAction.Logout)
    logout(ctx:StateContext<StatisticStateModel>)
    {
        ctx.patchState({
            loadingStatistic:false,
            loadingRoomStatistic:false,
            locataireStatisticLoading:false,
            allLocatairePayementByYearLoading:false,
            roomStatistic:[],
            locataireStatistic:[],
            allLocatairePayementByYear:[],
            propertyMetrics: {},
            comprehensiveReports: {}
            // initLoadingState:'NO_LOADED',
        })
    }

    @Action(StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear)
    fetchLocataireStatisticByPropertyAndYear(ctx:StateContext<StatisticStateModel>,{propertyID,year}:StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear)
    {
        const state = ctx.getState();
        let index = state.locataireStatistic.findIndex((u)=>u.locataire.property==propertyID && u.year==year.toString());
        let locataireStatisticNewState = [...state.locataireStatistic]
        if(index>-1) locataireStatisticNewState.splice(index,1);

        // if(index>-1) return of(true);

        ctx.patchState({
            loadingStatistic:true,
            locataireStatisticLoading:true
        })
        return this._statisticsService.getStatisticLocataireDataByYear(propertyID,year).pipe(
            tap(
                result => {
                    //console.log("Result Locataire data",result)
                    ctx.patchState({
                        loadingStatistic:false,
                        locataireStatisticLoading:false,
                        locataireStatistic:[...locataireStatisticNewState, ...result.data]
                    })
                }
            )
        )
    }

    @Action(StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear)
    fetchAllPayementLocataireStatisticByPropertyAndYear(ctx:StateContext<StatisticStateModel>,{propertyID,year}:StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear)
    {
        const state = ctx.getState();
        let index = state.allLocatairePayementByYear.findIndex((u)=>u.locataire.property==propertyID && year.toString()==u.year);
        let allLocatairePayementByYearNewState = [...state.allLocatairePayementByYear]
        if(index>-1) allLocatairePayementByYearNewState.splice(index,1);

        // if(index>-1) return of(true);

        ctx.patchState({
            loadingStatistic:true,
            allLocatairePayementByYearLoading:true            
        })

        return this._statisticsService.getAllPaymentLocataireStatisticDataByYear(propertyID,year).pipe(
            tap(
                result => {
                    //console.log("Result Locataire Statistic",result)
                    ctx.patchState({
                        loadingStatistic:false,
                        allLocatairePayementByYearLoading:false,
                        allLocatairePayementByYear:[...allLocatairePayementByYearNewState, ...result.data]
                    })
                }
            )
        )
    }

    @Action(StatisticAction.RefreshStatisticAfterPayment)
    refreshStatisticAfterPayment(ctx: StateContext<StatisticStateModel>, { propertyID, year }: StatisticAction.RefreshStatisticAfterPayment) {
        const state = ctx.getState();
        const key = `${propertyID}-${year}`;

        // Invalider toutes les données liées à cette propriété/année
        const filteredPropertyStats = state.propertyStatistic.filter((u) => u.key !== key);
        const filteredLocataireStats = state.locataireStatistic.filter(
            (u) => !(u.locataire.property === propertyID && u.year === year.toString())
        );
        const filteredAllLocatairePayements = state.allLocatairePayementByYear.filter(
            (u) => !(u.locataire.property === propertyID && u.year === year.toString())
        );

        ctx.patchState({
            propertyStatistic: filteredPropertyStats,
            locataireStatistic: filteredLocataireStats,
            allLocatairePayementByYear: filteredAllLocatairePayements
        });

        return ctx.dispatch(new StatisticAction.FetchStaticByPropertyIdAndYear(propertyID, year.toString()));
    }  
    
    @Action(StatisticAction.RefreshStaticLocataireDataByPropertyIdAndYear)
    refretchAStatisticByPropertyAndYear(ctx:StateContext<StatisticStateModel>,{propertyID,year}:StatisticAction.RefreshStaticLocataireDataByPropertyIdAndYear)
    {

        const state = ctx.getState();
        let newStateLocataireStatistic = [...state.locataireStatistic];
        let indexNewStateLocataireStatistic = state.locataireStatistic.findIndex((u)=>u.locataire.property==propertyID && u.year==year.toString());
        if(indexNewStateLocataireStatistic>-1) newStateLocataireStatistic.splice(indexNewStateLocataireStatistic,1);

        let newallLocatairePayementByYear = [...state.allLocatairePayementByYear];
        let indexAllLocatairePayementByYear = state.allLocatairePayementByYear.findIndex((u)=>u.locataire.property==propertyID && u.year==year.toString());
        if(indexAllLocatairePayementByYear>-1) newallLocatairePayementByYear.splice(indexAllLocatairePayementByYear,1);


        ctx.patchState({
            locataireStatistic:newStateLocataireStatistic,
            allLocatairePayementByYear:newallLocatairePayementByYear            
        })
        
        return ctx.dispatch([
            new StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear(propertyID,year),
            new StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear(propertyID,year)
        ])
    } 

}