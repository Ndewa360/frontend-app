import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-remboursement',
  templateUrl: './remboursement.component.html',
  styleUrls: ['./remboursement.component.scss'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor, TranslatePipe]
})
export class RemboursementComponent {}
