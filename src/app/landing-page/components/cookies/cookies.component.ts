import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.scss'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor, NgIf, TranslatePipe]
})
export class CookiesComponent {}
