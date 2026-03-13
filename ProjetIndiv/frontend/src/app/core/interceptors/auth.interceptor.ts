import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const token = auth.getToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Ne pas tenter le refresh sur les routes d'auth
      if (err.status === 401 && !req.url.includes('/api/auth/')) {
        const refresh$ = auth.refreshAccessToken();
        if (refresh$) {
          return refresh$.pipe(
            switchMap(res => {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${res.token}` },
              });
              return next(retryReq);
            }),
            catchError(() => {
              auth.logout();
              return throwError(() => err);
            })
          );
        } else {
          auth.logout();
        }
      }
      return throwError(() => err);
    })
  );
};
