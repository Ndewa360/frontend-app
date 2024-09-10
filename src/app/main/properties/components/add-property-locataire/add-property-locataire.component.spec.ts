import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPropertyLocataireComponent } from './add-property-locataire.component';

describe('AddPropertyLocataireComponent', () => {
  let component: AddPropertyLocataireComponent;
  let fixture: ComponentFixture<AddPropertyLocataireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPropertyLocataireComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPropertyLocataireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
