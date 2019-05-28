import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { WelcomeComponent } from './welcome/welcome.component';
import { HttpClientModule } from '@angular/common/http';
import { SearchComponent } from './search/search.component';
import { ModalComponent } from './modal/modal.component';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    SearchComponent,
    ModalComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
