import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppHeaderTitleComponent } from './app-header-title.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AppHeaderTitleComponent', () => {
  let fixture: ComponentFixture<AppHeaderTitleComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppHeaderTitleComponent, { standalone: true });
    fixture = TestBed.createComponent(AppHeaderTitleComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
