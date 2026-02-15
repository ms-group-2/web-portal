import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { SpinnerHandlerService } from '../services/spinner/spinner-handler.service';

export const spinnerInterceptor: HttpInterceptorFn = (req, next) => {
  const spinnerHandler = inject(SpinnerHandlerService);

  if (req.params.get('showSpinner') === 'true') {
    spinnerHandler.onStarted(req);
  }

  return next(req).pipe(
    finalize(() => {
      spinnerHandler.onFinished(req);
    })
  );
};
