import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { getUniqueId } from 'src/@youpez/components/app-tasks/app-tasks.component';
import { CountryModel } from 'src/app/shared/store';
import { AddCityComponent } from '../add-city/add-city.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'country-city-list',
  templateUrl: './country-city-list.component.html',
  styleUrls: ['./country-city-list.component.css']
})
export class CountryCityListComponent implements OnChanges {
  // @ViewChild('appTasksList', {static: true}) appTasksList: AppTasksComponent
  @Input('tasks') taskGroups = []
  @Input('transparent') transparent = false

  @Input() countries : CountryModel[]=[];
  countriesData:{country:CountryModel,opened:boolean}[] = []

  @Input() set filterText(value: string) {
    this._filterText = value
  }

  get filterText(): string {
    return this._filterText
  }

  public _filterText: string = ''
  public countryFocusId: string = ''
  public cityFocusId: string ='';
  public deletableTaskGroupIndex: number = null

  constructor(
      private dialog: MatDialog,
  ) {
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['countries']) {
      this.countriesData = this.countries.map((country)=>({country,opened:false}));
    }
  }

  ngOnInit(): void {
  }

  addGroup() {
    // const uid = getUniqueId(5)
    // const newGroup = {
    //   groupName: '',
    //   id: uid,
    //   opened: true,
    //   tasks: []
    // }
    // this.taskGroups = [newGroup, ...this.taskGroups]
    // this.taskFocusId = uid
  }

  minimize() {
    this.taskGroups = this.taskGroups.map(group => {
      group.opened = false
      return group
    })
  }

  maximize() {
    this.taskGroups = this.taskGroups.map(group => {
      group.opened = true
      return group
    })
  }

  getConnectedList(): any[] {
    return this.taskGroups.map(x => `${x.id}`)
  }



  drop(event: CdkDragDrop<any>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex)
    }
    else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex)
    }
  }

  trackByFn(index, row) {
    return index
  }

  dropGroup(event: CdkDragDrop<any>) {
    moveItemInArray(this.taskGroups, event.previousIndex, event.currentIndex)
  }

  onSelectedDeletableGroup(groupIndex) {
    this.deletableTaskGroupIndex = groupIndex
  }

  onToggleTask(event, groupIndex, taskIndex) {
    const {checked} = event
    this.taskGroups[groupIndex].tasks[taskIndex].checked = checked
  }

  onToggleCountry(countryIndex) {
    this.countriesData[countryIndex].opened = !this.countriesData[countryIndex].opened
  }


  onGroupChange(event, groupIndex) {
    this.taskGroups[groupIndex].groupName = event
  }

  onAddCity(countryIndex) {
    this.dialog.open(AddCityComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'alertdialog',
      width: '500px',
      data:{
        country:this.countriesData[countryIndex].country
      }
    })
  }

  onDeleteGroup(groupIndex) {
    this.taskGroups.splice(groupIndex, 1)
  }

  onDeleteTask(groupIndex, taskIndex) {
    this.taskGroups[groupIndex].tasks.splice(taskIndex, 1)
  }


}
