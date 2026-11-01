import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddPropertyComponent } from './add-property.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AddPropertyComponent', () => {
  let fixture: ComponentFixture<AddPropertyComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AddPropertyComponent, { standalone: true });
    fixture = TestBed.createComponent(AddPropertyComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
