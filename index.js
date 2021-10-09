const { execSync } = require("child_process");
const { existsSync } = require("fs");
const { join } = require("path");

/** Logs to the console */
const log = (msg) => console.log(`\n${msg}`); // eslint-disable-line no-console

/** Exits the current process with an error code and message */
const exit = (msg) => {
	console.error(msg);
	process.exit(1);
};

/** Executes the provided shell command and redirects stdout/stderr to the console */
const run = (cmd, cwd) => execSync(cmd, { encoding: "utf8", stdio: "inherit", cwd });

/** Determines the current operating system (one of ["mac", "windows", "linux"]) */
const getPlatform = () => {
	switch (process.platform) {
		case "darwin":
			return "mac";
		case "win32":
			return "windows";
		default:
			return "linux";
	}
};

/** Returns the value for an environment variable (or `null` if it's not defined) */
const getEnv = (name) => process.env[name.toUpperCase()] || null;

/** Sets the specified env variable if the value isn't empty */
const setEnv = (name, value) => {
	if (value) {
		process.env[name.toUpperCase()] = value.toString();
	}
};

/**
 * Returns the value for an input variable (or `null` if it's not defined). If the variable is
 * required and doesn't have a value, abort the action
 */
const getInput = (name, required) => {
	const value = getEnv(`INPUT_${name}`);
	if (required && !value) {
		exit(`"${name}" input variable is not defined`);
	}
	return value;
};

/** Installs NPM dependencies and builds/releases the Electron app */
const runAction = () => {
	// const platform = getPlatform();
	const release = getInput("release", true) === "true";
	const pkgRoot = '.'
	// const buildScriptName = getInput("build_script_name", true);
	// const skipBuild = getInput("skip_build") === "true";

	// TODO: Deprecated option, remove in v2.0. `electron-builder` always requires a `package.json` in
	// the same directory as the Electron app, so the `package_root` option should be used instead
	// const appRoot = getInput("app_root") || pkgRoot;

	const pkgJsonPath = join(pkgRoot, "package.json");

	log(`Will run NPM/YARN commands in directory: "${pkgJsonPath}"`);

	// Make sure `package.json` file exists
	if (!existsSync(pkgJsonPath)) {
		exit(`\`package.json\` file not found at path "${pkgJsonPath}"`);
	}

	// Copy "github_token" input variable to "GH_TOKEN" env variable (required by `electron-builder`)
	setEnv("GH_TOKEN", getInput("github_token", true));
	setEnv("GITHUB_TOKEN", getInput("github_token", true));

	// Disable console advertisements during install phase
	setEnv("ADBLOCK", true);

	log(`Installing dependencies ...`);
	run("yarn install --frozen-lockfile", pkgRoot);

	try {
		log(`Building${release ? " and releasing" : ""} the Electron app…`);
		run(`npx electron-forge publish`, pkgRoot);
	} catch(err) {
		log(`Failed with an error, probably the "it already exists" one`)
		log(err.message)
	}
};

runAction();