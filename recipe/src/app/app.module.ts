import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { environment } from '../environments/environment';
import { AuthEffects } from './auth/store/auth.effects';
import * as fromApp from './store/app.reducer';
import { CoreModule } from './core.module';
import { SharedModule } from './shared/shared.module';
import { HeaderComponent } from './header/header.component';

@NgModule( {
  declarations: [
    AppComponent,
    HeaderComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    StoreModule.forRoot( fromApp.appReducer ),
    EffectsModule.forRoot( [ AuthEffects ] ),
    StoreDevtoolsModule.instrument( { logOnly: environment.production } ),
    StoreRouterConnectingModule.forRoot(),
    SharedModule,
    CoreModule
  ],
  bootstrap: [ AppComponent ]
} )
export class AppModule {
}
