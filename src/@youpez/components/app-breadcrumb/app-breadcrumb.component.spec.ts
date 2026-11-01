import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppBreadcrumbComponent } from './app-breadcrumb.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('AppBreadcrumbComponent', () => {
  let fixture: ComponentFixture<AppBreadcrumbComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppBreadcrumbComponent, { standalone: true });
    fixture = TestBed.createComponent(AppBreadcrumbComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
