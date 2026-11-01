import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppLayoutDividedFullComponent } from './app-layout-divided-full.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AppLayoutDividedFullComponent', () => {
  let fixture: ComponentFixture<AppLayoutDividedFullComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppLayoutDividedFullComponent, { standalone: true });
    fixture = TestBed.createComponent(AppLayoutDividedFullComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
