import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListPropertyComponent } from './list-property.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('ListPropertyComponent', () => {
  let fixture: ComponentFixture<ListPropertyComponent>;

  beforeEach(async () => {
    await configureSmokeTest(ListPropertyComponent, { standalone: true });
    fixture = TestBed.createComponent(ListPropertyComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
