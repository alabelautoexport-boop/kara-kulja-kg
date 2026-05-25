import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { I18nProvider } from "@/lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <h2 className="mt-4 font-display text-xl text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-[var(--beige)] px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please try again or return home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="bg-[var(--beige)] px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="border hairline px-5 py-3 text-sm font-medium text-foreground">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kara-Kulja" },
      { name: "description", content: "Көркү, наркы өзгөлөрдөн башкараак Кара-Кулжа ушул жерден башталат." },
      { name: "theme-color", content: "#0a0a0a" },
      { property: "og:site_name", content: "Kara-Kulja" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Kara-Kulja" },
      { property: "og:description", content: "Көркү, наркы өзгөлөрдөн башкараак Кара-Кулжа ушул жерден башталат." },
      { property: "og:url", content: "https://kara-kulja.kg/" },
      { property: "og:image", content: "https://kara-kulja.kg/og-image.png" },
      { property: "og:image:secure_url", content: "https://kara-kulja.kg/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Kara-Kulja — gateway arch with Alay mountains at sunset" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Kara-Kulja" },
      { name: "twitter:description", content: "Көркү, наркы өзгөлөрдөн башкараак Кара-Кулжа ушул жерден башталат." },
      { name: "twitter:image", content: "https://kara-kulja.kg/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kg">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <Outlet />
      </I18nProvider>
    </QueryClientProvider>
  );
}
