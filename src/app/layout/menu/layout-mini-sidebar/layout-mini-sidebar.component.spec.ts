import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutMiniSidebarComponent } from './layout-mini-sidebar.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('LayoutMiniSidebarComponent', () => {
  let fixture: ComponentFixture<LayoutMiniSidebarComponent>;

  beforeEach(async () => {
    await configureSmokeTest(LayoutMiniSidebarComponent, { standalone: true });
    fixture = TestBed.createComponent(LayoutMiniSidebarComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
