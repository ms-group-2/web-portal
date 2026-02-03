import { TokenResponse } from './token.response.model';
import { UserResponse } from './user.response.model';

export type VerifyResponse = UserResponse & TokenResponse;
