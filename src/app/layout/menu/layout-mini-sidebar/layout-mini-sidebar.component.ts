import {Component, EventEmitter, OnInit, Output} from '@angular/core'

@Component({
  selector: 'app-layout-mini-sidebar',
  templateUrl: './layout-mini-sidebar.component.html',
  styleUrls: ['./layout-mini-sidebar.component.scss']
})
export class LayoutMiniSidebarComponent implements OnInit {

  @Output() itemClick: EventEmitter<any> = new EventEmitter()

  public notifications = [
    // {
    //   level: 'bug',
    //   text: 'Failed to get shared datastores in kubernetes cluster',
    //   date: '20m',
    // },
   
  ]
  public messages = [
    // {
    //   avatar: 'assets/img/avatar/avatar2.jpg',
    //   name: 'John Belinda',
    //   text: 'Cannot start service web: error while creating mount source path ',
    //   date: '5 mins ago',
    //   read: false,
    // },
  ]

  public loading: boolean = false

  constructor() {
  }

  ngOnInit(): void {
  }

  onItemClick(event) {
    this.itemClick.next(event)
  }

  onFakeLoading() {
    this.loading = true
    setTimeout(() => {
      this.loading = false
    }, 500)
  }

}
