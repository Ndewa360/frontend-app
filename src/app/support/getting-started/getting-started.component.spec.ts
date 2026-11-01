import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GettingStartedComponent } from './getting-started.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('GettingStartedComponent', () => {
  let fixture: ComponentFixture<GettingStartedComponent>;

  beforeEach(async () => {
    await configureSmokeTest(GettingStartedComponent, { standalone: true });
    fixture = TestBed.createComponent(GettingStartedComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
