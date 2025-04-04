import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appCountUp]'
})
export class CountUpDirective implements OnInit {

  @Input('appCountUp') targetNumber: number = 0;
  @Input() duration: number = 2000; // durée totale de l'animation (en ms)

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCount();
          observer.unobserve(this.el.nativeElement); // ne le fait qu'une fois
        }
      });
    });

    observer.observe(this.el.nativeElement);
  }

  animateCount() {
    const start = 0;
    const end = this.targetNumber;
    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(this.duration / range));
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      this.el.nativeElement.innerText = current + '+';

      if (current === end) {
        clearInterval(timer);
      }
    }, stepTime);
  }
}
