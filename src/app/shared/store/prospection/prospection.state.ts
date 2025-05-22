import { Injectable } from "@angular/core"
import { State, Selector, Action, StateContext } from "@ngxs/store"
import { ToastrService } from "ngx-toastr"
import { ProspectionService } from "./prospection.service"
import { ProspectionAction } from "./prospection.action"
import { tap, catchError } from "rxjs"

export class ProspectionStateModel {
    loadingProspection:boolean
}


@State<ProspectionStateModel>({
    name: "prospections",
    defaults:{
        loadingProspection:false,
    }
})
@Injectable()
export class ProspectionState{
   
    constructor(
        private _prospectionsService:ProspectionService,
        private _toastrService:ToastrService,
    ){}



    @Selector()
    static selectStateLoadingProspection(state:ProspectionStateModel)
    {
        return state.loadingProspection
    }

    @Action(ProspectionAction.CreateNewProspection)
    setRoomActiveForSouscription(ctx:StateContext<ProspectionStateModel>,{prosectionModel}:ProspectionAction.CreateNewProspection)
    {    
            
        ctx.patchState({
            loadingProspection:true,
        })
        return this._prospectionsService.addNewProspection(prosectionModel).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingProspection:false
                    })
                    this._toastrService.success(`Votre demande a été transférée avec succès! Vous serez contactez par mail au plus tôt`, 'Ndewa360°');
                }
            ),
            catchError((error)=>{
                    return error;
            })
        )
    }
}