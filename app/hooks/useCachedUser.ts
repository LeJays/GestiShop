"use client"
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function useCachedUser() {
  const { user, isLoaded } = useUser();
  const [cachedUser, setCachedUser] = useState<any>(null);

  useEffect(() => {
    if (isLoaded && user) {
      const minimalUser = {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        name: user.fullName ?? "",
      };

      setCachedUser(minimalUser);
      // Sauvegarde en localStorage pour les futurs rechargements
      localStorage.setItem("cachedUser", JSON.stringify(minimalUser));
    } else if (!cachedUser) {
      // Si pas encore chargé, tente de récupérer en cache
      const stored = localStorage.getItem("cachedUser");
      if (stored) {
        setCachedUser(JSON.parse(stored));
      }
    }
  }, [user, isLoaded]);

  return cachedUser;
}