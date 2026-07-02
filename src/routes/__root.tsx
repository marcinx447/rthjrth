import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/lib/settings.functions";
import { MaintenanceScreen } from "@/components/maintenance-screen";
import { AnnouncementBar } from "@/components/announcement-bar";
import { ImportantPopup } from "@/components/important-popup";
import { PromoBanner } from "@/components/promo-banner";
import { trackPageVisit } from "@/lib/stats.functions";
import { SettingsProvider } from "@/lib/user-settings";
import { SettingsModal } from "@/components/settings-modal";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
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
      { title: "USFinds — Sprawdzone repliki i findsy" },
      { name: "description", content: "USFinds — katalog sprawdzonych finds. USFans (polecane), Kakobuy, Litbuy." },
      { property: "og:title", content: "USFinds — Sprawdzone repliki i findsy" },
      { property: "og:description", content: "USFinds — katalog sprawdzonych finds. USFans (polecane), Kakobuy, Litbuy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "USFinds — Sprawdzone repliki i findsy" },
      { name: "twitter:description", content: "USFinds — katalog sprawdzonych finds. USFans (polecane), Kakobuy, Litbuy." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9480449e-8f7c-4c2e-88a1-65758cb22d56/id-preview-0b918be8--b6fe683b-7437-4c09-94b3-a6561447c1bc.lovable.app-1782729194629.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9480449e-8f7c-4c2e-88a1-65758cb22d56/id-preview-0b918be8--b6fe683b-7437-4c09-94b3-a6561447c1bc.lovable.app-1782729194629.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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
      <SettingsProvider>
        <SiteShell />
        <SettingsModal />
        <Toaster theme="dark" position="top-right" richColors />
      </SettingsProvider>
    </QueryClientProvider>
  );
}

function SiteShell() {
  const router = useRouter();
  const path = router.state.location.pathname;
  const isAdmin = path === "/ff" || path.startsWith("/ff/");
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (isAdmin) return;
    // Fire-and-forget visit tracking on each route change
    trackPageVisit({ data: { path } }).catch(() => {});
  }, [path, isAdmin]);
  const inMaintenance = !!settings?.maintenance_mode && !isAdmin;
  const showPopup =
    !!settings?.popup_active &&
    !!settings?.popup_message &&
    !isAdmin &&
    !inMaintenance &&
    path === "/";
  return (
    <>
      {settings?.promo_active && settings.promo_link && !isAdmin && (
        <PromoBanner
          title={settings.promo_title}
          message={settings.promo_message}
          cta={settings.promo_cta_label}
          link={settings.promo_link}
          logo={settings.promo_logo}
        />
      )}
      {settings?.announcement_active && settings.announcement && !isAdmin && (
        <AnnouncementBar text={settings.announcement} />
      )}
      <Outlet />
      {inMaintenance && (
        <MaintenanceScreen message={settings?.maintenance_message ?? "Przerwa techniczna."} />
      )}
      {showPopup && settings && (
        <ImportantPopup
          active
          title={settings.popup_title || "Ważne ogłoszenie"}
          message={settings.popup_message}
        />
      )}
    </>
  );
}
