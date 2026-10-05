"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/database.types";

type RequireAdminState = {
  loading: boolean;
  profile: Profile | null;
};

/**
 * /dashboard/* sayfaları için basit client-side oturum + admin kontrolü.
 * Bu bir iç admin aracı olduğundan ağır bir SSR/middleware kurulumu yerine
 * client-side bir kontrol yeterli (bkz. admin/README.md).
 *
 * - Oturum yoksa -> /login'e yönlendirir.
 * - Oturum var ama profiles.is_admin false/null ise -> oturumu kapatıp
 *   /login'e yönlendirir.
 */
export function useRequireAdmin(): RequireAdminState {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;

    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profileRow, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!active) return;

      if (error || !profileRow || !profileRow.is_admin) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      setProfile(profileRow as Profile);
      setLoading(false);
    }

    check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, profile };
}
