import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyFinanceComponent } from './property-finance.component';

describe('PropertyFinanceComponent', () => {
  let component: PropertyFinanceComponent;
  let fixture: ComponentFixture<PropertyFinanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyFinanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyFinanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
