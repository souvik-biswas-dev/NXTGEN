import type { AdminSession } from '$lib/server/auth';

declare global {
  namespace App {
    interface Locals {
      session: AdminSession | null;
    }
    interface PageData {
      session?: AdminSession | null;
    }
  }
}

export {};
