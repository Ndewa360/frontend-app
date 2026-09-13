import {Component, OnInit, Input} from '@angular/core';
import { IconModule } from 'carbon-components-angular';
import { NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';

export declare type ibmIconSizeType = '16' | '20' | '24' | '32'

@Component({
  selector: 'youpez-ibm-icon',
  templateUrl: './ibm-icon.component.html',
  styleUrls: ['./ibm-icon.component.scss'],
  standalone: true,
  imports: [NgSwitch, NgSwitchCase, IconModule, NgSwitchDefault]
})
export class IbmIconComponent implements OnInit {

  @Input() iconName: string = '';
  @Input() iconSize: ibmIconSizeType = '24';
  @Input() iconClass: string = '';

  constructor() {
  }

  ngOnInit(): void {
  }

}
