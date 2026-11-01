import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppHeaderToolsComponent } from './app-header-tools.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AppHeaderToolsComponent', () => {
  let fixture: ComponentFixture<AppHeaderToolsComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppHeaderToolsComponent, { standalone: true });
    fixture = TestBed.createComponent(AppHeaderToolsComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
