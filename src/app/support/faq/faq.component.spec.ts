import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaqComponent } from './faq.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('FaqComponent', () => {
  let fixture: ComponentFixture<FaqComponent>;

  beforeEach(async () => {
    await configureSmokeTest(FaqComponent, { standalone: true });
    fixture = TestBed.createComponent(FaqComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
