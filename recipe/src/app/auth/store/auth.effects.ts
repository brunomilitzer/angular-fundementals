import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Actions, Effect, ofType } from '@ngrx/effects';
import * as AuthActions from './auth.actions';
import { environment } from '../../../environments/environment';
import { User } from '../user.model';
import { AuthService } from '../auth.service';

export interface AuthResponseData {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

const handleAuthentication = ( email: string, userId: string, token: string, expiresIn: number ) => {
  const expirationDate = new Date( new Date().getTime() + +expiresIn * 1000 );
  const user = new User( email, userId, token, expirationDate );
  localStorage.setItem( 'userData', JSON.stringify( user ) );

  return new AuthActions.AuthenticationSuccess( {
    email,
    userId,
    token,
    expirationDate,
    redirect: true
  } );
};

const handleError = ( errorRes: any ) => {
  let errorMessage = 'An unknown error occurred!';

  if ( !errorRes.error || !errorRes.error.error ) {
    return of( new AuthActions.AuthenticateFail( errorMessage ) );
  }

  switch ( errorRes.error.error.message ) {
    case 'EMAIL_EXISTS':
      errorMessage = 'This email exists already!';
      break;
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_PASSWORD':
      errorMessage = 'Incorrect Email or Password!';
      break;
    default:
      errorMessage = 'An unknown error occurred!';
  }

  return of( new AuthActions.AuthenticateFail( errorMessage ) );
};

@Injectable()
export class AuthEffects {

  @Effect()
  autoLogin = this.actions$.pipe( ofType( AuthActions.AUTO_LOGIN ), map( () => {
    const userData: {
      email: string,
      id: string,
      _TOKEN: string
      _TOKEN_EXPIRATION_DATE: string;
    } = JSON.parse( localStorage.getItem( 'userData' ) );

    if ( !userData ) {
      return { type: 'DUMMY' };
    }

    const loadedUser = new User( userData.email, userData.id, userData._TOKEN, new Date( userData._TOKEN_EXPIRATION_DATE ) );
    const expirationDuration = new Date( userData._TOKEN_EXPIRATION_DATE ).getTime() - new Date().getTime();

    if ( loadedUser.token ) {
      this.authService.setLogoutTimer( expirationDuration );
      return new AuthActions.AuthenticationSuccess( {
        email: loadedUser.email,
        userId: loadedUser.id,
        token: loadedUser.token,
        expirationDate: new Date( userData._TOKEN_EXPIRATION_DATE ),
        redirect: false
      } );
    }

    return { type: 'DUMMY' };
  } ) );

  @Effect( { dispatch: false } )
  authLogout = this.actions$.pipe( ofType( AuthActions.LOGOUT ), tap( () => {
    this.authService.clearLogoutTimer();
    localStorage.removeItem( 'userData' );
    this.router.navigate( [ '/auth' ] );
  } ) );

  @Effect()
  authSignup = this.actions$.pipe(
    ofType( AuthActions.SIGNUP_START ),
    switchMap(
      (( signupAction: AuthActions.SignupStart ) => {
        return this.http.post<AuthResponseData>( environment.signupUrl + environment.firebaseAPIKey,
          {
            email: signupAction.payload.email,
            password: signupAction.payload.password,
            returnSecureToken: true
          } )
          .pipe(
            tap( resData => this.authService.setLogoutTimer( +resData.expiresIn * 1000 ) ),
            map( resData => {
              return handleAuthentication( resData.email, resData.localId, resData.idToken, +resData.expiresIn );
            } ),
            catchError( errorRes => {
              return handleError( errorRes );
            } ) );
      }) )
  );

  @Effect()
  authLogin = this.actions$.pipe(
    ofType( AuthActions.LOGIN_START ),
    switchMap( ( authData: AuthActions.LoginStart ) => {
      return this.http.post<AuthResponseData>( environment.loginUrl + environment.firebaseAPIKey,
        {
          email: authData.payload.email,
          password: authData.payload.password,
          returnSecureToken: true
        } )
        .pipe(
          tap( resData => this.authService.setLogoutTimer( +resData.expiresIn * 1000 ) ),
          map( resData => {
            return handleAuthentication( resData.email, resData.localId, resData.idToken, +resData.expiresIn );
          } ),
          catchError( errorRes => {
            return handleError( errorRes );
          } ) );
    } ) );

  @Effect( { dispatch: false } )
  authRedirect = this.actions$.pipe( ofType( AuthActions.AUTHENTICATE_SUCCESS ), tap( ( authSuccessAction: AuthActions.AuthenticationSuccess ) => {
    if ( authSuccessAction.payload.redirect ) {
      this.router.navigate( [ '/' ] );
    }
  } ) );

  constructor( private actions$: Actions, private http: HttpClient, private router: Router, private authService: AuthService ) {
  }
}
