import { Component, AfterViewInit, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { trigger, state, transition, animate, style } from '@angular/animations';
import { FormControl } from '@angular/forms';
import { HttpService } from '../http.service';
import { ModalService } from '../modal.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  animations: [
    trigger('showBtn', [
      state('true', style({
        opacity: 1,
      })),
      state('false', style({
        opacity: 0.5,
      })),
      transition('* => *', [
        animate('0.5s')
      ]),
    ]),
    trigger('loginChosen', [
      state('false', style({
        transform: 'translateX(100%)',
        opacity: 0,
      })),
      state('true', style({
        transform: 'translateX(0)',
        opacity: 1,
      })),
      transition('* => true', [
        animate('0.5s')
      ]),
      transition('true => false', [
        animate('0.5s')
      ]),
    ]),
    trigger('signUpChosen', [
      state('false', style({
        transform: 'translateX(-100%)',
        opacity: 0,
      })),
      state('true', style({
        transform: 'translateX(0)',
        opacity: 1,
      })),
      transition('* => true', [
        animate('0.5s')
      ]),
      transition('true => false', [
        animate('0.5s')
      ]),
    ]),
  ],
})
export class WelcomeComponent implements OnInit, AfterViewInit, OnDestroy {
  showSignUp = true;
  showLogin = true;
  signUpFields = false;
  loginFields = false;
  loggedIn = false;
  inputFields = 'none';
  siteHeader = 'Find Your Place';
  signUpText = 'New?';
  loginText = 'Login';
  signUpMsg = 'Join Us!';
  logoutMsg = 'Logout';
  signUpBtnMsg = 'Sign Me Up';
  loginBtnMsg = 'Let\'s Go';
  cookiesHeader = 'Your cookies are disabled!';
  cookiesMsg = 'Please enable your cookies, otherwise our site may not function correctly.';
  cookiesBtnMsg = 'Got it!';
  errorMsg: string;
  signUpUser = new FormControl('');
  signUpPass = new FormControl('');
  loginUser = new FormControl('');
  loginPass = new FormControl('');
  @Output() userLoggedIn = new EventEmitter<boolean>();

  constructor(private httpService: HttpService, private modalService: ModalService) {}

  ngOnInit() {
    if(!!localStorage.getItem('userId')) {
      this.loggedIn = true;
      this.userLoggedIn.emit(true);
    } else {
      this.userLoggedIn.emit(false);
    };
  }

  ngAfterViewInit() {
    if (!navigator.cookieEnabled) { 
      this.openModal('cookies-modal');
    };
  }

  signUp() {
    this.loginFields = false;
    this.signUpFields = true;
  }

  login() {
    this.signUpFields = false;
    this.loginFields = true;
  }

  submitSignUp() {
    // Check if user exists already
    this.httpService.isUsernameTaken(this.signUpUser).subscribe((res:boolean) => {
      // If user name is NOT taken
      if(!res) {
        this.httpService.createNewUser(this.signUpUser, this.signUpPass).subscribe((res:any) => {
          // Using localstorage instead of cookies so can use js instead of thru server
          // localstorage bad for sensitive data but it's really just user history here...
          localStorage.setItem('userId', res.insertedId);
          this.loggedIn = true;
          this.errorMsg = null;
          this.userLoggedIn.emit(true);
          // Reset form fields after submission
          this.signUpFields = false;
          this.signUpUser.reset();
          this.signUpPass.reset();
        },(err) => {
          console.error(err);
          this.errorMsg = 'We\'re sorry, an error occurred while trying to set up your account. Please try again later';
        });
      } else {
        this.errorMsg = 'We\'re sorry, that username is taken.';
      }
    },(err) => {
      console.error(err);
      this.errorMsg = 'We\'re sorry, an error occurred while trying to set up your account. Please try again later';
    });
  }

  submitLogin() {
    this.httpService.login(this.loginUser, this.loginPass).subscribe((res:any) => {
      // Dont let user login if password is wrong
      if (!!res.loginFailed) {
        this.errorMsg = res.loginFailed;
      } else {
        localStorage.setItem('userId', res._id);
        this.loggedIn = true;
        this.errorMsg = null;
        this.userLoggedIn.emit(true);
        // Reset form fields after submission
        this.loginFields = false;
        this.loginUser.reset();
        this.loginPass.reset();
      }
    },(err) => {
      console.error(err);
      this.errorMsg = 'We\'re sorry, an error occurred while trying to log you in. Please try again later';
    });
  }

  openModal(id: string) {
    this.modalService.open(id);
  }

  closeModal(id: string) {
      this.modalService.close(id);
  }

  logout() {
    localStorage.removeItem('userId');
    this.loggedIn = false;
    this.errorMsg = null;
    this.userLoggedIn.emit(false);
  }

  ngOnDestroy() {
    this.logout();
  }
}
