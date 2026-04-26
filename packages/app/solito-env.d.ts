/// <reference types="react" />

// Fix for "Cannot find module 'solito/navigation' or its corresponding type declarations"
declare module 'solito/navigation' {
  export * from 'solito/build/app/navigation';
  export { default as useUpdateSearchParams } from 'solito/build/app/navigation/use-update-search-params';
}

