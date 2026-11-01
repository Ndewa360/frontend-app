import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppLayoutHorizontalComponent } from './app-layout-horizontal.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AppLayoutHorizontalComponent', () => {
  let fixture: ComponentFixture<AppLayoutHorizontalComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppLayoutHorizontalComponent, { standalone: true });
    fixture = TestBed.createComponent(AppLayoutHorizontalComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
