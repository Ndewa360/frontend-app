import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EchartsContainerComponent } from './echarts-container.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('EchartsContainerComponent', () => {
  let fixture: ComponentFixture<EchartsContainerComponent>;

  beforeEach(async () => {
    await configureSmokeTest(EchartsContainerComponent, { standalone: true });
    fixture = TestBed.createComponent(EchartsContainerComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
