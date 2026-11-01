import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppLayoutHeaderComponent } from './app-layout-header.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('AppLayoutHeaderComponent', () => {
  let fixture: ComponentFixture<AppLayoutHeaderComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppLayoutHeaderComponent, { standalone: true });
    fixture = TestBed.createComponent(AppLayoutHeaderComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
