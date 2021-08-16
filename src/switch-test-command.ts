import vscode = require("vscode")
import path = require("path")

const testFileSuffixList = [
  ".test",
  "_test",
  "-test",
  ".spec",
  "_spec",
  "-spec",
  ".stories"
]

export const switchTestCommand = () => {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }

  const fileName = path.basename(editor.document.fileName)

  getCandidateFileNames(fileName).forEach(openFiles)
}

const openFiles = (fileName: string) => {
  vscode.workspace.findFiles(fileName).then((files) => {
    files.forEach((file) => vscode.window.showTextDocument(file))
  })
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

// this method is called when your extension is deactivated
export const deactivate = () => {}
