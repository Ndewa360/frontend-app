import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocatairePropertyTableComponent } from './locataire-property-table.component';

describe('LocatairePropertyTableComponent', () => {
  let component: LocatairePropertyTableComponent;
  let fixture: ComponentFixture<LocatairePropertyTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocatairePropertyTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LocatairePropertyTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
