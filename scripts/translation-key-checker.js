/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-var-requires */
import { promises as fs } from 'fs';
import { exit } from 'process';
import { clearLine } from 'readline';

const red = '\x1b[1;31m';
const green = '\x1b[1;32m';
const yellow = '\x1b[1;33m';
const noColor = '\x1b[0m';

// First language is the reference language, the rest are checked against it
const languages = ['el', 'en'];

const husky = process.env.HUSKY_HOOK === 'true';

const filePaths = {
  common: './lib/i18n/locales/',
};

const arrayDifference = (arr1, arr2) => arr1.filter((x) => !arr2.includes(x));

const getKeys = (obj) => {
  const objectKeys = Object.keys(obj);
  const keys = [];

  for (let i = 0; i < objectKeys.length; i++) {
    const key = objectKeys[i];

    if (typeof obj[key] === 'object') {
      keys.push(...getKeys(obj[key]).map((k) => `${key}.${k}`));
    } else {
      keys.push(key);
    }
  }

  return keys;
};

const checkKeyParity = (files, app) => {
  let hasParity = true;

  for (let i = 1; i < files.length; i++) {
    const keys = getKeys(files[0]);
    const otherKeys = getKeys(files[i]);

    const difference = arrayDifference(keys, otherKeys);

    if (!husky) {
      clearLine(process.stdout);
      process.stdout.write('\n');
    }

    if (difference.length > 0) {
      hasParity = false;

      if (husky) {
        process.stdout.write(
          `[FAIL] Missing keys found in "${app}/${languages[i]}" (compared to "${app}/${languages[0]}"):\n`
        );
      } else {
        process.stdout.write(
          `${red}X${noColor} Missing keys found in ${yellow}${app}/${languages[i]}${noColor} (compared to ${yellow}${app}/${languages[0]}${noColor}): \n`
        );
      }

      difference.forEach((key) => {
        if (husky) {
          process.stdout.write(`        ${key}\n`);
        } else {
          process.stdout.write(`${red}    ${key}${noColor}\n`);
        }
      });

      process.stdout.write('\n');
    }
  }

  return hasParity;
};

const apps = Object.keys(filePaths);

let allOk = true;

const main = async () => {
  await Promise.all(
    apps.map(async (app) => {
      if (husky) {
        process.stdout.write(`[START] Checking translations for "${app}"...\n`);
      } else {
        process.stdout.write(
          `${yellow}❯${noColor} Checking translations for "${app}"...`
        );
      }

      const test = languages.map(async (language) => {
        const path = `${filePaths[app]}${language}.json`;
        const file = await fs.readFile(path);
        return [JSON.parse(file)];
      });

      const result = await Promise.all(test);

      const files = result.map((r) => r[0]);

      const hasParity = checkKeyParity(files, app);

      if (hasParity) {
        if (husky) {
          process.stdout.write(
            `[SUCCESS] Translations for "${app}" are in parity\n`
          );
        } else {
          process.stdout.write(
            `${green}✓${noColor} Translations for ${yellow}${app}${noColor} are in parity\n`
          );
        }
      } else {
        allOk = false;
      }
    })
  );

  if (allOk) {
    exit(0);
  } else {
    exit(1);
  }
};

main();
