import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppContentSimpleComponent } from './app-content-simple.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AppContentSimpleComponent', () => {
  let fixture: ComponentFixture<AppContentSimpleComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppContentSimpleComponent, { standalone: true });
    fixture = TestBed.createComponent(AppContentSimpleComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
