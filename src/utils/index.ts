export const debug = (...args: any) => {
  if (utools.isDev?.()) {
    console.log(...args)
  }
}

export const openUrl = (url: string) => {
  window.utools ? utools.shellOpenExternal(url) : window.open(url, '_blank')
}

export const copyText = (text: string) => {
  window.utools ? utools.copyText(text) : navigator.clipboard.writeText(text)
}

export const isUtoolsEnv = (): boolean => {
  return !!window.utools
}

export const saveDb = (key: string, value: string): void => {
  if (isUtoolsEnv()) {
    utools.dbStorage.setItem(key, value)
  } else {
    localStorage.setItem(key, value);
  }
}

export const queryDb = (key: string): string | null => {
  if (isUtoolsEnv()) {
    return utools.dbStorage.getItem(key)
  } else {
    return localStorage.getItem(key);
  }
}