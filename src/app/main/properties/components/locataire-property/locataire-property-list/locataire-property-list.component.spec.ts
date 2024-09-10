import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocatairePropertyListComponent } from './locataire-property-list.component';

describe('LocatairePropertyListComponent', () => {
  let component: LocatairePropertyListComponent;
  let fixture: ComponentFixture<LocatairePropertyListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocatairePropertyListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LocatairePropertyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
