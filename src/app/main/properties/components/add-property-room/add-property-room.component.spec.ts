import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPropertyRoomComponent } from './add-property-room.component';

describe('AddPropertyRoomComponent', () => {
  let component: AddPropertyRoomComponent;
  let fixture: ComponentFixture<AddPropertyRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPropertyRoomComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPropertyRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
