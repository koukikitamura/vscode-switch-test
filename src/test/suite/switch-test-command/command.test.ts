import * as chai from "chai"
import { expect } from "chai"
import * as spies from "chai-spies"
import { describe, suite, test } from "mocha"
import * as proxyquire from "proxyquire"
import * as vscode from "vscode"
import * as command from "../../../switch-test-command/command"

chai.use(spies)

describe("switch-test-command module", () => {
  suite("switchTestCommand", () => {
    test("Switch test file", () => {
      const findFiles = chai.spy(() =>
        Promise.resolve([vscode.Uri.file("dummy")])
      )

      const proxyCommand = proxyquire("../../../switch-test-command/command", {
        vscode: {
          window: {
            activeTextEditor: {
              document: {
                fileName: "/Users/michael/dev/dummy_project/sample_spec.rb"
              }
            },
            showTestDocument: () => {}
          },
          workspace: {
            findFiles,
            getWorkspaceFolder: () => ({
              uri: { path: "/Users/michael/dev/dummy_project" }
            }),
            getConfiguration: () => {
              return {
                get: () => [
                  { extension: ".rb", testFileSuffixes: ["_test", "_spec"] }
                ]
              }
            }
          }
        }
      }) as typeof command

      proxyCommand.switchTestCommand()

      expect(findFiles).to.have.been.called.with("sample.rb")
    })
  })

  suite("getCandidatesDirPaths", () => {
    describe("Opened application code file", () => {
      test("File under top directory", () => {
        expect(command.getCandidatesDirPaths("sample.rb", [])).to.deep.equal([
          ".",
          "test",
          "spec"
        ])
      })

      test("File under nested directory", () => {
        expect(
          command.getCandidatesDirPaths("src/bar/sample.rb", [])
        ).to.deep.equal([
          "src/bar",
          "src/bar/test",
          "src/bar/spec",
          "test/bar",
          "spec/bar"
        ])
      })
    })

    describe("Opened test file", () => {
      test("Test file under ./ from application code file", () => {
        expect(
          command.getCandidatesDirPaths("src/bar/sample_spec.rb", ["_spec"])
        ).to.deep.equal(["src/bar"])
      })

      test("Test file under ./test from application code file", () => {
        expect(
          command.getCandidatesDirPaths("src/bar/test/sample_test.rb", [
            "_test"
          ])
        ).to.deep.equal(["src/bar"])
      })

      test("Test file under ./spec from application code file", () => {
        expect(
          command.getCandidatesDirPaths("src/bar/spec/sample_spec.rb", [
            "_spec"
          ])
        ).to.deep.equal(["src/bar"])
      })

      test("Test file under /test/** from application code file", () => {
        expect(
          command.getCandidatesDirPaths("spec/bar/sample_spec.rb", ["_spec"])
        ).to.deep.equal(["*/bar"])
      })

      test("Test file under /test/** from application code file", () => {
        expect(
          command.getCandidatesDirPaths("test/bar/sample_test.rb", ["_test"])
        ).to.deep.equal(["*/bar"])
      })
    })
  })

  suite("getCandidateFileNames", () => {
    test("Pass test file", () => {
      const candidates = command.getCandidateFileNames("sample_spec.rb", [
        "_spec",
        "_test"
      ])

      expect(candidates).to.deep.equal(["sample.rb"])
    })

    test("Pass not test file", () => {
      const candidates = command.getCandidateFileNames("sample.rb", [
        "_test",
        "_spec"
      ])

      expect(candidates).to.deep.equal(["sample_test.rb", "sample_spec.rb"])
    })
  })

  suite("getTestFileSuffixes", () => {
    test("Get default value", () => {
      expect(command.getTestFileSuffixes(".rb")).to.deep.equal([
        "_test",
        "_spec"
      ])
    })
  })
})
