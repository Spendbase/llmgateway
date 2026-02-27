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
		"group relative flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex-1";
	const activeClass = "bg-background text-foreground shadow-sm";
	const inactiveClass =
		"text-muted-foreground hover:text-foreground hover:bg-background/60";
	const disabledClass = "opacity-35 cursor-not-allowed pointer-events-none";

	const inner = (
		<>
			<Icon className="h-4 w-4 shrink-0" />
			<span className="leading-none">{label}</span>
			{comingSoon && (
				<span className="absolute -top-1 -right-1 text-[8px] font-medium bg-muted text-muted-foreground rounded px-1 py-0.5 leading-none">
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
		<nav className="w-full px-1">
			<div className="flex items-stretch gap-0.5 rounded-lg bg-muted p-1">
				<NavItem href="/" icon={MessageSquare} label="Chat" active={isChat} />
				<NavItem href="/tts" icon={Volume2} label="Speech" active={isSpeech} />
				<NavItem href="/video" icon={Video} label="Video" disabled comingSoon />
			</div>
		</nav>
	);
}
