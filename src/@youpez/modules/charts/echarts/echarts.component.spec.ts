import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EchartsComponent } from './echarts.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('EchartsComponent', () => {
  let fixture: ComponentFixture<EchartsComponent>;

  beforeEach(async () => {
    await configureSmokeTest(EchartsComponent, { standalone: true });
    fixture = TestBed.createComponent(EchartsComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
