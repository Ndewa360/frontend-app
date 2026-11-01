import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualComponent } from './manual.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('ManualComponent', () => {
  let fixture: ComponentFixture<ManualComponent>;

  beforeEach(async () => {
    await configureSmokeTest(ManualComponent, { standalone: true });
    fixture = TestBed.createComponent(ManualComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
