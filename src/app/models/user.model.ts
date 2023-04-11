/**
 * User model
 */
export interface User {
  id: string;
  fullName: string;
  email: string;
  // Currently unused
  acceptedTermsConditions: number;
}
