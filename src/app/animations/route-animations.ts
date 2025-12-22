import { trigger, transition, style, animate, query, group } from '@angular/animations';

export const routeFadeAnimation = trigger('routeFadeAnimation', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        inset: 0,
        width: '100%',
      }),
    ], { optional: true }),
    group([
      query(':leave', [
        animate(
          '180ms ease-in',
          style({
            opacity: 0,
            transform: 'scale(0.98) translateY(-4px)',
            filter: 'blur(4px)',
          })
        ),
      ], { optional: true }),
      query(':enter', [
        style({
          opacity: 0,
          transform: 'scale(0.98) translateY(6px)',
          filter: 'blur(8px)',
        }),
        animate(
          '260ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({
            opacity: 1,
            transform: 'scale(1) translateY(0)',
            filter: 'blur(0)',
          })
        ),
      ], { optional: true }),
    ]),
  ]),
]);
