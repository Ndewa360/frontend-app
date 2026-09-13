import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FindAndManageComponentComponent } from '../find-and-manage-component/find-and-manage-component.component';

@Component({
  selector: 'baniere-slide',
  templateUrl: './baniere-slide.component.html',
  styleUrls: ['./baniere-slide.component.css'],
  standalone: true,
  imports: [FindAndManageComponentComponent, TranslatePipe]
})
export class BaniereSlideComponent {

}
