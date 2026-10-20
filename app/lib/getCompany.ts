import { cache } from "react";

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let cachedCompanyBackup: any = null;

export const getCompany = cache(async () => {
  try {
    const r = await fetch(`${BACKEND}/api/admin/company/public`, {
      next: { revalidate: 3600, tags: ["company"] },
      signal: AbortSignal.timeout(15000),
    });
    if (r.ok) {
      const data = await r.json();
      if (data && Object.keys(data).length > 0) {
        cachedCompanyBackup = data;
        return data;
      }
    }
    return cachedCompanyBackup || {};
  } catch {
    return cachedCompanyBackup || {};
  }
});
