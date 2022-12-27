import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { verifyMessage } from 'src/utils/utils';

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const host = context.switchToHttp();
    const response = host.getResponse<any>();
    const request = host.getRequest<Request>();
    const { headers } = request;

    const { __address, __nonce, '__user-sign': __userSign } = headers as any;
    if (!__address || !__nonce || !__userSign) {
      response.json({ msg: 'Signature information not passed in.', code: 500 });
      return;
    }

    if (!verifyMessage(__address, __nonce, __userSign)) {
      response.json({
        msg: 'Signature information validation failed.',
        code: 500,
      });
      return;
    }
    return next.handle();
  }
}
