import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppSearchComponent } from './app-search.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('AppSearchComponent', () => {
  let fixture: ComponentFixture<AppSearchComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppSearchComponent, { standalone: true });
    fixture = TestBed.createComponent(AppSearchComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
