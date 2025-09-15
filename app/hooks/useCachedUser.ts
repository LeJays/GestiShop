"use client"
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

type MinimalUser = {
  id: string;
  email: string;
  name: string;
};

export default function useCachedUser() {
  const { user, isLoaded } = useUser();
  const [cachedUser, setCachedUser] = useState<MinimalUser | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      const minimalUser: MinimalUser = {
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
        setCachedUser(JSON.parse(stored) as MinimalUser);
      }
    }
  }, [user, isLoaded]);

  return cachedUser;
}
