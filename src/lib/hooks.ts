import { useRouter } from 'next/navigation'
import { useDispatch, useSelector, useStore } from 'react-redux'


export const useAppDispatch = useDispatch
export const useAppSelector = useSelector
export const useAppStore = useStore
export const useAppRouter =useRouter


// selectors.js
export const selectToken = (state:any) => state.auth.token;
