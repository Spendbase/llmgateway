export async function submitToHubSpot(data: {
	email: string;
	firstname?: string;
	lastname?: string;
	referral?: string;
	hutk?: string;
	pageUri?: string;
	pageName?: string;
}) {
	const portalId = process.env.HUBSPOT_PORTAL_ID;
	const formGuid = process.env.HUBSPOT_FORM_GUID;

	const fields = [
		{ name: "email", value: data.email },
		{ name: "firstname", value: data.firstname },
		{ name: "lastname", value: data.lastname },
		{ name: "where_did_you_find_us", value: data.referral },
	].filter((f) => f.value !== undefined);

	const context = {
		hutk: data.hutk,
		pageUri: data.pageUri,
		pageName: data.pageName,
	};

	const body = {
		fields,
		context,
	};

	try {
		const response = await fetch(
			`https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			},
		);

		if (!response.ok) {
			const errorData = await response.json();
			return errorData;
			// console.error("HubSpot Error:", errorData);
		}
	} catch (error) {
		// console.error("HubSpot Submission Failed:", error);
		return error;
	}
}

export async function trackHubSpotClosedWon(email: string) {
	const token = process.env.HUBSPOT_ACCESS_TOKEN;
	if (!token) {
		return null;
	}

	try {
		await fetch(
			`https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`,
			{
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					properties: {
						lifecyclestage: "customer",
					},
				}),
			},
		);
		return true;
	} catch (error) {
		return error;
	}
}

export async function trackHubSpotMQL(email: string) {
	const token = process.env.HUBSPOT_ACCESS_TOKEN;
	if (!token) {
		return null;
	}

	try {
		await fetch(
			`https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`,
			{
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					properties: {
						lifecyclestage: "marketingqualifiedlead",
					},
				}),
			},
		);
		return true;
	} catch (error) {
		return error;
	}
}
