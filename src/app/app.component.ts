import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  loggedIn;

  loginCheck(loggedIn: boolean) {
    this.loggedIn = loggedIn;
  }
}
