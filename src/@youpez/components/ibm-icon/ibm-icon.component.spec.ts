import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IbmIconComponent } from './ibm-icon.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('IbmIconComponent', () => {
  let fixture: ComponentFixture<IbmIconComponent>;

  beforeEach(async () => {
    await configureSmokeTest(IbmIconComponent, { standalone: true });
    fixture = TestBed.createComponent(IbmIconComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
