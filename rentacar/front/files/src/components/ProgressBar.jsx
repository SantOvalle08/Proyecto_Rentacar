'use client';

import { AppProgressBar } from 'next-nprogress-bar';

export default function ProgressBar() {
  return (
    <AppProgressBar
      height="3px"
      color="#6750a4"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}
