"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { Header } from "@/components/auth/header";
import { Social } from "@/components/auth/social";
import { BackButton } from "@/components/auth/back-button";
import { motion } from "framer-motion";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
}

export const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showSocial
}: CardWrapperProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-[400px] shadow-xl border-t border-t-white/20 bg-background/60 backdrop-blur-xl">
        <CardHeader>
          <Header label={headerLabel} />
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
        {showSocial && (
          <CardFooter>
            <Social />
          </CardFooter>
        )}
        <CardFooter>
          <BackButton
            label={backButtonLabel}
            href={backButtonHref}
          />
        </CardFooter>
      </Card>
    </motion.div>
  );
};