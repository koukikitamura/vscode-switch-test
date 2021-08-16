import vscode = require("vscode")
import { switchTestCommand } from "./switch-test-command"

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export const activate = (context: vscode.ExtensionContext) => {
  let disposable = vscode.commands.registerCommand(
    "extension.switch-test",
    switchTestCommand
  )

  context.subscriptions.push(disposable)
}
