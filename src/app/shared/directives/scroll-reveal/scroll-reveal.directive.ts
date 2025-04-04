import {
  Directive,
  ElementRef,
  Renderer2,
  OnInit
} from '@angular/core';

@Directive({
  selector: '[appScrollReveal]'
})
export class ScrollRevealDirective implements OnInit {

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.renderer.addClass(this.el.nativeElement, 'revealed');
          observer.unobserve(this.el.nativeElement); // désactive après apparition
        }
      });
    }, {
      threshold: 0.1
    });

    observer.observe(this.el.nativeElement);
  }
}
