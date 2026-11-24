/**
 * Custom error thrown when a user successfully authenticates with valid credentials,
 * but their account role (STUDENT vs CELL) does not match the expected login tab.
 */
export class RoleMismatchError extends Error {
  public readonly actualRole: 'STUDENT' | 'CELL';

  constructor(actualRole: 'STUDENT' | 'CELL') {
    super(
      actualRole === 'CELL'
        ? 'This is an administrator account. Please use Admin Login.'
        : 'This is a student account. Please use Student Login.',
    );
    this.name = 'RoleMismatchError';
    this.actualRole = actualRole;
  }
}
