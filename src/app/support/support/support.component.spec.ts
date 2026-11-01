import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupportComponent } from './support.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('SupportComponent', () => {
  let fixture: ComponentFixture<SupportComponent>;

  beforeEach(async () => {
    await configureSmokeTest(SupportComponent, { standalone: true });
    fixture = TestBed.createComponent(SupportComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
