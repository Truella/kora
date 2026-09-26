"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import Reveal from "./Reveal";
import Nav, { CREATE_HREF } from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import HeroShots from "@/components/landing/HeroShots";
import Story from "@/components/landing/Story";

function useSessionUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data.user));
  }, []);

  return user;
}

export default function Landing() {
  const user = useSessionUser();
  const signedIn = Boolean(user);
  const createHref = signedIn ? "/groups/new" : CREATE_HREF;

  return (
    <div className="flex flex-1 flex-col bg-bg">
      <Nav signedIn={signedIn} />
      <Hero createHref={createHref} />
      <Reveal delay={0.1}>
        <HeroShots />
      </Reveal>
      <Story createHref={createHref} />
    </div>
  );
}
