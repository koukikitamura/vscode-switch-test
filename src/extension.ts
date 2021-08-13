import * as vscode from "vscode"

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export const activate = (context: vscode.ExtensionContext) => {
  let disposable = vscode.commands.registerCommand(
    "extension.switch-test",
    () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) {
        return
      }

      // const openedFileName = editor.document.fileName
    }
  )

  context.subscriptions.push(disposable)
}

// this method is called when your extension is deactivated
export const deactivate = () => {}
