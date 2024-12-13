import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Actions, Select, Store } from '@ngxs/store';
import { TableHeaderItem, TableItem, TableModel, TableRowSize } from 'carbon-components-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { sort } from 'src/@youpez';
import { UserModel, UserState } from 'src/app/shared/store';

@Component({
  selector: 'users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent {

  @Select(UserState.selectStateUsers) users$:Observable<UserModel[]>


  waittingResponse=false;
  isAssignedOpened = false;
  public leftSidebarVisibility: boolean = true
  
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
  formControlSearch=new FormControl()

  @ViewChild("dateCreateTemplate", {static: true}) dateCreateTemplate: TemplateRef<any>
  @ViewChild("actionStatusTemplate", {static: true}) actionStatusTemplate: TemplateRef<any>
  @ViewChild("linkSpaceTemplate", {static: true}) linkSpaceTemplate: TemplateRef<any>
  @ViewChild("paginationTableItemTemplate", {static: true}) paginationTableItemTemplate: TemplateRef<any>
  usersValueChangeStatus:{isLoading:BehaviorSubject<boolean>,user:UserModel}[]=[];

  constructor(
    private _store:Store,
    private _ngxsAction:Actions,
    private cdr: ChangeDetectorRef
  ){}
  ngOnInit() {
    
    this.users$.subscribe((userList)=>{
      let newModel = new TableModel()
      
      newModel.header = [
        new TableHeaderItem({
          data: "Propriétaire",
          className: "items-center font-bold"
        }),
        new TableHeaderItem({
          data: "Email",
          className: "items-center"
        }),
        new TableHeaderItem({
          data: "Date d'inscription",
          className: "items-center",
        }),
        new TableHeaderItem({
          data: "Vers l'espace",
          className: "items-center",
        }),
        new TableHeaderItem({
          data: "Status",
          className: "items-center",
        })
      ]
      this.fullModelData = [...userList];
      newModel.data = [];
      newModel.pageLength=10;
      newModel.totalDataLength=userList.length;
      this.model = newModel;
      this.selectPage(1);
    })

    this.formControlSearch.valueChanges.subscribe((value)=>{
      this.model.data = this.prepareData(this.fullModelData)
      if(!value) return;
      this.model.data = this.prepareData(this.fullModelData.filter((user:UserModel)=>user.name.toLowerCase().includes(value.toLowerCase())))
      // this.selectPage(1);
    })

  }

  getPage(page: number)
  {
    let end = page * this.model.pageLength;
    let start = end - this.model.pageLength;

    return new Promise(resolve => {
      setTimeout(() => resolve(this.fullModelData.slice(start,end)), 150)
    })
  }

  prepareData(userList:UserModel[]) {
    this.usersValueChangeStatus=[];
    return userList.map((user)=> {
      let dataForLoading = {
        user,
        isActive:new BehaviorSubject(!user.isDisabled),
        isLoading: new BehaviorSubject(false)
      }
      this.usersValueChangeStatus.push(dataForLoading);
      return ([
        new TableItem({
          data: user.name,
          className: "items-center"
        }),
        new TableItem({
          data: user.email,
          className: "items-center"
        }),
        new TableItem({
          data: user.createdAt,
          template: this.dateCreateTemplate,
          className: "items-center"
        }),
        new TableItem({
          data: user,
          template: this.linkSpaceTemplate,
          className: "items-center"
        }),
        new TableItem({
          data: dataForLoading,
          template: this.actionStatusTemplate,
          className: "items-center"
        }),
      ])
    })
  }

  selectPage(page) {
    this.getPage(page).then((data: Array<any>) => {
      // set the data and update page
      this.model.data = this.prepareData(data)
      this.model.currentPage = page
    })
  }


  onRowClick(index: number) {
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


  changeStatusUser(event,userId)
  {
    let foundRoom = this.usersValueChangeStatus.find((u)=>u.user._id==userId);
    foundRoom.isLoading.next(true)
    // this._store.dispatch(new RoomAction.ChangeStatusActivatedForSouscriptionRoom(roomId,event))

  }
  changeSouscriptionOfRoom(userId,status)
  {
    this.waittingResponse=true;
    // this._store.dispatch(new RoomAction.ChangeStatusActivatedForSouscriptionRoom(roomId,status))
  }

  simpleSort(index: number) {
    sort(this.model, index)
  }

}
