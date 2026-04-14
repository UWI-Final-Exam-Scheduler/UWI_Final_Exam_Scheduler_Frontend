import { Venue } from "@/app/components/types/calendarTypes";

export const mockVenue = (overrides?: Partial<Venue>): Venue => ({
  id: 1,
  name: "MD2",
  capacity: 100,
  ...overrides,
});

export const mockVenues = (): Venue[] => [
  mockVenue(),
  mockVenue({ id: 2, name: "MD3", capacity: 80 }),
  mockVenue({ id: 3, name: "JFK", capacity: 150 }),
];
