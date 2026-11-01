import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Error404Component } from './error404.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('Error404Component', () => {
  let fixture: ComponentFixture<Error404Component>;

  beforeEach(async () => {
    await configureSmokeTest(Error404Component, { standalone: true });
    fixture = TestBed.createComponent(Error404Component);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
