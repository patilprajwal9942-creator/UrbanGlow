import { createContext, useState } from "react";

export const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [booking, setBooking] = useState({});

  return (
    <BookingContext.Provider
      value={{
        booking,
        setBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}