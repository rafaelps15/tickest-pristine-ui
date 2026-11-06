import { TICKETS_MANAGE_PERMISSION } from './permission-codes';

describe('permission-codes', () => {
  it('keeps the queue permission code exactly as the back end checks it', () => {
    expect(TICKETS_MANAGE_PERMISSION).toBe('tickets:manage');
  });
});
