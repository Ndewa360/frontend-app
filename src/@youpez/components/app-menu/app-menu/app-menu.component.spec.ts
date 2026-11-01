import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppMenuComponent } from './app-menu.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AppMenuComponent', () => {
  let fixture: ComponentFixture<AppMenuComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppMenuComponent, { standalone: true });
    fixture = TestBed.createComponent(AppMenuComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
