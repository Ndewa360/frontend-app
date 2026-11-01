import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppMenuItemComponent } from './app-menu-item.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AppMenuItemComponent', () => {
  let fixture: ComponentFixture<AppMenuItemComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppMenuItemComponent, { standalone: true });
    fixture = TestBed.createComponent(AppMenuItemComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
