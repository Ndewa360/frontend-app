import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyRoomComponent } from './property-room.component';

describe('PropertyRoomComponent', () => {
  let component: PropertyRoomComponent;
  let fixture: ComponentFixture<PropertyRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyRoomComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
