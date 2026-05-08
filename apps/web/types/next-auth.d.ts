import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id?: string;
    roles?: string[];
    currency?: string;
    locale?: string;
    theme?: string;
    dateFormat?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: string[];
      currency: string;
      locale: string;
      theme: string;
      dateFormat: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: string[];
    currency?: string;
    locale?: string;
    theme?: string;
    dateFormat?: string;
  }
}

