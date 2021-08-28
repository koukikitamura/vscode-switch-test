import vscode = require("vscode")
import path = require("path")
import { uniq } from "./util"

const testFileSuffixList = [
  ".test",
  "_test",
  "-test",
  ".spec",
  "_spec",
  "-spec",
  ".stories"
]

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

const getFilePathCandidates = (fileRelativePath: string): string[] => {
  const fileName = path.basename(fileRelativePath)

  const filePathCandidates: string[] = []

  getCandidatesDirPaths(fileRelativePath).forEach((dirCandidate) => {
    getCandidateFileNames(fileName).forEach((fileNameCandidate) => {
      filePathCandidates.push(path.join(dirCandidate, fileNameCandidate))
    })
  })

  return filePathCandidates
}

export const getCandidatesDirPaths = (fileRelativePath: string): string[] => {
  const dirPath = path.dirname(fileRelativePath)
  const fileName = path.basename(fileRelativePath)

  const { isTestFile } = checkTestFile(fileName)
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

export const getCandidateFileNames = (fileName: string): string[] => {
  const extension = path.extname(fileName)
  const excludeExtension = path.basename(fileName, extension)

  const { isTestFile, testSuffix } = checkTestFile(fileName)
  if (isTestFile) {
    return [excludeExtension.slice(0, -testSuffix.length) + extension]
  } else {
    return testFileSuffixList.map(
      (suffix) => excludeExtension + suffix + extension
    )
  }
}

const checkTestFile = (
  fileName: string
): { isTestFile: boolean; testSuffix: string } => {
  const extension = path.extname(fileName)
  const excludeExtension = path.basename(fileName, extension)

  let isTestFile = false
  let testSuffix = ""

  testFileSuffixList.forEach((suffix) => {
    if (excludeExtension.endsWith(suffix)) {
      isTestFile = true
      testSuffix = suffix
    }
  })

  return { isTestFile, testSuffix }
}
