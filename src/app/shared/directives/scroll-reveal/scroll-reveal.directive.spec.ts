import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrollRevealDirective } from './scroll-reveal.directive';

@Component({
  standalone: true,
  imports: [ScrollRevealDirective],
  template: '<div appScrollReveal></div>',
})
class HostComponent {}

describe('ScrollRevealDirective', () => {
  it('should create an instance', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
