import { Component, inject, computed, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

@Component({
  selector: 'lib-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  readonly i18n = inject(I18nService);

  readonly heroWords = computed((): string[] => {
    const lang = this.i18n.lang();
    if (lang === 'de') return ['Zeugen', 'der', 'Geschichte'];
    if (lang === 'en') return ['Witnesses', 'of', 'History'];
    return ['شاهدان', 'تاریخ'];
  });

  constructor() {
    afterNextRender(() => this.initAnimations());
  }

  private async initAnimations(): Promise<void> {
    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);

    // Hero: stagger word reveal
    gsap.from('.hero-word', {
      y: 80,
      opacity: 0,
      duration: 1.1,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.2,
    });

    // Hero gold line expand
    gsap.from('.hero-line', {
      scaleX: 0,
      duration: 1.4,
      ease: 'expo.out',
      delay: 0.5,
      transformOrigin: 'left center',
    });

    // Hero Farsi text fade
    gsap.from('.hero-fa', {
      opacity: 0,
      duration: 1,
      ease: 'power2.out',
      delay: 0.8,
    });

    // Hero subtitle + CTA
    gsap.from(['.hero-subtitle', '.hero-cta'], {
      y: 30,
      opacity: 0,
      duration: 0.9,
      stagger: 0.15,
      ease: 'power2.out',
      delay: 1.0,
    });

    // Stats count-up on scroll
    document.querySelectorAll<HTMLElement>('.stat-number').forEach((el) => {
      const target = parseInt(el.dataset['target'] ?? '0', 10);
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 2.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.stats-section',
          start: 'top 70%',
          once: true,
        },
        onUpdate() {
          el.textContent = Math.round(obj.val).toString();
        },
      });
    });

    // About text stagger
    gsap.from('.about-text > *', {
      y: 50,
      opacity: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.about-section',
        start: 'top 75%',
        once: true,
      },
    });

    // Mission blocks
    gsap.from('.mission-block', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.mission-grid',
        start: 'top 75%',
        once: true,
      },
    });

    // CTA
    gsap.from('.cta-content > *', {
      y: 40,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.cta-section',
        start: 'top 75%',
        once: true,
      },
    });
  }
}
