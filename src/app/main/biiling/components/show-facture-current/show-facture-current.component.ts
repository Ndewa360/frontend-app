import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Select, Selector, Store } from '@ngxs/store';
import { TableModel, TableRowSize, TableHeaderItem, TableItem } from 'carbon-components-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { sort } from 'src/@youpez';
import { SouscriptionState, SouscriptionModel, SouscriptionPeriodModel, SouscriptionPeriodState, SouscriptionPeriodService, SouscriptionPeriodAction, RoomModel, RoomType, RoomAction, LocataireState, PropertyState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'show-facture-current',
  templateUrl: './show-facture-current.component.html',
  styleUrls: ['./show-facture-current.component.css']
})
export class ShowFactureCurrentComponent {
  @Select(SouscriptionState.selectStatePeriodDefaultWithRunningState) souscription$:Observable<SouscriptionModel>
  @Select(SouscriptionPeriodState.selectCurrentPeriodWithDetails) currentPeriodWithDetails$: Observable<SouscriptionPeriodModel>;
  @Select(SouscriptionPeriodState.selectLoadingCurrentPeriod) loadingCurrentPeriod$: Observable<boolean>;
  roomsValueChangeStatus:{isLoading:BehaviorSubject<boolean>,roomId:string, value:BehaviorSubject<boolean>,room:RoomModel}[]=[];

  currentPeriod:SouscriptionPeriodModel=null;
  waittingResponse=false;
  isAssignedOpened = false;
  propertyId = null;
  public leftSidebarVisibility: boolean = true
  
  public property= null;
  public fullModelData=[]
  public model = new TableModel();
  
  public searchModel
  public size:TableRowSize = 'md'
  public offset = {x: -9, y: 0}
  public batchText = ''

  showSelectionColumn = true
  enableSingleSelect = false
  striped = false
  sortable = true
  isDataGrid = false
  noData = false
  stickyHeader = false
  skeleton = false

  @ViewChild("roomTemplate", {static: true}) roomTemplate: TemplateRef<any>
  @ViewChild("actionTemplate", {static: true}) actionTemplate: TemplateRef<any>
  @ViewChild("propertyTemplate", {static: true}) propertyTemplate: TemplateRef<any>
  @ViewChild("paginationTableItemTemplate", {static: true}) paginationTableItemTemplate: TemplateRef<any>

  constructor(
    private _store:Store,
    private _ngxsAction:Actions,
    private cdr: ChangeDetectorRef,
    private _souscriptionPeriodService: SouscriptionPeriodService,
    private translate: TranslateService
  ){}
  ngOnInit() {
    // Charger la période actuelle avec les détails des unités via le store
    this._store.dispatch(new SouscriptionPeriodAction.FetchCurrentPeriodWithDetails());

    // S'abonner aux changements de la période actuelle
    this.currentPeriodWithDetails$.subscribe((period) => {
      if (period) {
        this.currentPeriod = period;
        this.setupUnitsTable();
        this.cdr.detectChanges();
      }
    });

    this._ngxsAction.pipe(ofActionSuccessful(RoomAction.ChangeStatusActivatedForSouscriptionRoom)).subscribe((value)=>{
      // Navigate to the parent
      let foundRoom = this.roomsValueChangeStatus.find((u)=>u.roomId==value.roomId);
      foundRoom.value.next(value.isActiveForSouscription);
      this.cdr.detectChanges()
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(RoomAction.ChangeStatusActivatedForSouscriptionRoom)).subscribe(
      (value) => {
        // this.waittingResponse=false;
        let foundRoom = this.roomsValueChangeStatus.find((u)=>u.roomId==value.action.roomId);
        foundRoom.isLoading.next(false);
      this.cdr.detectChanges()

      }
    )

    this._ngxsAction.pipe(ofActionErrored(RoomAction.ChangeStatusActivatedForSouscriptionRoom)).subscribe(
      (value) => {
        let foundRoom = this.roomsValueChangeStatus.find((u)=>u.roomId==value.roomId);
        foundRoom.value.next(value.isActiveForSouscription);     
      this.cdr.detectChanges()

      })  

    this.souscription$.subscribe((value)=>{
      if(!value) return;
      this._store.select(SouscriptionPeriodState.selectStateSouscriptionPeriod(value.currentPeriod)).subscribe((value)=>{
        if(!value) return;
        this.currentPeriod=value;
        this.setupUnitsTable(); // Utiliser la nouvelle méthode
      })
    })

    // Ne plus utiliser roomList$ - les données viennent maintenant du backend

  }

  getPage(page: number)
  {
    let end = page * this.model.pageLength;
    let start = end - this.model.pageLength;

    return new Promise(resolve => {
      setTimeout(() => resolve(this.fullModelData.slice(start,end)), 150)
    })
  }

  prepareData(unitsList) {
    return unitsList.map((unit)=> {
      let dataForLoading = {
        roomId: unit.unitId,
        room: {
          _id: unit.unitId,
          code: unit.unitCode,
          price: unit.unitPrice,
          isFree: !unit.isEligible,
          isActiveForSouscription: unit.isActiveForSouscription,
          type: RoomType.ROOM,
          property: null,
          medias: []
        } as RoomModel,
        unit,
        isLoading: new BehaviorSubject(false),
        value: new BehaviorSubject(unit.isActiveForSouscription)
      }
      this.roomsValueChangeStatus.push(dataForLoading);
      return ([
        new TableItem({
          data: unit.unitCode,
          className: "items-center font-bold"
        }),
        new TableItem({
          data: unit.propertyName,
          className: "items-center"
        }),
        new TableItem({
          data: this.getDefaultCurrency() + ' ' + unit.unitPrice.toLocaleString(),
          className: "items-center"
        }),
        new TableItem({
          data: unit.occupiedDays + ' ' + this.translate.instant('BILLING.INVOICE.DAYS_SUFFIX'),
          className: "items-center"
        }),
        new TableItem({
          data: unit.isEligible ? this.translate.instant('BILLING.INVOICE.ELIGIBILITY.YES') : this.translate.instant('BILLING.INVOICE.ELIGIBILITY.NO'),
          className: "items-center " + (unit.isEligible ? 'text-green-600' : 'text-red-600')
        }),
        new TableItem({
          data: this.getDefaultCurrency() + ' ' + unit.revenue.toLocaleString(),
          className: "items-center font-bold " + (unit.revenue > 0 ? 'text-green-600' : 'text-gray-500')
        }),
        new TableItem({
          data: dataForLoading,
          template: this.actionTemplate,
          className: "items-center"
        })
      ])
    })
  }

  selectPage(page) {
    this.getPage(page).then((data: Array<Array<any>>) => {
      // set the data and update page
      this.model.data = this.prepareData(data)
      this.model.currentPage = page
    })
  }


  onRowClick(index: number) {
  }

  getLocataireById(locataireid)
  {
    return this._store.select(LocataireState.selectStateLocataire(locataireid))
  }

  getPropertyById(propertyID)
  {
    return this._store.select(PropertyState.selectStateProperty(propertyID))
  }

  onClose(event) {
    this.isAssignedOpened = false
  }

  onToggleLeftSidebar() {
    this.leftSidebarVisibility = !this.leftSidebarVisibility
  }

  shouldOpenAssignedOpened() {
    this.isAssignedOpened = true;
  }


  changeStatusRoom(event, roomId)
  {
    let foundRoom = this.roomsValueChangeStatus.find((u)=>u.roomId==roomId);
    foundRoom.isLoading.next(true);

    // Utiliser le nouveau service pour mettre à jour le statut
    this._souscriptionPeriodService.toggleUnitStatus(roomId, event).subscribe({
      next: (result) => {
        foundRoom.isLoading.next(false);
        foundRoom.value.next(event);
        // Recharger la période actuelle pour avoir les données mises à jour
        this.loadCurrentPeriodWithDetails();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        foundRoom.isLoading.next(false);
        // Remettre l'ancien état en cas d'erreur
        foundRoom.value.next(!event);
        this.cdr.detectChanges();
      }
    });
  }
  changeSouscriptionOfRoom(roomId,status)
  {
    this.waittingResponse=true;
    this._store.dispatch(new RoomAction.ChangeStatusActivatedForSouscriptionRoom(roomId,status))
  }

  simpleSort(index: number) {
    sort(this.model, index)
  }

  getDefaultCurrency()
  {
    return UtilsString.getDefaultCurrency()
  }

  public loadCurrentPeriodWithDetails(): void {
    this._souscriptionPeriodService.getCurrentPeriodWithDetails().subscribe({
      next: (result) => {
        if (result.data) {
          this.currentPeriod = result.data;
          this.setupUnitsTable();
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la période actuelle:', error);
      }
    });
  }

  private setupUnitsTable(): void {
    // Utiliser unitsDetails (nom du backend) ou unitDetails (alias frontend)
    const unitsData = this.currentPeriod?.unitsDetails || this.currentPeriod?.unitDetails;

    if (!unitsData || unitsData.length === 0) {
      return;
    }
    let newModel = new TableModel()

    newModel.header = [
      new TableHeaderItem({
        data: this.translate.instant('BILLING.INVOICE.TABLE_HEADERS.CODE'),
        className: "items-center font-bold"
      }),
      new TableHeaderItem({
        data: this.translate.instant('BILLING.INVOICE.TABLE_HEADERS.PROPERTY'),
        className: "items-center"
      }),
      new TableHeaderItem({
        data: this.translate.instant('BILLING.INVOICE.TABLE_HEADERS.PRICE'),
        className: "items-center"
      }),
      new TableHeaderItem({
        data: this.translate.instant('BILLING.INVOICE.TABLE_HEADERS.OCCUPIED_DAYS'),
        className: "items-center",
      }),
      new TableHeaderItem({
        data: this.translate.instant('BILLING.INVOICE.TABLE_HEADERS.ELIGIBLE'),
        className: "items-center",
      }),
      new TableHeaderItem({
        data: this.translate.instant('BILLING.INVOICE.TABLE_HEADERS.AMOUNT'),
        className: "items-center",
      }),
      new TableHeaderItem({
        data: this.translate.instant('BILLING.INVOICE.TABLE_HEADERS.STATUS'),
        className: "items-center",
      }),
    ]

    // Préparer les données directement
    const preparedData = this.prepareData(unitsData);

    this.fullModelData = [...unitsData];
    newModel.data = preparedData;
    newModel.pageLength=10;
    newModel.totalDataLength=unitsData.length;
    this.model = newModel;
  }

  formatPeriodDates(): string {
    if (!this.currentPeriod) return this.translate.instant('BILLING.INVOICE.PERIOD_UNDEFINED');

    const start = new Date(this.currentPeriod.startedAt).toLocaleDateString('fr-FR');
    const end = new Date(this.currentPeriod.endedAt).toLocaleDateString('fr-FR');
    return `${start} - ${end}`;
  }

  getPeriodStatus(): string {
    if (!this.currentPeriod) return 'N/A';

    switch (this.currentPeriod.state) {
      case 'payed': return this.translate.instant('BILLING.INVOICE.PERIOD_STATUS.PAID');
      case 'waiting': return this.translate.instant('BILLING.INVOICE.PERIOD_STATUS.WAITING');
      case 'unpaid': return this.translate.instant('BILLING.INVOICE.PERIOD_STATUS.UNPAID');
      default: return this.translate.instant('BILLING.INVOICE.PERIOD_STATUS.UNKNOWN');
    }
  }

  getPeriodStatusColor(): string {
    if (!this.currentPeriod) return 'secondary';

    switch (this.currentPeriod.state) {
      case 'payed': return 'success';
      case 'waiting': return 'warning';
      case 'unpaid': return 'danger';
      default: return 'secondary';
    }
  }

  // Méthodes pour calculer les totaux
  getTotalRevenue(): number {
    return this.currentPeriod?.totalUnitsRevenue || 0;
  }

  getTotalServiceFees(): number {
    return this.currentPeriod?.calculatedAmount || 0;
  }

  getOccupiedUnitsCount(): number {
    return this.currentPeriod?.occupiedUnitsCount || 0;
  }

  getTotalUnitsCount(): number {
    const unitsData = this.currentPeriod?.unitsDetails || this.currentPeriod?.unitDetails;
    return unitsData?.length || 0;
  }

  getTotalTaxes(): number {
    // Calcul des taxes (18% sur les frais de service)
    const serviceFees = this.getTotalServiceFees();
    return serviceFees * 0.18;
  }
}
