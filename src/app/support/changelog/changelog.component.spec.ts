import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangelogComponent } from './changelog.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('ChangelogComponent', () => {
  let fixture: ComponentFixture<ChangelogComponent>;

  beforeEach(async () => {
    await configureSmokeTest(ChangelogComponent, { standalone: true });
    fixture = TestBed.createComponent(ChangelogComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
