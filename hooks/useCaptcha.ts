import { useState, useEffect } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      enterprise: {
        ready: (cb: () => void) => void;
        execute: (siteKey: string, opts: { action: string }) => Promise<string>;
        render: (container: string, opts: Record<string, unknown>) => number;
        reset: () => void;
      };
    };
  }
}

interface CaptchaProps {
  action: string;
  siteKeys: {
    v2: string;
    v3: string;
  };
  version: 'v2' | 'v3';
}

export const useCaptcha = ({ action, version, siteKeys }: CaptchaProps) => {
  const [captchaV2Token, setCaptchaV2Token] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const url = `https://www.google.com/recaptcha/enterprise.js?render=${siteKeys.v3}`;
    const script = document.createElement('script');
    script.src = url;
    script.addEventListener('load', () => setIsLoaded(true));
    document.body.appendChild(script);

    return () => {
      // Remove script and badge on unmount so it doesn't leak to other pages
      script.remove();
      document.querySelectorAll('.grecaptcha-badge').forEach(el => el.remove());
      // Remove the injected recaptcha iframes/containers
      document.querySelectorAll('iframe[src*="recaptcha"]').forEach(el => el.parentElement?.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (version !== 'v2' || !isLoaded) {
      setCaptchaV2Token(null);
      return;
    }

    window.grecaptcha.enterprise.ready(async () => {
      try {
        await window.grecaptcha.enterprise.render('grecaptcha-checkbox', {
          sitekey: siteKeys.v2,
          theme: 'light',
          action,
          callback: (token: string) => {
            setCaptchaV2Token(token);
          },
          'expired-callback'() {
            setCaptchaV2Token(null);
          },
        });
      } catch (err) {
        console.log(err);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, isLoaded]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withCaptcha = (cb: (...args: any[]) => void) => {
    return (...args: unknown[]) => {
      if (isFormEvent(args[0])) {
        (args[0] as Event).preventDefault();
      }

      const nonEventArgs = args.filter(arg => !isEvent(arg));

      if (version === 'v3') {
        window.grecaptcha.enterprise.ready(() => {
          window.grecaptcha.enterprise
            .execute(siteKeys.v3, {
              action,
            })
            .then((token: string) => {
              cb({ token, action }, ...nonEventArgs);
            });
        });
      }

      if (version === 'v2') {
        cb({ token: captchaV2Token, action }, ...nonEventArgs);
      }
    };
  };

  const resetCaptcha = () => {
    setCaptchaV2Token(null);
    window.grecaptcha.enterprise.reset();
  };

  return {
    withCaptcha,
    enableCallback: version === 'v3' || !!captchaV2Token,
    resetCaptcha,
  };
};

const isEvent = (item: unknown) => {
  if (!!(item && typeof item === 'object' && 'target' in item)) {
    return true;
  } else if (item instanceof Event) {
    return true;
  } else return false;
};

const isFormEvent = (item: unknown) => {
  return !!(
    item &&
    typeof item === 'object' &&
    'type' in item &&
    (item as Record<string, unknown>).type === 'submit'
  );
};
