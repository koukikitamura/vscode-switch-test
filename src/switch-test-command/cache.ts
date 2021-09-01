import path = require("path")

class SwitchCache {
  // absolute path to relative path
  private cache: Map<string, string>

  constructor() {
    this.cache = new Map<string, string>()
  }

  read = (absolutePath: string): string | null => {
    return this.cache.get(absolutePath) || null
  }

  write = (
    projectDirPath: string,
    relativePath1: string,
    relativePath2: string
  ) => {
    this.cache.set(path.join(projectDirPath, relativePath1), relativePath2)
    this.cache.set(path.join(projectDirPath, relativePath1), relativePath2)
  }
}

export const switchCache = new SwitchCache()
