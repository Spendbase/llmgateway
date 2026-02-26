"use client";

import { MessageSquare, Video, Volume2 } from "lucide-react";
import Link from "next/link";

interface NavItemProps {
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	active?: boolean;
	disabled?: boolean;
	comingSoon?: boolean;
}

function NavItem({
	href,
	icon: Icon,
	label,
	active,
	disabled,
	comingSoon,
}: NavItemProps) {
	const base =
		"group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full";
	const activeClass = "bg-accent text-foreground";
	const inactiveClass =
		"text-muted-foreground hover:bg-accent/60 hover:text-foreground";
	const disabledClass = "opacity-50 cursor-not-allowed pointer-events-none";

	const inner = (
		<>
			<Icon className="h-4 w-4 shrink-0" />
			<span className="flex-1">{label}</span>
			{comingSoon && (
				<span className="text-[10px] font-medium bg-muted text-muted-foreground rounded px-1.5 py-0.5 leading-none">
					Soon
				</span>
			)}
		</>
	);

	if (disabled) {
		return (
			<div className={`${base} ${inactiveClass} ${disabledClass}`}>{inner}</div>
		);
	}

	return (
		<Link
			href={href}
			prefetch={true}
			className={`${base} ${active ? activeClass : inactiveClass}`}
		>
			{inner}
		</Link>
	);
}

export function PlaygroundNavLinks({ pathname }: { pathname: string }) {
	const isChat = pathname === "/" || pathname === "";
	const isSpeech = pathname === "/tts";

	return (
		<nav className="w-full space-y-0.5 px-1">
			<NavItem href="/" icon={MessageSquare} label="Chat" active={isChat} />
			<NavItem href="/tts" icon={Volume2} label="Speech" active={isSpeech} />
			<NavItem href="/video" icon={Video} label="Video" disabled comingSoon />
		</nav>
	);
}
