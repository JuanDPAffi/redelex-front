import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [],
  template: `
    <div class="splash" [class.is-hidden]="!visible">
      <img src="/Affi.png" alt="logo" class="splash-logo" />
    </div>
  `,
  styleUrls: ['./splash.component.scss']
})
export class SplashComponent {
  @Input() visible = true;
}