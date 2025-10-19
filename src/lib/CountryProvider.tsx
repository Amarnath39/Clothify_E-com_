// "use client";
// /**************************************************************************************************************************
//  Copyright (c) 2025 WorkEarly Results LLP

//      Name: index.tsx
//    Author: Harikrishnan Gangadharan
//  Comments: 

// /**************************************************************************************************************************
//  IMPORTS
// ***************************************************************************************************************************/
// import React, { createContext, ReactNode, useEffect, useState } from 'react';
// /**************************************************************************************************************************
//  TYPES / GLOBAL DEFINITIONS
// ***************************************************************************************************************************/
// export type Country = "IND" | "UAE";

// interface CountryContextType {
//   initialized: boolean;
//   selectedCountry: Country | null;
//   setCountry: (country: Country) => void;
// }

// interface CountryContextProviderProps {
//   children: ReactNode;
// }

// export const CountryContext = createContext<CountryContextType | undefined>(undefined);
// /**************************************************************************************************************************
//  IMPLEMENTATIONS
// ***************************************************************************************************************************/
// const CountryContextProvider = ({ children }: CountryContextProviderProps) => {
//   const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

//   const [initialized, setInitialized] = useState(false);

//   const [saved, setSaved] = useState(true);

//   useEffect(() => {
//     const savedCountry = localStorage.getItem("country");

//     if (savedCountry) {
//       setSelectedCountry(savedCountry as Country);
//       setInitialized(true);
//     }
//   }, []);

//   /**
//    * @description - Add item to wishlist
//    * @param productId - ID of the product to add
//    */
//   const setCountry = (country: Country) => {
//     // Save to localStorage
//     localStorage.setItem("country", country);
//     // Update state
//     setSelectedCountry(country);
//     // Mark as initialized
//     setInitialized(true);
//   }

//   return (
//     <CountryContext.Provider
//       value={{
//         initialized,
//         selectedCountry,
//         setCountry
//       }}
//     >
//       {children}
//     </CountryContext.Provider>
//   );
// };

// export default CountryContextProvider;
"use client";

import React, { createContext, ReactNode, useEffect, useState } from "react";

export type Country = "IND" | "UAE";

interface CountryContextType {
  initialized: boolean;
  selectedCountry: Country | null;
  setCountry: (country: Country) => void;
  showPopup: boolean;
}

interface CountryContextProviderProps {
  children: ReactNode;
}

export const CountryContext = createContext<CountryContextType | undefined>(
  undefined
);

const CountryContextProvider = ({ children }: CountryContextProviderProps) => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const savedCountry = localStorage.getItem("country");
    if (savedCountry) {
      setSelectedCountry(savedCountry as Country);
    }
    setInitialized(true); // always mark initialized after checking storage
  }, []);

  const setCountry = (country: Country) => {
    localStorage.setItem("country", country);
    setSelectedCountry(country);
    setInitialized(true);
  };

  // popup should only show once initialized and no saved country
  const showPopup = initialized && !selectedCountry;

  return (
    <CountryContext.Provider
      value={{
        initialized,
        selectedCountry,
        setCountry,
        showPopup,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
};

export default CountryContextProvider;