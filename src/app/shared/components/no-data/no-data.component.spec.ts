import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoDataComponent } from './no-data.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('NoDataComponent', () => {
  let fixture: ComponentFixture<NoDataComponent>;

  beforeEach(async () => {
    await configureSmokeTest(NoDataComponent, { standalone: true });
    fixture = TestBed.createComponent(NoDataComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
