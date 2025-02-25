export const isTestKey = (key: string | undefined): boolean => {
  return Boolean(key && key.startsWith('test-'));
};

export const validateApiKey = (key: string | undefined, prefix?: string): boolean => {
  if (isTestKey(key)) {
    return true;
  }

  if (!key) {
    return false;
  }

  if (prefix && !key.startsWith(prefix)) {
    return false;
  }

  return true;
};



