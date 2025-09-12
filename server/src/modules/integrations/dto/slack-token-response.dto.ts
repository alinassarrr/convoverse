export class SlackTokenResponseDTO {
  ok: boolean;
  access_token?: string;
  refresh_token?: string;
  team?: Record<string, unknown>;
  authed_user?: Record<string, unknown>;
  scope?: string;
  expires_in?: number;
  error?: string;
}
