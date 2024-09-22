import { Component, Input } from '@angular/core';
import { CalculateLocationService } from 'src/app/shared/store';

@Component({
  selector: 'assign-location-stepper',
  templateUrl: './assign-location-stepper.component.html',
  styleUrls: ['./assign-location-stepper.component.css']
})
export class AssignLocationStepperComponent {
createLocation() {
throw new Error('Method not implemented.');
}

  @Input() orientation : "vertical" | "horizontal"= "horizontal"
  @Input() formTheme: string = 'light'
  @Input() formLayout: string = 'horizontal'
  @Input() roomList = [];
  @Input() locataireList = [];

  locataireForm:{
    locataire?: any,
    room?: any,
    entryDate?:Date
  } = {};
  public steps: any[] = [
    {
      text: "Billing",
      state: ["current"],
    },
    {
      text: "Credit card",
      state: ["incomplete"],
    },
    {
      text: "Summary",
      state: ["incomplete"],
    },
    {
      text: "Purchase",
      state: ["incomplete"]
    },
  ]
  public current = 0;

  

  constructor(
    private calculationLocationService:CalculateLocationService
  ) {
  }

  ngOnInit(): void {

  }

  stepSelected(event) {
    this.current = event.index
  }

  onGotoStep(step, valid) {
    if (valid) {
      this.current = step
    }
  }
  onSetLocataireFormData(locataireFormData)
  {
    this.locataireForm = locataireFormData;
  }

  calculateLocation(isValid)
  {
    if(!isValid) return;
    this.onGotoStep(1,isValid)

    console.log("Data ",this.calculationLocationService.initCalculateLocation(this.locataireForm));
  }
  
}
