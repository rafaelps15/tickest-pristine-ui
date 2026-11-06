import { HttpErrorResponse } from '@angular/common/http';
import { ACCOUNT_DEACTIVATED_CODE, isAccountDeactivated } from './account-deactivated.util';

describe('account-deactivated.util', () => {
  it('recognizes the refusal of a deactivated account by the code of the Problem Details', () => {
    expect(isAccountDeactivated(new HttpErrorResponse({ status: 403, error: { code: ACCOUNT_DEACTIVATED_CODE } }))).toBeTrue();
  });

  it('also recognizes it by the title, while the back end sends the code only there', () => {
    expect(isAccountDeactivated(new HttpErrorResponse({ status: 403, error: { title: 'Users.Deactivated' } }))).toBeTrue();
  });

  it('reads the code before the title when both come', () => {
    const error = new HttpErrorResponse({ status: 403, error: { code: 'Permissions.Missing', title: 'Users.Deactivated' } });

    expect(isAccountDeactivated(error)).toBeFalse();
  });

  it('does not confuse it with another refusal, another status or an error that is not HTTP', () => {
    expect(isAccountDeactivated(new HttpErrorResponse({ status: 403, error: { title: 'Permissions.Missing' } }))).toBeFalse();
    expect(isAccountDeactivated(new HttpErrorResponse({ status: 403 }))).toBeFalse();
    expect(isAccountDeactivated(new HttpErrorResponse({ status: 401, error: { code: ACCOUNT_DEACTIVATED_CODE } }))).toBeFalse();
    expect(isAccountDeactivated(new Error(ACCOUNT_DEACTIVATED_CODE))).toBeFalse();
    expect(isAccountDeactivated(undefined)).toBeFalse();
  });
});
