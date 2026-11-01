import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutComponent } from './layout.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('LayoutComponent', () => {
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(async () => {
    await configureSmokeTest(LayoutComponent, { standalone: true });
    fixture = TestBed.createComponent(LayoutComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
