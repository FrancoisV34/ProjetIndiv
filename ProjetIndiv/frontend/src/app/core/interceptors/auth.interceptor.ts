import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const API_BASE_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
  ? 'https://projetindiv-production.up.railway.app'
  : '';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const apiReq = req.url.startsWith('/api') || req.url.startsWith('/uploads')
    ? req.clone({ url: `${API_BASE_URL}${req.url}` })
    : req;

  const token = auth.getToken();
  const authReq = token
    ? apiReq.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : apiReq;

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
