import * as fs from "fs-extra/esm";
import * as path from "path";


export const setVersion = () =>
{
	const cwd = process.cwd();
	const {
		CI,
    GITHUB_JOB,
    GITHUB_REF_NAME,
    GITHUB_RUN_ID,
    GITHUB_SHA,
    GITHUB_BASE_REF
	} = process.env;
	const
		GITHUB_RUN_NUMBER = +(process.env["GITHUB_RUN_NUMBER"] ?? 0)
	;

	const versionJson: any = {
		build: GITHUB_RUN_NUMBER,
	};

	console.log("Setting application version in version.json");
	try
	{
		const npmPackage = fs.readJSONSync(path.join(cwd, "package.json"), "utf-8");

		// Add build number to the version.
		if (npmPackage.version)
		{
      versionJson.name = npmPackage.name;
			versionJson.version = `${ npmPackage.version }${ CI ? "" : "-local" }${ +(GITHUB_RUN_NUMBER ?? 0) ? "+" + GITHUB_RUN_NUMBER : "" }`;
			console.log(`App version: ${ versionJson.version }`);
		}
	}
	catch (ex)
	{
    console.log(ex);
		throw new Error("Couldn't load package.json");
	}

	// Add CI environment information.
	versionJson.ci = {
		jobId: GITHUB_JOB,
		refName: GITHUB_REF_NAME,
		runId: GITHUB_RUN_ID,
		branch: GITHUB_BASE_REF,
    sha: GITHUB_SHA,
		timestamp: (new Date()).toISOString(),
	};

	// Save version.json
	fs.writeJSONSync(
		path.join(cwd, "dist", "version.json"),
		versionJson
	);

	console.log("Done");
};
