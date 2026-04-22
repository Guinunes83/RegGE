import React, { createContext, useContext, useEffect } from 'react';

type Interceptor = (view: string, props: any) => Promise<boolean>;

export const NavigationContext = createContext<{
  registerInterceptor: (interceptor: Interceptor | null) => void;
}>({
  registerInterceptor: () => {}
});

export const useNavigationInterceptor = (interceptor: Interceptor | null) => {
  const { registerInterceptor } = useContext(NavigationContext);
  useEffect(() => {
    registerInterceptor(interceptor);
    return () => registerInterceptor(null);
  }, [interceptor, registerInterceptor]);
};
