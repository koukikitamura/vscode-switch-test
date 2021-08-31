import vscode = require("vscode")
import path = require("path")
import { uniq } from "./util"

// The relative structure of the application file to the test file supports:
//
// - ./
// - ./test
// - ./spec
// - /test
// - /spec

export const switchTestCommand = async () => {
  const activeEditor = vscode.window.activeTextEditor
  if (!activeEditor) {
    return
  }

  const currentWorkspace = vscode.workspace.getWorkspaceFolder(
    activeEditor.document.uri
  )
  if (!currentWorkspace) {
    return
  }

  const rootDirAbsolutePath = currentWorkspace.uri.path
  const openedFileAbsolutePath = activeEditor.document.fileName
  const openedFileRelativePath = path.relative(
    rootDirAbsolutePath,
    openedFileAbsolutePath
  )

  let fileOpened = false
  for (let p of getFilePathCandidates(openedFileRelativePath)) {
    if (fileOpened) {
      return
    }
    fileOpened = await openFiles(p)
  }
}

const openFiles = async (fileName: string): Promise<boolean> => {
  return await vscode.workspace.findFiles(fileName).then((files) => {
    let opened = false
    files.forEach((file) => {
      vscode.window.showTextDocument(file)
      opened = true
    })

    return opened
  })
}

const getFilePathCandidates = (
  fileRelativePath: string,
  testFileSuffixesArg: string[] = []
): string[] => {
  const fileName = path.basename(fileRelativePath)
  const extension = path.extname(fileName)
  const testFileSuffixes =
    testFileSuffixesArg.length > 0
      ? testFileSuffixesArg
      : getTestFileSuffixes(extension)

  const filePathCandidates: string[] = []

  getCandidatesDirPaths(fileRelativePath, testFileSuffixes).forEach(
    (dirCandidate) => {
      getCandidateFileNames(fileName, testFileSuffixes).forEach(
        (fileNameCandidate) => {
          filePathCandidates.push(path.join(dirCandidate, fileNameCandidate))
        }
      )
    }
  )

  return filePathCandidates
}

export const getCandidatesDirPaths = (
  fileRelativePath: string,
  testFileSuffixes: string[]
): string[] => {
  const dirPath = path.dirname(fileRelativePath)
  const fileName = path.basename(fileRelativePath)

  const { isTestFile } = checkTestFile(fileName, testFileSuffixes)
  const switchToTestFile = !isTestFile

  let candidates: string[] = []
  if (switchToTestFile) {
    candidates = [
      dirPath,
      path.join(dirPath, "test"),
      path.join(dirPath, "spec"),
      path.join("test", dropTopDir(dirPath)),
      path.join("spec", dropTopDir(dirPath))
    ]
  } else {
    if (dirPath.match(/\/(test|spec)$/)) {
      candidates.push(dropBottomDir(dirPath))
    } else if (
      dirPath.match(/^(test|spec)\//) ||
      dirPath === "test" ||
      dirPath === "spec"
    ) {
      candidates.push(path.join("*", dropTopDir(dirPath)))
    } else {
      candidates.push(dirPath)
    }
  }

  return uniq(candidates)
}

const dropTopDir = (relativePath: string): string => {
  const slashIndex = relativePath.indexOf(path.sep)

  if (slashIndex >= 0) {
    return relativePath.substring(slashIndex + 1, relativePath.length)
  } else {
    return ""
  }
}

const dropBottomDir = (relativePath: string): string => {
  let slashIndex = -1
  for (let i = relativePath.length - 1; i >= 0; i--) {
    if (relativePath.charAt(i) == path.sep) {
      slashIndex = i
      break
    }
  }

  if (slashIndex >= 0) {
    return relativePath.substring(0, slashIndex)
  } else {
    return ""
  }
}

export const getCandidateFileNames = (
  fileName: string,
  testFileSuffixes: string[]
): string[] => {
  const extension = path.extname(fileName)
  const excludeExtension = path.basename(fileName, extension)

  const { isTestFile, testSuffix } = checkTestFile(fileName, testFileSuffixes)
  if (isTestFile) {
    return [excludeExtension.slice(0, -testSuffix.length) + extension]
  } else {
    return testFileSuffixes.map(
      (suffix) => excludeExtension + suffix + extension
    )
  }
}

const checkTestFile = (
  fileName: string,
  testFileSuffixes: string[]
): { isTestFile: boolean; testSuffix: string } => {
  const extension = path.extname(fileName)
  const excludeExtension = path.basename(fileName, extension)

  let isTestFile = false
  let testSuffix = ""

  testFileSuffixes.forEach((suffix) => {
    if (excludeExtension.endsWith(suffix)) {
      isTestFile = true
      testSuffix = suffix
    }
  })

  return { isTestFile, testSuffix }
}

const testFileAllSuffixes = [
  ".test",
  "_test",
  "-test",
  ".spec",
  "_spec",
  "-spec",
  ".stories"
]

type testFileSuffixConfig = testFileSuffixConfigItem[]

type testFileSuffixConfigItem = {
  extension: string
  testFileSuffixes: string[]
}

export const getTestFileSuffixes = (extension: string): string[] => {
  const config = vscode.workspace
    .getConfiguration("switchTest")
    .get<testFileSuffixConfig>("testFileSuffix")

  if (!config) {
    return testFileAllSuffixes
  }

  for (let item of config) {
    if (extension === item.extension) {
      return item.testFileSuffixes
    }
  }

  return testFileAllSuffixes
}
