import {NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'


import { 
  IconModule,
  IconService, 
} from 'carbon-components-angular'

import Notification32 from '@carbon/icons/es/notification/32';
import Notification24 from '@carbon/icons/es/notification/24';
import Notification20 from '@carbon/icons/es/notification/20';
import Notification16 from '@carbon/icons/es/notification/16';

import UserAvatar32 from '@carbon/icons/es/user--avatar/32';
import UserAvatar24 from '@carbon/icons/es/user--avatar/24';
import UserAvatar20 from '@carbon/icons/es/user--avatar/20';
import UserAvatar16 from '@carbon/icons/es/user--avatar/16';

import ArrowRight32 from '@carbon/icons/es/arrow--right/32';
import ArrowRight24 from '@carbon/icons/es/arrow--right/24';
import ArrowRight20 from '@carbon/icons/es/arrow--right/20';
import ArrowRight16 from '@carbon/icons/es/arrow--right/16';

import ArrowLeft32 from '@carbon/icons/es/arrow--left/32';
import ArrowLeft24 from '@carbon/icons/es/arrow--left/24';
import ArrowLeft20 from '@carbon/icons/es/arrow--left/20';
import ArrowLeft16 from '@carbon/icons/es/arrow--left/16';

import ArrowUp32 from '@carbon/icons/es/arrow--up/32';
import ArrowUp24 from '@carbon/icons/es/arrow--up/24';
import ArrowUp20 from '@carbon/icons/es/arrow--up/20';
import Arrowup16 from '@carbon/icons/es/arrow--up/16';

import ArrowDown32 from '@carbon/icons/es/arrow--down/32';
import ArrowDown24 from '@carbon/icons/es/arrow--down/24';
import ArrowDown20 from '@carbon/icons/es/arrow--down/20';
import ArrowDown16 from '@carbon/icons/es/arrow--down/16';

import Home32 from '@carbon/icons/es/home/32';
import Home24 from '@carbon/icons/es/home/24';
import Home20 from '@carbon/icons/es/home/20';
import Home16 from '@carbon/icons/es/home/16';


import {IbmIconComponent} from './ibm-icon.component'


@NgModule({
  imports: [
    CommonModule,
    IconModule
  ],
  declarations: [
    IbmIconComponent
  ],
  exports: [
    IbmIconComponent,
    IconModule
  ],
  
})
export class IbmIconModule {
  constructor(protected iconService: IconService) {
    iconService.registerAll([
			Notification32,
			Notification24,
			Notification20,
			Notification16,
			UserAvatar32,
			UserAvatar24,
			UserAvatar20,
			UserAvatar20,
      Home32,
			Home24,
			Home20,
			Home16,
      ArrowRight32,
      ArrowRight24,
      ArrowRight20,
      ArrowRight16,

      ArrowLeft32,
      ArrowLeft24,
      ArrowLeft20,
      ArrowLeft16,

      ArrowUp32,
      ArrowUp24,
      ArrowUp20,
      Arrowup16,

      ArrowDown32,
      ArrowDown24,
      ArrowDown20,
      ArrowDown16

		]);
  } 
}
