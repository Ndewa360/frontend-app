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

import AddAlt32 from '@carbon/icons/es/add--alt/32';
import AddAlt24 from '@carbon/icons/es/add--alt/24';
import AddAlt20 from '@carbon/icons/es/add--alt/20';
import AddAlt16 from '@carbon/icons/es/add--alt/16';

import Hotel32 from '@carbon/icons/es/hotel/32';
import Hotel24 from '@carbon/icons/es/hotel/24';
import Hotel20 from '@carbon/icons/es/hotel/20';
import Hotel16 from '@carbon/icons/es/hotel/16';

import UserAvatar32 from '@carbon/icons/es/user--avatar/32';
import UserAvatar24 from '@carbon/icons/es/user--avatar/24';
import UserAvatar20 from '@carbon/icons/es/user--avatar/20';
import UserAvatar16 from '@carbon/icons/es/user--avatar/16';

import User32 from '@carbon/icons/es/user/32';
import User24 from '@carbon/icons/es/user/24';
import User20 from '@carbon/icons/es/user/20';
import User16 from '@carbon/icons/es/user/16';

import UserAdd32 from '@carbon/icons/es/user--follow/32';
import UserAdd24 from '@carbon/icons/es/user--follow/24';
import UserAdd20 from '@carbon/icons/es/user--follow/20';
import UserAdd16 from '@carbon/icons/es/user--follow/16';


import Pen32 from '@carbon/icons/es/pen/32';
import Pen24 from '@carbon/icons/es/pen/24';
import Pen20 from '@carbon/icons/es/pen/20';
import Pen16 from '@carbon/icons/es/pen/16';

// import assetMovement32 from '@carbon/icons/es/asset-movement/32';
// import assetMovement24 from '@carbon/icons/es/asset-movement/24';
// import assetMovement20 from '@carbon/icons/es/asset-movement/20';
// import assetMovement16 from '@carbon/icons/es/asset-movement/16';

import Catalog32 from '@carbon/icons/es/catalog/32';
import Catalog24 from '@carbon/icons/es/catalog/24';
import Catalog20 from '@carbon/icons/es/catalog/20';
import Catalog16 from '@carbon/icons/es/catalog/16';

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

import TriangleLeftSolid32 from '@carbon/icons/es/triangle--left--solid/32';
import TriangleLeftSolid24 from '@carbon/icons/es/triangle--left--solid/24';
import TriangleLeftSolid20 from '@carbon/icons/es/triangle--left--solid/20';
import TriangleLeftSolid16 from '@carbon/icons/es/triangle--left--solid/16';

import TriangleRightSolid32 from '@carbon/icons/es/triangle--right--solid/32';
import TriangleRightSolid24 from '@carbon/icons/es/triangle--right--solid/24';
import TriangleRightSolid20 from '@carbon/icons/es/triangle--right--solid/20';
import TriangleRightSolid16 from '@carbon/icons/es/triangle--right--solid/16';

import TriangleUpSolid32 from '@carbon/icons/es/triangle--solid/32';
import TriangleUpSolid24 from '@carbon/icons/es/triangle--solid/24';
import TriangleUpSolid20 from '@carbon/icons/es/triangle--solid/20';
import TriangleUpSolid16 from '@carbon/icons/es/triangle--solid/16';

import TriangleDownSolid32 from '@carbon/icons/es/triangle--down--solid/32';
import TriangleDownSolid24 from '@carbon/icons/es/triangle--down--solid/24';
import TriangleDownSolid20 from '@carbon/icons/es/triangle--down--solid/20';
import TriangleDownSolid16 from '@carbon/icons/es/triangle--down--solid/16';



import DocumentAttachment32 from '@carbon/icons/es/document--attachment/32';
import DocumentAttachment24 from '@carbon/icons/es/document--attachment/24';
import DocumentAttachment20 from '@carbon/icons/es/document--attachment/20';
import DocumentAttachment16 from '@carbon/icons/es/document--attachment/16';

import ArrowDown32 from '@carbon/icons/es/arrow--down/32';
import ArrowDown24 from '@carbon/icons/es/arrow--down/24';
import ArrowDown20 from '@carbon/icons/es/arrow--down/20';
import ArrowDown16 from '@carbon/icons/es/arrow--down/16';

import Error32 from '@carbon/icons/es/error/32';
import Error24 from '@carbon/icons/es/error/24';
import Error20 from '@carbon/icons/es/error/20';
import Error16 from '@carbon/icons/es/error/16';

import Home32 from '@carbon/icons/es/home/32';
import Home24 from '@carbon/icons/es/home/24';
import Home20 from '@carbon/icons/es/home/20';
import Home16 from '@carbon/icons/es/home/16';

import Menu32 from '@carbon/icons/es/menu/32';
import Menu24 from '@carbon/icons/es/menu/24';
import Menu20 from '@carbon/icons/es/menu/20';
import Menu16 from '@carbon/icons/es/menu/16';

import Search32 from '@carbon/icons/es/search/32';
import Search24 from '@carbon/icons/es/search/24';
import Search20 from '@carbon/icons/es/search/20';
import Search16 from '@carbon/icons/es/search/16';

import DashboardReference32 from '@carbon/icons/es/dashboard/32';
import DashboardReference24 from '@carbon/icons/es/dashboard/24';
import DashboardReference20 from '@carbon/icons/es/dashboard/20';
import DashboardReference16 from '@carbon/icons/es/dashboard/16';

import ContourFinding32 from '@carbon/icons/es/watson-health/contour-finding/32';
import ContourFinding24 from '@carbon/icons/es/watson-health/contour-finding/24';
import ContourFinding20 from '@carbon/icons/es/watson-health/contour-finding/20';
import ContourFinding16 from '@carbon/icons/es/watson-health/contour-finding/16';

import Task32 from '@carbon/icons/es/task/32';
import Task24 from '@carbon/icons/es/task/24';
import Task20 from '@carbon/icons/es/task/20';
import Task16 from '@carbon/icons/es/task/16';

import Help32 from '@carbon/icons/es/help/32';
import Help24 from '@carbon/icons/es/help/24';
import Help20 from '@carbon/icons/es/help/20';
import Help16 from '@carbon/icons/es/help/16';

import Folder32 from '@carbon/icons/es/folder/32';
import Folder24 from '@carbon/icons/es/folder/24';
import Folder20 from '@carbon/icons/es/folder/20';
import Folder16 from '@carbon/icons/es/folder/16';

import Email32 from '@carbon/icons/es/email/32';
import Email24 from '@carbon/icons/es/email/24';
import Email20 from '@carbon/icons/es/email/20';
import Email16 from '@carbon/icons/es/email/16';

import SendAlt32 from '@carbon/icons/es/send--alt/32';
import SendAlt24 from '@carbon/icons/es/send--alt/24';
import SendAlt20 from '@carbon/icons/es/send--alt/20';
import SendAlt16 from '@carbon/icons/es/send--alt/16';

import FaceActived32 from '@carbon/icons/es/face--activated/32';
import FaceActived24 from '@carbon/icons/es/face--activated/24';
import FaceActived20 from '@carbon/icons/es/face--activated/20';
import FaceActived16 from '@carbon/icons/es/face--activated/16';

import Chat32 from '@carbon/icons/es/chat/32';
import Chat24 from '@carbon/icons/es/chat/24';
import Chat20 from '@carbon/icons/es/chat/20';
import Chat16 from '@carbon/icons/es/chat/16';

import CloudApp32 from '@carbon/icons/es/cloud-app/32';
import CloudApp24 from '@carbon/icons/es/cloud-app/24';
import CloudApp20 from '@carbon/icons/es/cloud-app/20';
import CloudApp16 from '@carbon/icons/es/cloud-app/16';

import Bullhorn32 from '@carbon/icons/es/bullhorn/32';
import Bullhorn24 from '@carbon/icons/es/bullhorn/24';
import Bullhorn20 from '@carbon/icons/es/bullhorn/20';
import Bullhorn16 from '@carbon/icons/es/bullhorn/16';

import BuildingInsights132 from '@carbon/icons/es/building--insights-1/32';
import BuildingInsights124 from '@carbon/icons/es/building--insights-1/24';
import BuildingInsights120 from '@carbon/icons/es/building--insights-1/20';
import BuildingInsights116 from '@carbon/icons/es/building--insights-1/16';

import Activity32 from '@carbon/icons/es/activity/32';
import Activity24 from '@carbon/icons/es/activity/24';
import Activity20 from '@carbon/icons/es/activity/20';
import Activity16 from '@carbon/icons/es/activity/16';

import Tag32 from '@carbon/icons/es/tag/32';
import Tag24 from '@carbon/icons/es/tag/24';
import Tag20 from '@carbon/icons/es/tag/20';
import Tag16 from '@carbon/icons/es/tag/16';

import Add32 from '@carbon/icons/es/add/32';
import Add24 from '@carbon/icons/es/add/24';
import Add20 from '@carbon/icons/es/add/20';
import Add16 from '@carbon/icons/es/add/16';

import Renew32 from '@carbon/icons/es/renew/32';
import Renew24 from '@carbon/icons/es/renew/24';
import Renew20 from '@carbon/icons/es/renew/20';
import Renew16 from '@carbon/icons/es/renew/16';

import Settings32 from '@carbon/icons/es/settings/32';
import Settings24 from '@carbon/icons/es/settings/24';
import Settings20 from '@carbon/icons/es/settings/20';
import Settings16 from '@carbon/icons/es/settings/16';

import TableOfContents32 from '@carbon/icons/es/table-of-contents/32';
import TableOfContents24 from '@carbon/icons/es/table-of-contents/24';
import TableOfContents20 from '@carbon/icons/es/table-of-contents/20';
import TableOfContents16 from '@carbon/icons/es/table-of-contents/16';

import Edit32 from '@carbon/icons/es/edit/32';
import Edit24 from '@carbon/icons/es/edit/24';
import Edit20 from '@carbon/icons/es/edit/20';
import Edit16 from '@carbon/icons/es/edit/16';

import TrashCan32 from '@carbon/icons/es/trash-can/32';
import TrashCan24 from '@carbon/icons/es/trash-can/24';
import TrashCan20 from '@carbon/icons/es/trash-can/20';
import TrashCan16 from '@carbon/icons/es/trash-can/16';

import Printer32 from '@carbon/icons/es/printer/32';
import Printer24 from '@carbon/icons/es/printer/24';
import Printer20 from '@carbon/icons/es/printer/20';
import Printer16 from '@carbon/icons/es/printer/16';

import UserIdentification32 from '@carbon/icons/es/user--identification/32';
import UserIdentification24 from '@carbon/icons/es/user--identification/24';
import UserIdentification20 from '@carbon/icons/es/user--identification/20';
import UserIdentification16 from '@carbon/icons/es/user--identification/16';

import CheckMarkOutline32 from '@carbon/icons/es/checkmark--outline/32';
import CheckMarkOutline24 from '@carbon/icons/es/checkmark--outline/24';
import CheckMarkOutline20 from '@carbon/icons/es/checkmark--outline/20';
import CheckMarkOutline16 from '@carbon/icons/es/checkmark--outline/16';

import CheckMark32 from '@carbon/icons/es/checkmark/32';
import CheckMark24 from '@carbon/icons/es/checkmark/24';
import CheckMark20 from '@carbon/icons/es/checkmark/20';
import CheckMark16 from '@carbon/icons/es/checkmark/16';

import warningMarkOutline32 from '@carbon/icons/es/warning/32';
import warningMarkOutline24 from '@carbon/icons/es/warning/24';
import warningMarkOutline20 from '@carbon/icons/es/warning/20';
import warningMarkOutline16 from '@carbon/icons/es/warning/16';


import Save32 from '@carbon/icons/es/save/32';
import Save24 from '@carbon/icons/es/save/24';
import Save20 from '@carbon/icons/es/save/20';
import Save16 from '@carbon/icons/es/save/16';

import Document32 from '@carbon/icons/es/document/32';
import Document24 from '@carbon/icons/es/document/24';
import Document20 from '@carbon/icons/es/document/20';
import Document16 from '@carbon/icons/es/document/16';

import Share32 from '@carbon/icons/es/share/32';
import Share24 from '@carbon/icons/es/share/24';
import Share20 from '@carbon/icons/es/share/20';
import Share16 from '@carbon/icons/es/share/16';

import Download32 from '@carbon/icons/es/download/32';
import Download24 from '@carbon/icons/es/download/24';
import Download20 from '@carbon/icons/es/download/20';
import Download16 from '@carbon/icons/es/download/16';


import View32 from '@carbon/icons/es/view/32';
import View24 from '@carbon/icons/es/view/24';
import View20 from '@carbon/icons/es/view/20';
import View16 from '@carbon/icons/es/view/16';


import Money32 from '@carbon/icons/es/money/32';
import Money24 from '@carbon/icons/es/money/24';
import Money20 from '@carbon/icons/es/money/20';
import Money16 from '@carbon/icons/es/money/16';

import Location32 from '@carbon/icons/es/location/32';
import Location24 from '@carbon/icons/es/location/24';
import Location20 from '@carbon/icons/es/location/20';
import Location16 from '@carbon/icons/es/location/16';

import Close32 from '@carbon/icons/es/close/32';
import Close24 from '@carbon/icons/es/close/24';
import Close20 from '@carbon/icons/es/close/20';
import Close16 from '@carbon/icons/es/close/16';

import CloseOutline32 from '@carbon/icons/es/close--outline/32';
import CloseOutline24 from '@carbon/icons/es/close--outline/24';
import CloseOutline20 from '@carbon/icons/es/close--outline/20';
import CloseOutline16 from '@carbon/icons/es/close--outline/16';

import Minimize32 from '@carbon/icons/es/minimize/32';
import Minimize24 from '@carbon/icons/es/minimize/24';
import Minimize20 from '@carbon/icons/es/minimize/20';
import Minimize16 from '@carbon/icons/es/minimize/16';

import Maximize32 from '@carbon/icons/es/maximize/32';
import Maximize24 from '@carbon/icons/es/maximize/24';
import Maximize20 from '@carbon/icons/es/maximize/20';
import Maximize16 from '@carbon/icons/es/minimize/16';

import ChevronUp32 from '@carbon/icons/es/chevron--up/32';
import ChevronUp24 from '@carbon/icons/es/chevron--up/24';
import ChevronUp20 from '@carbon/icons/es/chevron--up/20';
import ChevronUp16 from '@carbon/icons/es/chevron--up/16';

import ChevronDown32 from '@carbon/icons/es/chevron--down/32';
import ChevronDown24 from '@carbon/icons/es/chevron--down/24';
import ChevronDown20 from '@carbon/icons/es/chevron--down/20';
import ChevronDown16 from '@carbon/icons/es/chevron--down/16';

import ChevronDownOutline32 from '@carbon/icons/es/chevron--down--outline/32';
import ChevronDownOutline24 from '@carbon/icons/es/chevron--down--outline/24';
import ChevronDownOutline20 from '@carbon/icons/es/chevron--down--outline/20';
import ChevronDownOutline16 from '@carbon/icons/es/chevron--down--outline/16';

import ChevronUpdOutline32 from '@carbon/icons/es/chevron--up--outline/32';
import ChevronUpdOutline24 from '@carbon/icons/es/chevron--up--outline/24';
import ChevronUpdOutline20 from '@carbon/icons/es/chevron--up--outline/20';
import ChevronUpdOutline16 from '@carbon/icons/es/chevron--up--outline/16';

import ChevronLeft32 from '@carbon/icons/es/chevron--left/32';
import ChevronLeft24 from '@carbon/icons/es/chevron--left/24';
import ChevronLeft20 from '@carbon/icons/es/chevron--left/20';
import ChevronLeft16 from '@carbon/icons/es/chevron--left/16';

import ChevronRight32 from '@carbon/icons/es/chevron--right/32';
import ChevronRight24 from '@carbon/icons/es/chevron--right/24';
import ChevronRight20 from '@carbon/icons/es/chevron--right/20';
import ChevronRight16 from '@carbon/icons/es/chevron--right/16';

import SettingsAdjust32 from '@carbon/icons/es/settings--adjust/32';
import SettingsAdjust24 from '@carbon/icons/es/settings--adjust/24';
import SettingsAdjust20 from '@carbon/icons/es/settings--adjust/20';
import SettingsAdjust16 from '@carbon/icons/es/settings--adjust/16';

import UserAccessUnlock32 from '@carbon/icons/es/user--access-unlocked/32';
import UserAccessUnlock24 from '@carbon/icons/es/user--access-unlocked/24';
import UserAccessUnlock20 from '@carbon/icons/es/user--access-unlocked/20';
import UserAccessUnlock16 from '@carbon/icons/es/user--access-unlocked/16';

import DropPhoto32 from '@carbon/icons/es/drop-photo/32';
import DropPhoto24 from '@carbon/icons/es/drop-photo/24';
import DropPhoto20 from '@carbon/icons/es/drop-photo/20';
import DropPhoto16 from '@carbon/icons/es/drop-photo/16';



import Map32 from '@carbon/icons/es/map/32';
import Map24 from '@carbon/icons/es/map/24';
import Map20 from '@carbon/icons/es/map/20';
import Map16 from '@carbon/icons/es/map/16';

import CloudUpload32 from '@carbon/icons/es/cloud--upload/32';
import CloudUpload24 from '@carbon/icons/es/cloud--upload/24';
import CloudUpload20 from '@carbon/icons/es/cloud--upload/20';
import CloudUpload16 from '@carbon/icons/es/cloud--upload/16';

import Hospital32 from '@carbon/icons/es/hospital/32';
import Hospital24 from '@carbon/icons/es/hospital/24';
import Hospital20 from '@carbon/icons/es/hospital/20';
import Hospital16 from '@carbon/icons/es/hospital/16';


import {IbmIconComponent} from './ibm-icon.component'
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@NgModule({
  imports: [
    CommonModule,
    IconModule,
  ],
  declarations: [
    IbmIconComponent
  ],
  exports: [
    IbmIconComponent,
    IconModule,
  ],
  
})
export class IbmIconModule {
  constructor(
    protected iconService: IconService,
    private _domSanitizer: DomSanitizer,
    private _matIconRegistry: MatIconRegistry
  ) {
    iconService.registerAll([
		SettingsAdjust32,
		SettingsAdjust24,
		SettingsAdjust20,
		SettingsAdjust16,

		Hospital32,
		Hospital24,
		Hospital20,
		Hospital16,

		CloudUpload32,
		CloudUpload24,
		CloudUpload20,
		CloudUpload16,

		UserAccessUnlock32,
		UserAccessUnlock24,
		UserAccessUnlock20,
		UserAccessUnlock16,

		UserAdd32,
		UserAdd24,
		UserAdd20,
		UserAdd16,

		DropPhoto32,
		DropPhoto24,
		DropPhoto20,
		DropPhoto16,

		ChevronUpdOutline32,
		ChevronUpdOutline24,
		ChevronUpdOutline20,
		ChevronUpdOutline16,

		CloseOutline32,
		CloseOutline24,
		CloseOutline20,
		CloseOutline16,
		
		AddAlt32,
		AddAlt24,
		AddAlt20,
		AddAlt16,

		Hotel32,
		Hotel24,
		Hotel20,
		Hotel16,

		// assetMovement32,
		// assetMovement24,
		// assetMovement20,
		// assetMovement16,

		Catalog32,
		Catalog24,
		Catalog20,
		Catalog16,

		ChevronDownOutline32,
		ChevronDownOutline24,
		ChevronDownOutline20,
		ChevronDownOutline16,

		ChevronUp32,
		ChevronUp24,
		ChevronUp20,
		ChevronUp16,

		ChevronDown32,
		ChevronDown24,
		ChevronDown20,
		ChevronDown16,

		ChevronLeft32,
		ChevronLeft24,
		ChevronLeft20,
		ChevronLeft16,

		ChevronRight32,
		ChevronRight24,
		ChevronRight20,
		ChevronRight16,
		
		Map32,
		Map24,
		Map20,
		Map16,

		Minimize32,
		Minimize24,
		Minimize20,
		Minimize16,

		Maximize32,
		Maximize24,
		Maximize20,
		Maximize16,

      Pen32,
			Pen24,
			Pen20,
			Pen16,
      
      TriangleDownSolid32,
			TriangleDownSolid24,
			TriangleDownSolid20,
			TriangleDownSolid16,

      TriangleUpSolid32,
			TriangleUpSolid24,
			TriangleUpSolid20,
			TriangleUpSolid16,

      TriangleLeftSolid32,
			TriangleLeftSolid24,
			TriangleLeftSolid20,
			TriangleLeftSolid16,

      TriangleRightSolid32,
			TriangleRightSolid24,
			TriangleRightSolid20,
			TriangleRightSolid16,

      Printer32,
			Printer24,
			Printer20,
			Printer16,

      DocumentAttachment32,
			DocumentAttachment24,
			DocumentAttachment20,
			DocumentAttachment16,

			FaceActived32,
			FaceActived24,
			FaceActived20,
			FaceActived16,

      Save32,
			Save24,
			Save20,
			Save16,

      CloudApp32,
			CloudApp24,
			CloudApp20,
			CloudApp16,

      TrashCan32,
			TrashCan24,
			TrashCan20,
			TrashCan16,

      Share32,
			Share24,
			Share20,
			Share16,

      UserIdentification32,
			UserIdentification24,
			UserIdentification20,
			UserIdentification16,

      CheckMarkOutline32,
			CheckMarkOutline24,
			CheckMarkOutline20,
			CheckMarkOutline16,

		CheckMark32,
		CheckMark24,
		CheckMark20,
		CheckMark16,

      warningMarkOutline32,
			warningMarkOutline24,
			warningMarkOutline20,
			warningMarkOutline16,

      
      Download32,
			Download24,
			Download20,
			Download16,

      Document32,
			Document24,
			Document20,
			Document16,

      View32,
			View24,
			View20,
			View16,

      Edit32,
			Edit24,
			Edit20,
			Edit16,

      TableOfContents32,
			TableOfContents24,
			TableOfContents20,
			TableOfContents16,

      Location32,
			Location24,
			Location20,
			Location16,

      Money32,
			Money24,
			Money20,
			Money16,

      Close32,
			Close24,
			Close20,
			Close16,

      Error32,
			Error24,
			Error20,
			Error16,

      Settings32,
			Settings24,
			Settings20,
			Settings16,

      Activity32,
			Activity24,
			Activity20,
			Activity16,

      Renew32,
			Renew24,
			Renew20,
			Renew16,

      Add32,
			Add24,
			Add20,
			Add16,

      Tag32,
			Tag24,
			Tag20,
			Tag16,

      BuildingInsights132,
      BuildingInsights124,
			BuildingInsights120,
			BuildingInsights116,

      Bullhorn32,
			Bullhorn24,
			Bullhorn20,
			Bullhorn16,

      Chat32,
			Chat24,
			Chat20,
			Chat16,

      Help32,
			Help24,
			Help20,
			Help16,

      Notification32,
			Notification24,
			Notification20,
			Notification16,

			UserAvatar32,
			UserAvatar24,
			UserAvatar20,
			UserAvatar16,

      User32,
			User24,
			User20,
			User16,

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
      ArrowDown16,

      Menu32,
      Menu24,
      Menu20,
      Menu16,

      Search32,
      Search24,
      Search20,
      Search16,

      ContourFinding32,
      ContourFinding24,
      ContourFinding20,
      ContourFinding16,

      DashboardReference32,
      DashboardReference24,
      DashboardReference20,
      DashboardReference16,

      Task32,
      Task24,
      Task20,
      Task16,

      Folder32,
      Folder24,
      Folder20,
      Folder16,

      Email32,
      Email24,
      Email20,
      Email16,

      SendAlt32,
      SendAlt24,
      SendAlt20,
      SendAlt16,

		]);

    // Register icon sets
    this._matIconRegistry.addSvgIconSet(this._domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/material-twotone.svg'));
    this._matIconRegistry.addSvgIconSetInNamespace('mat_outline', this._domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/material-outline.svg'));
    this._matIconRegistry.addSvgIconSetInNamespace('mat_solid', this._domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/material-solid.svg'));
    this._matIconRegistry.addSvgIconSetInNamespace('feather', this._domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/feather.svg'));
    this._matIconRegistry.addSvgIconSetInNamespace('heroicons_outline', this._domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/heroicons-outline.svg'));
    this._matIconRegistry.addSvgIconSetInNamespace('heroicons_solid', this._domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/heroicons-solid.svg'));
  } 
}
