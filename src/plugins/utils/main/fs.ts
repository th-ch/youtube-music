import fs from 'node:fs';

export const fileExists = (
  path: fs.PathLike,
  callbackIfExists: () => void,
  callbackIfError: (() => void) | undefined = undefined
) => {
  fs.access(path, fs.constants.F_OK, (err) => {
    if (err) {
      // File doesn't exist or there was an error accessing it
      if (callbackIfError) {
        callbackIfError();
      }
    } else {
      // File exists and is accessible
      callbackIfExists();
    }
  });
};
