export interface EmailLayoutProps {
	title: string;
	content: string;
	preview?: string;
}

export function getEmailLayout({
	title,
	content,
	preview,
}: EmailLayoutProps): string {
	// Common styles from existing templates
	const styles = {
		body: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;",
		container:
			"background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;",
		footer:
			"text-align: center; font-size: 12px; color: #999; margin-top: 20px;",
	};

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title}</title>
</head>
<body style="${styles.body}">
    ${
			preview
				? `<span style="display:none;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
        ${preview}
    </span>`
				: ""
		}
	<div style="${styles.container}">
		${content}
	</div>
	<div style="${styles.footer}">
		<p>LLM API - Your LLM API Gateway Platform</p>
	</div>
</body>
</html>
`.trim();
}
