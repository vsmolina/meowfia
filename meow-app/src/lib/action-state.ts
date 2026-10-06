/** Shape returned by server actions used with useActionState. */
export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Optional redirect target for client handling */
  redirectTo?: string;
};

export const initialActionState: ActionState = {};
