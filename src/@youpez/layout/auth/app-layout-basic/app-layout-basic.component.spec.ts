import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppLayoutBasicComponent } from './app-layout-basic.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AppLayoutBasicComponent', () => {
  let fixture: ComponentFixture<AppLayoutBasicComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppLayoutBasicComponent, { standalone: true });
    fixture = TestBed.createComponent(AppLayoutBasicComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
