import { RenderMode, type ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Public routes - CSR
  {
    path: '',
    renderMode: RenderMode.Client,
    headers: {
      'Cache-Control': 'public, max-age=60'
    }
  },
  {
    path: 'home',
    renderMode: RenderMode.Client,
    headers: {
      'Cache-Control': 'public, max-age=60'
    }
  },

  // Static pages - Prerendered
  {
    path: 'about',
    renderMode: RenderMode.Prerender,
    headers: {
      'Cache-Control': 'public, max-age=86400'
    }
  },
  {
    path: 'contact',
    renderMode: RenderMode.Prerender,
    headers: {
      'Cache-Control': 'public, max-age=86400'
    }
  },

  // Authentication routes - SSR
  {
    path: 'auth/login',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'DENY'
    }
  },
  {
    path: 'auth/signup',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'DENY'
    }
  },

  // Protected routes - SSR
  {
    path: 'admin',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'private, no-cache',
      'X-Frame-Options': 'DENY'
    }
  },
  {
    path: 'company',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'private, no-cache',
      'X-Frame-Options': 'DENY'
    }
  },
  {
    path: 'customer',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'private, no-cache',
      'X-Frame-Options': 'DENY'
    }
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'private, no-cache',
      'X-Frame-Options': 'SAMEORIGIN'
    }
  },

  // Not found
  {
    path: '**',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'no-store'
    }
  }
];