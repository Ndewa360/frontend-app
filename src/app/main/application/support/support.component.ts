import { Component, OnInit } from '@angular/core';
import { ListItem } from 'carbon-components-angular';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnInit {

  public products: ListItem[]= [
    {
      content: "On Prem",
      id: "1",
      selected: true
    },
    {
      content: "Private cloud", 
      id: "2",
      selected: false
    },
    {
      content: "Hybrid cloud", 
      id: "3",
      selected: false
    },
    {
      content: "Platform trial", 
      id: "4",
      selected: false
    },
  ]

  public purchased:ListItem[] = [
    {
      content: "Store 1", id: "1",
      selected: true
    },
    {
      content: "Store 2", id: "2",
      selected: false
    },
    {
      content: "Store 3", id: "3",
      selected: false
    },
    {
      content: "Store 4", id: "4",
      selected: false
    },
  ]

  public server:ListItem[] = [
    {
      content: "full l", id: "1",
      selected: false
    },
    {
      content: "full 2", id: "2",
      selected: false
    },
    {
      content: "normal", id: "3",
      selected: false
    },
    {
      content: "basic", id: "4",
      selected: false
    },
  ]

  public countries = [

  ]
  public usStates = []

  constructor() { }

  ngOnInit(): void {
  }

}
