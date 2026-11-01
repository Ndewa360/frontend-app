import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppMenuHeaderComponent } from './app-menu-header.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AppMenuHeaderComponent', () => {
  let fixture: ComponentFixture<AppMenuHeaderComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppMenuHeaderComponent, { standalone: true });
    fixture = TestBed.createComponent(AppMenuHeaderComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
