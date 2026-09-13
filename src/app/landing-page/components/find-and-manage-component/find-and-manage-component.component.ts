import { Component, ViewEncapsulation } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { FindLocationFormComponent } from '../find-location-form/find-location-form.component';
import { TabsModule } from 'carbon-components-angular';

@Component({
  selector: 'find-and-manage-component',
  templateUrl: './find-and-manage-component.component.html',
  styleUrls: ['./find-and-manage-component.component.css'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [TabsModule, FindLocationFormComponent, RouterLink, TranslatePipe]
})
export class FindAndManageComponentComponent {

}
