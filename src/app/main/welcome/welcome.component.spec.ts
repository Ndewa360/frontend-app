import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WelcomeComponent } from './welcome.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('WelcomeComponent', () => {
  let fixture: ComponentFixture<WelcomeComponent>;

  beforeEach(async () => {
    await configureSmokeTest(WelcomeComponent, { standalone: true });
    fixture = TestBed.createComponent(WelcomeComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
