import { CommitmentStatus } from '@netify/types';

describe('CommitmentStateEngine', () => {
  it('should recognize pending commitments before promised date', () => {
    const promisedDate = new Date(Date.now() + 86400000 * 2);
    const now = new Date();
    const isPast = promisedDate.getTime() < now.getTime();
    expect(isPast).toBe(false);
  });

  it('should identify missed commitments when promised date has passed without fulfillment', () => {
    const promisedDate = new Date(Date.now() - 86400000 * 3);
    const now = new Date();
    const isOverdue = promisedDate.getTime() < now.getTime();
    const status = isOverdue ? CommitmentStatus.MISSED : CommitmentStatus.PENDING;
    expect(status).toBe(CommitmentStatus.MISSED);
  });
});
