"use client";

import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

interface SocialProps {
    isPending?: boolean;
}

export const Social = ({ isPending }: SocialProps) => {

    const onClick = (provider: "google" | "github") => {
        signIn(provider, {
            callbackUrl: "/settings" // or default redirect
        })
    }

    return (
        <div className="flex items-center w-full gap-x-2">
            <Button
                size="lg"
                className="w-full"
                variant="outline"
                onClick={() => onClick("google")}
                disabled={isPending}
            >
                <FcGoogle className="h-5 w-5" />
            </Button>
            <Button
                size="lg"
                className="w-full"
                variant="outline"
                onClick={() => onClick("github")}
                disabled={isPending}
            >
                <FaGithub className="h-5 w-5" />
            </Button>
        </div>
    );
};
