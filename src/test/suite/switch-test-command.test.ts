import * as chai from "chai"
import { expect } from "chai"
import * as spies from "chai-spies"
import { describe, suite, test } from "mocha"
import * as proxyquire from "proxyquire"
import * as vscode from "vscode"
import * as command from "../../switch-test-command"

chai.use(spies)

describe("switch-test-command module", () => {
  suite("switchTestCommand", () => {
    test("Switch test file", () => {
      const findFiles = chai.spy(() =>
        Promise.resolve(vscode.Uri.file("dummy"))
      )

      const switchTestCommand = proxyquire("../../switch-test-command", {
        vscode: {
          window: {
            activeTextEditor: { document: { fileName: "sample_spec.rb" } }
          },
          workspace: {
            findFiles
          }
        }
      }) as typeof command

      switchTestCommand.switchTestCommand()

      expect(findFiles).to.have.been.called.with("**/sample.rb")
    })
  })

  suite("getCandidateFileNames", () => {
    test("Pass test file", () => {
      const candidates = command.getCandidateFileNames("sample_spec.rb")

      expect(candidates).to.deep.equal(["sample.rb"])
    })

    test("Pass not test file", () => {
      const candidates = command.getCandidateFileNames("sample.rb")

      expect(candidates).to.deep.equal([
        "sample.test.rb",
        "sample_test.rb",
        "sample-test.rb",
        "sample.spec.rb",
        "sample_spec.rb",
        "sample-spec.rb",
        "sample.stories.rb"
      ])
    })
  })
})
