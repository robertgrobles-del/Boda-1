
export interface GuestResponse {
  name: string;
  attending: boolean;
  guestsCount: number;
  dietaryRestrictions?: string;
  message?: string;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
