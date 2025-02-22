import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { ContractModel } from "./contract.model";
import { Injectable } from "@angular/core";
import { ContractAction } from "./contract.actions";
import { ContractService } from "./contract.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { UtilsString } from "../../utils";
import { ToastrService } from "ngx-toastr";

export class ContractStateModel {
    contracts:{locationId:string,pdf:string}[]
    loadingContract:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
}


@State<ContractStateModel>({
    name: "contracts",
    defaults:{
        loadingContract:false,
        contracts:[],
        initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class ContractState{
   
    constructor(
        private _contractsService:ContractService,
        private _toastrService:ToastrService,
    ){}

    @Selector()
    static selectStateLoading(state:ContractStateModel)
    {
        return state.loadingContract
    }

    @Selector()
    static selectStateInitLoading(state:ContractStateModel)
    {
        return state.initLoadingState
    }
    @Selector() 
    static setlectStateContracts(state:ContractStateModel)
    {
        return state.contracts
    }

    
    static selectStateContractByLocationId(locationId)
    {
        return createSelector([ContractState],(state)=>{
            if(!locationId) return null;
            let data=state.contracts.find((u)=>u.locationId==locationId)
            if(data) return data
            return null;
        })
    
    }


    @Action(ContractAction.ResetAllState)
    resetAllState(ctx:StateContext<ContractStateModel>)
    {
        ctx.setState({
            loadingContract:false,
            contracts:[],
            initLoadingState:'NO_LOADED',
        })
    }

   

    @Action(ContractAction.FetchContract)
    fetchContract(ctx:StateContext<ContractStateModel>,{locationId}:ContractAction.FetchContract)
    {
        const state = ctx.getState();
        let index = state.contracts.findIndex((u)=>u.locationId==locationId);

        if(index>-1) return of(true);

        ctx.patchState({
            loadingContract:true
        })

        return this._contractsService.getContract(locationId).pipe(
            tap(
                result => {
                    // console.log("Retourn pdf ",result)
                    ctx.patchState({
                        loadingContract:false,
                        contracts:[...state.contracts, {pdf:result.data,locationId}]
                    })
                }
            )
        )
    }
}