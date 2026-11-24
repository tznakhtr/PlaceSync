import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

/**
 * Custom ThrottlerGuard that extends @nestjs/throttler's ThrottlerGuard.
 * Ensures that the standard HTTP "Retry-After" header is set on 429 responses,
 * including for named throttlers.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { res } = this.getRequestResponse(context);
    if (res && throttlerLimitDetail.timeToBlockExpire) {
      this.setResponseHeader(res, 'Retry-After', throttlerLimitDetail.timeToBlockExpire);
    }
    await super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
