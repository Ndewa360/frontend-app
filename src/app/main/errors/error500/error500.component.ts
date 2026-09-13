import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'carbon-components-angular/button';

@Component({
  selector: 'app-error500',
  templateUrl: './error500.component.html',
  styleUrls: ['./error500.component.scss'],
  standalone: true,
  imports: [ButtonModule]
})
export class Error500Component implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {}

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
