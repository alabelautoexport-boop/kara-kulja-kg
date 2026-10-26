import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { getElementScrollRestorationEntry } from "@tanstack/router-core";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: ({ location }): boolean =>
      location.pathname !== "/news" ||
      Boolean(location.hash) ||
      typeof window === "undefined" ||
      Boolean(getElementScrollRestorationEntry(router, { getElement: () => window })),
    defaultPreloadStaleTime: 0,
  });

  router.subscribe("onRendered", ({ toLocation }) => {
    if (
      toLocation.pathname !== "/news" ||
      toLocation.hash ||
      getElementScrollRestorationEntry(router, { getElement: () => window })
    ) {
      return;
    }

    // New listing visits start at the cards; saved history entries use router restoration.
    document.getElementById("news-list")?.scrollIntoView({ behavior: "instant", block: "start" });
  });

  return router;
};
