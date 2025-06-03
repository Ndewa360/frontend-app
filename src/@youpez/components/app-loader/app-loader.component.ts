import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { GlobalState } from 'src/app/shared/store';

@Component({
  selector: 'youpez-loader',
  templateUrl: './app-loader.component.html',
  styleUrls: ['./app-loader.component.scss'],
  // encapsulation: ViewEncapsulation.None
})
export class AppLoaderComponent implements OnInit{
  @Input() title="Chargement des données"
  @Select(GlobalState.selectStateHasConnexionInternet) hasInternetConnexionState$:Observable<boolean>
  constructor(
    private _store:Store
  ){}
  ngOnInit(): void {
    // this.hasInternetConnexionState$.subscribe((value)=>console.log("Has connexion",value))
    
  }


}
