import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppLogoComponent } from '../../../components/app-logo/app-logo.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'youpez-auth-welcome-screen',
  templateUrl: './auth-welcome-screen.component.html',
  styleUrls: ['./auth-welcome-screen.component.scss'],
  standalone: true,
  imports: [RouterLink, AppLogoComponent, TranslatePipe]
})
export class AuthWelcomeScreenComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  getCurrentYear()
  {
    return new Date().getFullYear();
  }

}
