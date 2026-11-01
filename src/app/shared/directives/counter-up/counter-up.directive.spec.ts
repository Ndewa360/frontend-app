import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CountUpDirective } from './counter-up.directive';

@Component({
  standalone: true,
  imports: [CountUpDirective],
  template: '<div appCountUp></div>',
})
class HostComponent {}

describe('CountUpDirective', () => {
  it('should create an instance', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
