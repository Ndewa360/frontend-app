import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddCountryComponent } from '../add-country/add-country.component';
import { Select } from '@ngxs/store';
import { CountryModel, CountryState } from 'src/app/shared/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'country-city',
  templateUrl: './country-city.component.html',
  styleUrls: ['./country-city.component.css']
})
export class CountryCityComponent {
  @Select(CountryState.selectStateCountries) countries$:Observable<CountryModel[]>
  @Select(CountryState.selectStateLoading) loading$:Observable<boolean>;
  countriesList:CountryModel[]=[];
  public taskGroups = [
    {
      groupName: 'Monday frontend meeting',
      id: 'sadas',
      opened: true,
      tasks: [
        {
          description: 'Angular v9 dependency updates',
          id: 'sadasdas',
          level: 1,
          checked: false,
          priority: 'high',
        }
      ]
    }
  ]


  public txtSearch: string = ''
  public leftSidebarVisibility: boolean = true

  constructor(
        private dialog: MatDialog,
  ) {
  }

  ngOnInit(): void {
    this.countries$.subscribe((value)=>this.countriesList=value)
    
  }

  onAddCountry() {
    this.dialog.open(AddCountryComponent, {
          viewContainerRef:null,
          disableClose: true,
          role: 'alertdialog',
          width: '500px',
        })
  }

  onMinimize() {
    // this.appTasksList.minimize()
  }

  onMaximize() {
    // this.appTasksList.maximize()
  }

  onSearchChange(event) {
    this.txtSearch = event
  }

  onToggleLeftSidebar() {
    this.leftSidebarVisibility = !this.leftSidebarVisibility
  }
}
