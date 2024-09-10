import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyLocataireComponent } from './property-locataire.component';

describe('PropertyLocataireComponent', () => {
  let component: PropertyLocataireComponent;
  let fixture: ComponentFixture<PropertyLocataireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyLocataireComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyLocataireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
