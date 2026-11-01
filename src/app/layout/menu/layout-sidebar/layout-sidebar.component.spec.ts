import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutSidebarComponent } from './layout-sidebar.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('LayoutSidebarComponent', () => {
  let fixture: ComponentFixture<LayoutSidebarComponent>;

  beforeEach(async () => {
    await configureSmokeTest(LayoutSidebarComponent, { standalone: true });
    fixture = TestBed.createComponent(LayoutSidebarComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
