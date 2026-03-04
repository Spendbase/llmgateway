import type { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const customIcons: Record<string, IconComponent> = {
	// =====================
	// Simple Icons (brand SVGs)
	// =====================

	N8n: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				clipRule="evenodd"
				d="M24 8.4c0 1.325-1.102 2.4-2.462 2.4-1.146 0-2.11-.765-2.384-1.8h-3.436c-.602 0-1.115.424-1.214 1.003l-.101.592a2.38 2.38 0 0 1-.8 1.405c.412.354.704.844.8 1.405l.1.592A1.222 1.222 0 0 0 15.719 15h.975c.273-1.035 1.237-1.8 2.384-1.8 1.36 0 2.461 1.075 2.461 2.4S20.436 18 19.078 18c-1.147 0-2.11-.765-2.384-1.8h-.975c-1.204 0-2.23-.848-2.428-2.005l-.101-.592a1.222 1.222 0 0 0-1.214-1.003H10.97c-.308.984-1.246 1.7-2.356 1.7-1.11 0-2.048-.716-2.355-1.7H4.817c-.308.984-1.246 1.7-2.355 1.7C1.102 14.3 0 13.225 0 11.9s1.102-2.4 2.462-2.4c1.183 0 2.172.815 2.408 1.9h1.337c.236-1.085 1.225-1.9 2.408-1.9 1.184 0 2.172.815 2.408 1.9h.952c.601 0 1.115-.424 1.213-1.003l.102-.592c.198-1.157 1.225-2.005 2.428-2.005h3.436c.274-1.035 1.238-1.8 2.384-1.8C22.898 6 24 7.075 24 8.4zm-1.23 0c0 .663-.552 1.2-1.232 1.2-.68 0-1.23-.537-1.23-1.2 0-.663.55-1.2 1.23-1.2.68 0 1.231.537 1.231 1.2zM2.461 13.1c.68 0 1.23-.537 1.23-1.2 0-.663-.55-1.2-1.23-1.2-.68 0-1.231.537-1.231 1.2 0 .663.55 1.2 1.23 1.2zm6.153 0c.68 0 1.231-.537 1.231-1.2 0-.663-.55-1.2-1.23-1.2-.68 0-1.231.537-1.231 1.2 0 .663.55 1.2 1.23 1.2zm10.462 3.7c.68 0 1.23-.537 1.23-1.2 0-.663-.55-1.2-1.23-1.2-.68 0-1.23.537-1.23 1.2 0 .663.55 1.2 1.23 1.2z"
				fill="#EA4B71"
				fillRule="evenodd"
			/>
		</svg>
	),
	Cursor: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 466.73 532.09"
			{...props}
		>
			<path
				d="M457.43 125.94 244.42 2.96c-6.84-3.95-15.28-3.95-22.12 0L9.3 125.94C3.55 129.26 0 135.4 0 142.05v247.99c0 6.65 3.55 12.79 9.3 16.11l213.01 122.98c6.84 3.95 15.28 3.95 22.12 0l213.01-122.98c5.75-3.32 9.3-9.46 9.3-16.11V142.05c0-6.65-3.55-12.79-9.3-16.11zm-13.38 26.05L238.42 508.15c-1.39 2.4-5.06 1.42-5.06-1.36V273.58c0-4.66-2.49-8.97-6.53-11.31L24.87 145.67c-2.4-1.39-1.42-5.06 1.36-5.06h411.26c5.84 0 9.49 6.33 6.57 11.39h-.01Z"
				fill="currentColor"
			/>
		</svg>
	),
	Cline: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 466.73 487.04"
			{...props}
		>
			<path
				d="m463.6 275.08-29.26-58.75V182.5c0-56.08-45.01-101.5-100.53-101.5H283.8c3.62-7.43 5.61-15.79 5.61-24.61C289.41 25.22 264.33 0 233.34 0s-56.07 25.22-56.07 56.39c0 8.82 1.99 17.17 5.61 24.61h-50.01C77.36 81 32.35 126.42 32.35 182.5v33.83L2.48 274.92c-3.01 5.9-3.01 12.92 0 18.81l29.87 57.93v33.83c0 56.08 45.01 101.5 100.52 101.5h200.95c55.51 0 100.53-45.42 100.53-101.5v-33.83l29.21-58.13c2.9-5.79 2.9-12.61.05-18.46Zm-260.85 47.88c0 25.48-20.54 46.14-45.88 46.14s-45.88-20.66-45.88-46.14v-82.02c0-25.48 20.54-46.14 45.88-46.14s45.88 20.66 45.88 46.14zm147.83 0c0 25.48-20.54 46.14-45.88 46.14s-45.88-20.66-45.88-46.14v-82.02c0-25.48 20.54-46.14 45.88-46.14s45.88 20.66 45.88 46.14z"
				fill="currentColor"
			/>
		</svg>
	),
	Claude: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z"
				fill="currentColor"
			/>
		</svg>
	),
	Cloudflare: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.6045-.499-1.0615-.5205l-8.6592-.1123a.1559.1559 0 0 1-.1333-.0713c-.0283-.042-.0351-.0986-.021-.1553.0278-.084.1123-.1484.2036-.1562l8.7359-.1123c1.0351-.0489 2.1601-.8868 2.5537-1.9136l.499-1.3013c.0215-.0561.0293-.1128.0147-.168-.5625-2.5463-2.835-4.4453-5.5499-4.4453-2.5039 0-4.6284 1.6177-5.3876 3.8614-.4927-.3658-1.1187-.5625-1.794-.499-1.2026.119-2.1665 1.083-2.2861 2.2856-.0283.31-.0069.6128.0635.894C1.5683 13.171 0 14.7754 0 16.752c0 .1748.0142.3515.0352.5273.0141.083.0844.1475.1689.1475h15.9814c.0909 0 .1758-.0645.2032-.1553l.12-.4268zm2.7568-5.5634c-.0771 0-.1611 0-.2383.0112-.0566 0-.1054.0415-.127.0976l-.3378 1.1744c-.1475.5068-.0918.9707.1543 1.3164.2256.3164.6055.498 1.0625.5195l1.8437.1133c.0557 0 .1055.0263.1329.0703.0283.043.0351.1074.0214.1562-.0283.084-.1132.1485-.204.1553l-1.921.1123c-1.041.0488-2.1582.8867-2.5527 1.914l-.1406.3585c-.0283.0713.0215.1416.0986.1416h6.5977c.0771 0 .1474-.0489.169-.126.1122-.4082.1757-.837.1757-1.2803 0-2.6025-2.125-4.727-4.7344-4.727"
				fill="currentColor"
			/>
		</svg>
	),
	GitHub: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
				fill="currentColor"
			/>
		</svg>
	),
	Gradio: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M 12 1.527 A 1.532 1.532 0 0 0 11.24 1.73 L 0.7695 7.732 A 1.532 1.532 0 0 0 0 9.021 L 0 9.109 A 1.532 1.532 0 0 0 0.7695 10.4 L 3.57 12 L 0.7695 13.61 C 0.256 13.9 0 14.42 0 14.94 C 0 15.45 0.256 15.97 0.7695 16.26 L 11.24 22.27 C 11.71 22.54 12.29 22.54 12.76 22.27 L 23.23 16.26 C 23.73 15.98 23.99 15.48 24 14.97 L 24 14.9 C 23.99 14.4 23.73 13.89 23.23 13.61 L 20.42 12 L 23.23 10.4 A 1.532 1.532 0 0 0 24 9.223 L 24 8.91 A 1.532 1.532 0 0 0 23.23 7.732 L 12.76 1.73 A 1.532 1.532 0 0 0 12 1.527 z M 12 4.826 L 19.39 9.061 L 17.34 10.24 L 12.76 7.602 C 12.53 7.47 12.27 7.398 12 7.398 C 11.73 7.398 11.47 7.469 11.24 7.602 L 6.652 10.24 L 4.613 9.061 L 12 4.826 z M 12 10.7 L 14.27 12 L 12 13.3 L 9.734 12 L 12 10.7 z M 6.652 13.77 L 11.24 16.39 A 1.532 1.532 0 0 0 12.76 16.39 L 17.34 13.77 L 19.39 14.94 L 12 19.17 L 4.613 14.94 L 6.652 13.77 z"
				fill="currentColor"
			/>
		</svg>
	),
	Haystack: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M2.0084 0C.8992 0 0 .8992 0 2.0084v19.9832C0 23.1006.8992 24 2.0084 24h19.9832C23.1006 24 24 23.1007 24 21.9916V2.0084C24 .8992 23.1007 0 21.9916 0Zm9.9624 3.84c3.4303 0 6.2108 2.7626 6.2108 6.1709v6.4875a.2688.2688 0 0 1-.2697.2681c-1.3425 0-2.4306-1.0811-2.4306-2.415v-4.3409c0-1.9265-1.572-3.488-3.5105-3.488s-3.424 1.562-3.424 3.488v1.608a.2633.2633 0 0 0 .259.2681h1.5394a.2693.2693 0 0 0 .2753-.263V9.9453c0-.7412.6044-1.3414 1.3503-1.3414s1.3502.6002 1.3502 1.3414V20.029a.2747.2747 0 0 1-.2807.2682c-1.3362 0-2.4198-1.0766-2.4198-2.4043v-3.2307a.2747.2747 0 0 0-.2753-.268H8.8114a.2637.2637 0 0 0-.2646.263v1.0789c0 1.3338-1.1746 2.4152-2.517 2.4152a.2688.2688 0 0 1-.2698-.268v-7.8724c0-3.4083 2.7805-6.1709 6.2108-6.1709Z"
				fill="currentColor"
			/>
		</svg>
	),
	JetBrains: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M2.345 23.997A2.347 2.347 0 0 1 0 21.652V10.988C0 9.665.535 8.37 1.473 7.433l5.965-5.961A5.01 5.01 0 0 1 10.989 0h10.666A2.347 2.347 0 0 1 24 2.345v10.664a5.056 5.056 0 0 1-1.473 3.554l-5.965 5.965A5.017 5.017 0 0 1 13.007 24v-.003H2.345Zm8.969-6.854H5.486v1.371h5.828v-1.371ZM3.963 6.514h13.523v13.519l4.257-4.257a3.936 3.936 0 0 0 1.146-2.767V2.345c0-.678-.552-1.234-1.234-1.234H10.989a3.897 3.897 0 0 0-2.767 1.145L3.963 6.514Zm-.192.192L2.256 8.22a3.944 3.944 0 0 0-1.145 2.768v10.664c0 .678.552 1.234 1.234 1.234h10.666a3.9 3.9 0 0 0 2.767-1.146l1.512-1.511H3.771V6.706Z"
				fill="currentColor"
			/>
		</svg>
	),
	Jupyter: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M7.157 22.201A1.784 1.799 0 0 1 5.374 24a1.784 1.799 0 0 1-1.784-1.799 1.784 1.799 0 0 1 1.784-1.799 1.784 1.799 0 0 1 1.783 1.799zM20.582 1.427a1.415 1.427 0 0 1-1.415 1.428 1.415 1.427 0 0 1-1.416-1.428A1.415 1.427 0 0 1 19.167 0a1.415 1.427 0 0 1 1.415 1.427zM4.992 3.336A1.047 1.056 0 0 1 3.946 4.39a1.047 1.056 0 0 1-1.047-1.055A1.047 1.056 0 0 1 3.946 2.28a1.047 1.056 0 0 1 1.046 1.056zm7.336 1.517c3.769 0 7.06 1.38 8.768 3.424a9.363 9.363 0 0 0-3.393-4.547 9.238 9.238 0 0 0-5.377-1.728A9.238 9.238 0 0 0 6.95 3.73a9.363 9.363 0 0 0-3.394 4.547c1.713-2.04 5.004-3.424 8.772-3.424zm.001 13.295c-3.768 0-7.06-1.381-8.768-3.425a9.363 9.363 0 0 0 3.394 4.547A9.238 9.238 0 0 0 12.33 21a9.238 9.238 0 0 0 5.377-1.729 9.363 9.363 0 0 0 3.393-4.547c-1.712 2.044-5.003 3.425-8.772 3.425Z"
				fill="currentColor"
			/>
		</svg>
	),
	LangChain: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M6.0988 5.9175C2.7359 5.9175 0 8.6462 0 12s2.736 6.0825 6.0988 6.0825h11.8024C21.2641 18.0825 24 15.3538 24 12s-2.736-6.0825-6.0988-6.0825ZM5.9774 7.851c.493.0124 1.02.2496 1.273.6228.3673.4592.4778 1.0668.8944 1.4932.5604.6118 1.199 1.1505 1.7161 1.802.4892.5954.8386 1.2937 1.1436 1.9975.1244.2335.1257.5202.31.7197.0908.1204.5346.4483.4383.5645.0555.1204.4702.286.3263.4027-.1944.04-.4129.0476-.5616-.1074-.0549.126-.183.0596-.2819.0432a4 4 0 0 0-.025.0736c-.3288.0219-.5754-.3126-.732-.565-.3111-.168-.6642-.2702-.982-.446-.0182.2895.0452.6485-.231.8353-.014.5565.8436.0656.9222.4804-.061.0067-.1286-.0095-.1774.0373-.2239.2172-.4805-.1645-.7385-.007-.3464.174-.3808.3161-.8096.352-.0237-.0359-.0143-.0592.0059-.0811.1207-.1399.1295-.3046.3356-.3643-.2122-.0334-.3899.0833-.5686.1757-.2323.095-.2304-.2141-.5878.0164-.0396-.0322-.0208-.0615.0018-.0864.0908-.1107.2102-.127.345-.1208-.663-.3686-.9751.4507-1.2813.0432-.092.0243-.1265.1068-.1845.1652-.05-.0548-.0123-.1212-.0099-.1857-.0598-.028-.1356-.041-.1179-.1366-.1171-.0395-.1988.0295-.286.0952-.0787-.0608.0532-.1492.0776-.2125.0702-.1216.23-.025.3111-.1126.2306-.1308.552.0814.8155.0455.203.0255.4544-.1825.3526-.39-.2171-.2767-.179-.6386-.1839-.9695-.0268-.1929-.491-.4382-.6252-.6462-.1659-.1873-.295-.4047-.4243-.6182-.4666-.9008-.3198-2.0584-.9077-2.8947-.266.1466-.6125.0774-.8418-.119-.1238.1125-.1292.2598-.139.4161-.297-.2962-.2593-.8559-.022-1.1855.0969-.1302.2127-.2373.342-.3316.0292-.0213.0391-.0419.0385-.0747.1174-.5267.5764-.7391 1.0694-.7267m12.4071.46c.5575 0 1.0806.2159 1.474.6082s.61.9145.61 1.4704c0 .556-.2167 1.078-.61 1.4698v.0006l-.902.8995a2.08 2.08 0 0 1-.8597.5166l-.0164.0047-.0058.0164a2.05 2.05 0 0 1-.474.7308l-.9018.8995c-.3934.3924-.917.6083-1.4745.6083s-1.0806-.216-1.474-.6083c-.813-.8107-.813-2.1294 0-2.9402l.9019-.8995a2.056 2.056 0 0 1 .858-.5143l.017-.0053.0058-.0158a2.07 2.07 0 0 1 .4752-.7337l.9018-.8995c.3934-.3924.9171-.6083 1.4745-.6083zm0 .8965a1.18 1.18 0 0 0-.8388.3462l-.9018.8995a1.181 1.181 0 0 0-.3427.9252l.0053.0572c.0323.2652.149.5044.3374.6917.13.1296.2733.2114.4471.2686a.9.9 0 0 1 .014.1582.884.884 0 0 1-.2609.6304l-.0554.0554c-.3013-.1028-.5525-.253-.7794-.4792a2.06 2.06 0 0 1-.5761-1.0968l-.0099-.0578-.0461.0368a1.1 1.1 0 0 0-.0876.0794l-.9024.8995c-.4623.461-.4623 1.212 0 1.673.2311.2305.535.346.8394.3461.3043 0 .6077-.1156.8388-.3462l.9019-.8995c.4623-.461.4623-1.2113 0-1.673a1.17 1.17 0 0 0-.4367-.2749 1 1 0 0 1-.014-.1611c0-.2591.1023-.505.2901-.6923.3019.1028.57.2694.7962.495.3007.2999.4994.679.5756 1.0968l.0105.0578.0455-.0373a1.1 1.1 0 0 0 .0887-.0794l.902-.8996c.4622-.461.4628-1.2124 0-1.6735a1.18 1.18 0 0 0-.8395-.3462Zm-9.973 5.1567-.0006.0006c-.0793.3078-.1048.8318-.506.847-.033.1776.1228.2445.2655.1874.141-.0645.2081.0508.2557.1657.2177.0317.5394-.0725.5516-.3298-.325-.1867-.4253-.5418-.5662-.8709"
				fill="currentColor"
			/>
		</svg>
	),
	Logseq: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M19.3 9.838c-2.677-1.366-5.467-1.56-8.316-.607-1.738.58-3.197 1.58-4.267 3.088-1.031 1.452-1.45 3.071-1.184 4.837.268 1.781 1.164 3.228 2.505 4.4C9.96 23.231 12.24 23.942 15.092 24c.41-.053 1.157-.103 1.883-.255 2.004-.418 3.754-1.325 5.08-2.915 1.621-1.942 2.108-4.148 1.272-6.562-.704-2.034-2.138-3.467-4.027-4.43ZM7.515 6.295c.507-2.162-.88-4.664-2.988-5.37-1.106-.37-2.156-.267-3.075.492C.61 2.114.294 3.064.271 4.146c.009.135.016.285.029.435.01.102.021.205.042.305.351 1.703 1.262 2.98 2.9 3.636 1.912.766 3.808-.244 4.273-2.227Zm4.064-1.146c1.075.377 2.152.31 3.22-.033.94-.3 1.755-.793 2.341-1.609.803-1.117.5-2.387-.717-3.027-.6-.317-1.246-.438-1.927-.48-.47.076-.95.117-1.41.234-1.068.27-2.002.781-2.653 1.7-.495.697-.64 1.45-.174 2.227.303.504.779.799 1.32.988Z"
				fill="currentColor"
			/>
		</svg>
	),
	Obsidian: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M19.355 18.538a68.967 68.959 0 0 0 1.858-2.954.81.81 0 0 0-.062-.9c-.516-.685-1.504-2.075-2.042-3.362-.553-1.321-.636-3.375-.64-4.377a1.707 1.707 0 0 0-.358-1.05l-3.198-4.064a3.744 3.744 0 0 1-.076.543c-.106.503-.307 1.004-.536 1.5-.134.29-.29.6-.446.914l-.31.626c-.516 1.068-.997 2.227-1.132 3.59-.124 1.26.046 2.73.815 4.481.128.011.257.025.386.044a6.363 6.363 0 0 1 3.326 1.505c.916.79 1.744 1.922 2.415 3.5zM8.199 22.569c.073.012.146.02.22.02.78.024 2.095.092 3.16.29.87.16 2.593.64 4.01 1.055 1.083.316 2.198-.548 2.355-1.664.114-.814.33-1.735.725-2.58l-.01.005c-.67-1.87-1.522-3.078-2.416-3.849a5.295 5.295 0 0 0-2.778-1.257c-1.54-.216-2.952.19-3.84.45.532 2.218.368 4.829-1.425 7.531zM5.533 9.938c-.023.1-.056.197-.098.29L2.82 16.059a1.602 1.602 0 0 0 .313 1.772l4.116 4.24c2.103-3.101 1.796-6.02.836-8.3-.728-1.73-1.832-3.081-2.55-3.831zM9.32 14.01c.615-.183 1.606-.465 2.745-.534-.683-1.725-.848-3.233-.716-4.577.154-1.552.7-2.847 1.235-3.95.113-.235.223-.454.328-.664.149-.297.288-.577.419-.86.217-.47.379-.885.46-1.27.08-.38.08-.72-.014-1.043-.095-.325-.297-.675-.68-1.06a1.6 1.6 0 0 0-1.475.36l-4.95 4.452a1.602 1.602 0 0 0-.513.952l-.427 2.83c.672.59 2.328 2.316 3.335 4.711.09.21.175.43.253.653z"
				fill="currentColor"
			/>
		</svg>
	),
	Rasa: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="m20.848 15.852-3.882-2.034H.97V7.515h22.06v6.303h-2.182v2.034ZM0 6.545v8.243h16.727l5.091 2.667v-2.667H24V6.545H0Zm1.94 1.94h4.12v2.18l-1.33.517 1.362 1.666H4.84l-1.06-1.296-.87.339v.957h-.97V8.485ZM8 12.848h-.97V8.485h4.364v4.363h-.97v-1.454H8v1.454Zm4.364-1.696V8.485h4.363v.97h-3.394v.727h3.394v2.666h-4.363v-.97h3.394v-.726h-3.394Zm5.333-.243V8.485h4.364v4.363h-.97v-1.454h-2.424v1.454h-.97V10.91Zm-14.788-.06 2.182-.848v-.546H2.909v1.395ZM8 9.456v.97h2.424v-.97H8Zm13.09.97v-.97h-2.423v.97h2.424Z"
				fill="currentColor"
			/>
		</svg>
	),
	Streamlit: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M16.673 11.32l6.862-3.618c.233-.136.554.12.442.387L20.463 17.1zm-8.556-.229l3.473-5.187c.203-.328.578-.316.793-.028l7.886 11.75zm-3.375 7.25c-.28 0-.835-.284-.993-.716l-3.72-9.46c-.118-.331.139-.614.48-.464l19.474 10.306c-.149.147-.453.337-.72.334z"
				fill="currentColor"
			/>
		</svg>
	),
	Vercel: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path d="m12 1.608 12 20.784H0Z" fill="currentColor" />
		</svg>
	),
	Windsurf: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M23.55 5.067c-1.2038-.002-2.1806.973-2.1806 2.1765v4.8676c0 .972-.8035 1.7594-1.7597 1.7594-.568 0-1.1352-.286-1.4718-.7659l-4.9713-7.1003c-.4125-.5896-1.0837-.941-1.8103-.941-1.1334 0-2.1533.9635-2.1533 2.153v4.8957c0 .972-.7969 1.7594-1.7596 1.7594-.57 0-1.1363-.286-1.4728-.7658L.4076 5.1598C.2822 4.9798 0 5.0688 0 5.2882v4.2452c0 .2147.0656.4228.1884.599l5.4748 7.8183c.3234.462.8006.8052 1.3509.9298 1.3771.313 2.6446-.747 2.6446-2.0977v-4.893c0-.972.7875-1.7593 1.7596-1.7593h.003a1.798 1.798 0 0 1 1.4718.7658l4.9723 7.0994c.4135.5905 1.05.941 1.8093.941 1.1587 0 2.1515-.9645 2.1515-2.153v-4.8948c0-.972.7875-1.7594 1.7596-1.7594h.194a.22.22 0 0 0 .2204-.2202v-4.622a.22.22 0 0 0-.2203-.2203Z"
				fill="currentColor"
			/>
		</svg>
	),
	Zapier: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M4.157 0A4.151 4.151 0 0 0 0 4.161v15.678A4.151 4.151 0 0 0 4.157 24h15.682A4.152 4.152 0 0 0 24 19.839V4.161A4.152 4.152 0 0 0 19.839 0H4.157Zm10.61 8.761h.03a.577.577 0 0 1 .23.038.585.585 0 0 1 .201.124.63.63 0 0 1 .162.431.612.612 0 0 1-.162.435.58.58 0 0 1-.201.128.58.58 0 0 1-.23.042.529.529 0 0 1-.235-.042.585.585 0 0 1-.332-.328.559.559 0 0 1-.038-.235.613.613 0 0 1 .17-.431.59.59 0 0 1 .405-.162Zm2.853 1.572c.03.004.061.004.095.004.325-.011.646.064.937.219.238.144.431.355.552.609.128.279.189.582.185.888v.193a2 2 0 0 1 0 .219h-2.498c.003.227.075.45.204.642a.78.78 0 0 0 .646.265.714.714 0 0 0 .484-.136.642.642 0 0 0 .23-.318l.915.257a1.398 1.398 0 0 1-.28.537c-.14.159-.321.284-.521.355a2.234 2.234 0 0 1-.836.136 1.923 1.923 0 0 1-1.001-.245 1.618 1.618 0 0 1-.665-.703 2.221 2.221 0 0 1-.227-1.036 1.95 1.95 0 0 1 .48-1.398 1.9 1.9 0 0 1 1.3-.488Zm-9.607.023c.162.004.325.026.48.079.207.065.4.174.563.314.26.302.393.692.366 1.088v2.276H8.53l-.109-.711h-.065c-.064.163-.155.31-.272.439a1.122 1.122 0 0 1-.374.264 1.023 1.023 0 0 1-.453.083 1.334 1.334 0 0 1-.866-.264.965.965 0 0 1-.329-.801.993.993 0 0 1 .076-.431 1.02 1.02 0 0 1 .242-.363 1.478 1.478 0 0 1 1.043-.303h.952v-.181a.696.696 0 0 0-.136-.454.553.553 0 0 0-.438-.154.695.695 0 0 0-.378.086.48.48 0 0 0-.193.254l-.99-.144a1.26 1.26 0 0 1 .257-.563c.14-.174.321-.302.533-.378.261-.091.54-.136.82-.129.053-.003.106-.007.163-.007Zm4.384.007c.174 0 .347.038.506.114.182.083.34.211.458.374.257.423.377.911.351 1.406a2.53 2.53 0 0 1-.355 1.448 1.148 1.148 0 0 1-1.009.517c-.204 0-.401-.045-.582-.136a1.052 1.052 0 0 1-.48-.457 1.298 1.298 0 0 1-.114-.234h-.045l.004 1.784h-1.059v-4.713h.904l.117.805h.057c.068-.208.177-.401.328-.56a1.129 1.129 0 0 1 .843-.344h.076v-.004Zm7.559.084h.903l.113.805h.053a1.37 1.37 0 0 1 .235-.484.813.813 0 0 1 .313-.242.82.82 0 0 1 .39-.076h.234v1.051h-.401a.662.662 0 0 0-.313.008.623.623 0 0 0-.272.155.663.663 0 0 0-.174.26.683.683 0 0 0-.027.314v1.875h-1.054v-3.666Zm-17.515.003h3.262v.896L3.73 13.104l.034.113h1.973l.042.9H2.4v-.9l1.931-1.754-.045-.117H2.441v-.896Zm11.815 0h1.055v3.659h-1.055V10.45Zm3.443.684.019.016a.69.69 0 0 0-.351.045.756.756 0 0 0-.287.204c-.11.155-.174.336-.189.522h1.545c-.034-.526-.257-.787-.74-.787h.003Zm-5.718.163c-.026 0-.057 0-.083.004a.78.78 0 0 0-.31.053.746.746 0 0 0-.257.189 1.016 1.016 0 0 0-.204.695v.064c-.015.257.057.507.204.711a.634.634 0 0 0 .253.196.638.638 0 0 0 .314.061.644.644 0 0 0 .578-.265c.14-.223.204-.48.189-.74a1.216 1.216 0 0 0-.181-.711.677.677 0 0 0-.503-.257Zm-4.509 1.266a.464.464 0 0 0-.268.102.373.373 0 0 0-.114.276c0 .053.008.106.027.155a.375.375 0 0 0 .087.132.576.576 0 0 0 .397.11v.004a.863.863 0 0 0 .563-.182.573.573 0 0 0 .211-.457v-.14h-.903Z"
				fill="currentColor"
			/>
		</svg>
	),

	// =====================
	// Letter-based monogram icons
	// =====================

	// Coding Assistants
	Aider: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Ad
			</text>
		</svg>
	),
	Augment: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Au
			</text>
		</svg>
	),
	CodeGPT: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				CG
			</text>
		</svg>
	),
	Continue: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Co
			</text>
		</svg>
	),
	Factory: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Fa
			</text>
		</svg>
	),
	Pieces: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Pi
			</text>
		</svg>
	),
	"Refact.ai": (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Re
			</text>
		</svg>
	),
	Roo: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Ro
			</text>
		</svg>
	),
	Sourcegraph: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Sg
			</text>
		</svg>
	),
	Tabnine: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Tn
			</text>
		</svg>
	),
	Warp: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Wa
			</text>
		</svg>
	),
	Zed: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Zd
			</text>
		</svg>
	),

	// Chat Interfaces
	AICamp: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				AC
			</text>
		</svg>
	),
	AnyChat: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				An
			</text>
		</svg>
	),
	AnythingLLM: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				AL
			</text>
		</svg>
	),
	BoltAI: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				BA
			</text>
		</svg>
	),
	Chai: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Ch
			</text>
		</svg>
	),
	ChatBox: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				CB
			</text>
		</svg>
	),
	ChatHub: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				CH
			</text>
		</svg>
	),
	Hugging: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				HF
			</text>
		</svg>
	),
	Jan: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Jn
			</text>
		</svg>
	),
	LibreChat: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				LC
			</text>
		</svg>
	),
	LLM: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				LL
			</text>
		</svg>
	),
	Magai: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Mg
			</text>
		</svg>
	),
	MindMac: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				MM
			</text>
		</svg>
	),
	Msty: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Ms
			</text>
		</svg>
	),
	Open: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				OW
			</text>
		</svg>
	),
	Shapes: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Sh
			</text>
		</svg>
	),
	TypingMind: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				TM
			</text>
		</svg>
	),
	Voila: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Vo
			</text>
		</svg>
	),

	// Autonomous AI Agents
	Agent: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Ag
			</text>
		</svg>
	),
	AutoGPT: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				AG
			</text>
		</svg>
	),
	"Bolt.diy": (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Bd
			</text>
		</svg>
	),
	Composio: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Cm
			</text>
		</svg>
	),
	CrewAI: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				CA
			</text>
		</svg>
	),
	Letta: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Le
			</text>
		</svg>
	),
	OpenAI: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				OA
			</text>
		</svg>
	),
	OpenHands: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				OH
			</text>
		</svg>
	),
	"SWE-Agent": (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				SW
			</text>
		</svg>
	),

	// Workflow Automation
	Activepieces: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Ap
			</text>
		</svg>
	),
	AirOps: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				AO
			</text>
		</svg>
	),
	Latenode: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Ln
			</text>
		</svg>
	),
	Make: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Mk
			</text>
		</svg>
	),

	// LLM Flow Builders
	Dify: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Df
			</text>
		</svg>
	),
	Flowise: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Fw
			</text>
		</svg>
	),
	Langflow: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Lf
			</text>
		</svg>
	),
	MindPal: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				MP
			</text>
		</svg>
	),
	MindStudio: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				MS
			</text>
		</svg>
	),
	Pickaxe: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Px
			</text>
		</svg>
	),
	Rivet: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Rv
			</text>
		</svg>
	),

	// RAG & Enterprise Search
	Chroma: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Cr
			</text>
		</svg>
	),
	Libraria: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Lb
			</text>
		</svg>
	),
	LlamaIndex: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				LI
			</text>
		</svg>
	),
	Pathway: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Pw
			</text>
		</svg>
	),
	Quivr: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Qv
			</text>
		</svg>
	),
	Weaviate: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Wv
			</text>
		</svg>
	),

	// LLM Observability
	Braintrust: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Bt
			</text>
		</svg>
	),
	Helicone: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				He
			</text>
		</svg>
	),
	Langfuse: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Lg
			</text>
		</svg>
	),
	LangSmith: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				LS
			</text>
		</svg>
	),
	Portkey: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Pk
			</text>
		</svg>
	),
	Promptfoo: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Pf
			</text>
		</svg>
	),
	PromptLayer: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				PL
			</text>
		</svg>
	),

	// AI App Builders
	Retool: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Rt
			</text>
		</svg>
	),

	// Notes & Knowledge
	HARPA: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				HA
			</text>
		</svg>
	),
	Khoj: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Kh
			</text>
		</svg>
	),

	// Writing & Creative
	Chub: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Cu
			</text>
		</svg>
	),
	Hammer: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Hm
			</text>
		</svg>
	),
	Isekai: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Is
			</text>
		</svg>
	),
	Janitor: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Ja
			</text>
		</svg>
	),
	Novelcrafter: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Nc
			</text>
		</svg>
	),
	SillyTavern: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				ST
			</text>
		</svg>
	),
	SkyrimNet: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				SN
			</text>
		</svg>
	),
	Writingmate: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Wm
			</text>
		</svg>
	),

	// Customer Support
	Botpress: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Bp
			</text>
		</svg>
	),
	Vapi: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Va
			</text>
		</svg>
	),
	Voiceflow: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Vf
			</text>
		</svg>
	),

	// Data Analysis
	Cube: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Cb
			</text>
		</svg>
	),
	OpenBlock: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				OB
			</text>
		</svg>
	),
	SheetAI: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				SA
			</text>
		</svg>
	),

	// Dev Notebooks
	Marimo: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Ma
			</text>
		</svg>
	),

	// Browser Extensions
	Sider: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Si
			</text>
		</svg>
	),

	// Local Self Hosted
	KoboldAI: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				KA
			</text>
		</svg>
	),
	PrivateGPT: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				PG
			</text>
		</svg>
	),

	// Meeting Transcription
	Meetily: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Me
			</text>
		</svg>
	),
	Pensieve: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Pe
			</text>
		</svg>
	),

	// Data Extraction
	OttoGrid: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				OG
			</text>
		</svg>
	),
	Unstract: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Un
			</text>
		</svg>
	),

	// Security & Compliance
	Guardrails: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Gu
			</text>
		</svg>
	),

	// Sales & Marketing
	Clay: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Cl
			</text>
		</svg>
	),

	// Presentation & Document
	Presenton: (props) => (
		<svg
			style={{ flex: "none", lineHeight: "1" }}
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<rect width="24" height="24" rx="6" fill="currentColor" />
			<text
				x="12"
				y="17"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="system-ui, sans-serif"
				fill="white"
			>
				Pr
			</text>
		</svg>
	),
};
