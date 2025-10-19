/**************************************************************************************************************************
 Copyright (c) 2025 WorkEarly Results LLP

     Name: index.tsx
   Author: Harikrishnan Gangadharan
 Comments: 

/**************************************************************************************************************************
 IMPORTS
***************************************************************************************************************************/
import { useContext } from 'react';
import { CountryContext } from '../lib/CountryProvider';
/**************************************************************************************************************************
 IMPLEMENTATIONS
***************************************************************************************************************************/
/**
 * @description - Hook to manage country state
 */
const useCountry = () => {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error('useCountry must be used within an CountryContextProvider');
  }
  return context;
};

export default useCountry ;