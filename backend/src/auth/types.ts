import { Role } from '@prisma/client';

/** Decoded access-token payload, attached to the request by JwtAuthGuard. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
