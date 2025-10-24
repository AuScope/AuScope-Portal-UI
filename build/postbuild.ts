/* eslint-disable @typescript-eslint/require-await */
import dotenvx from "@dotenvx/dotenvx";
import { setVersion } from "./steps/set-version";

dotenvx.config({ ignore: [ "MISSING_ENV_FILE" ] });


(async () =>
{
	const {
    GITHUB_RUN_NUMBER,
	} = process.env;

	if (GITHUB_RUN_NUMBER)
		setVersion();

})()
	.catch(error =>
	{
		console.error(error);
		process.exit(1);
	});
