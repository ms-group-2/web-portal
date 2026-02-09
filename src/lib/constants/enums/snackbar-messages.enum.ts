export enum SnackbarType {
  SUCCESS = "success",
  ERROR = "error",
  INFO = "info"
}

export const SNACKBAR_MESSAGES = {
  LOGOUT_SUCCESS: "წარმატებით გამოხვედით სისტემიდან",
  LOGIN_SUCCESS: "წარმატებით შეხვედით სისტემაში",
  REGISTER_SUCCESS: "რეგისტრაცია წარმატებით დასრულდა",
  ERROR_GENERIC: "მოხდა შეცდომა, სცადეთ თავიდან",
  SAVE_SUCCESS: "ცვლილებები წარმატებით შეინახა",
} as const;
