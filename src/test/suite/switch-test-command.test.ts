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
        Promise.resolve([vscode.Uri.file("dummy")])
      )

      const proxyCommand = proxyquire("../../switch-test-command", {
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
            getWorkspaceFolder: () => ({
              uri: { path: "/Users/michael/dev/dummy_project" }
            }),
            findFiles
          }
        }
      }) as typeof command

      proxyCommand.switchTestCommand()

      expect(findFiles).to.have.been.called.with("sample.rb")
    })
  })

  suite("getCandidatesDirPaths", () => {
    describe("opened application code file", () => {
      test("file under top directory", () => {
        expect(command.getCandidatesDirPaths("sample.rb")).to.deep.equal([
          ".",
          "test",
          "spec"
        ])
      })

      test("file under nested directory", () => {
        expect(
          command.getCandidatesDirPaths("src/bar/sample.rb")
        ).to.deep.equal([
          "src/bar",
          "src/bar/test",
          "src/bar/spec",
          "test/bar",
          "spec/bar"
        ])
      })
    })

    describe("opened test file", () => {
      test("test file under ./ from application code file", () => {
        expect(
          command.getCandidatesDirPaths("src/bar/sample_spec.rb")
        ).to.deep.equal(["src/bar"])
      })

      test("test file under ./test from application code file", () => {
        expect(
          command.getCandidatesDirPaths("src/bar/test/sample_test.rb")
        ).to.deep.equal(["src/bar"])
      })

      test("test file under ./spec from application code file", () => {
        expect(
          command.getCandidatesDirPaths("src/bar/spec/sample_spec.rb")
        ).to.deep.equal(["src/bar"])
      })

      test("test file under /test/** from application code file", () => {
        expect(
          command.getCandidatesDirPaths("spec/bar/sample_spec.rb")
        ).to.deep.equal(["*/bar"])
      })

      test("test file under /test/** from application code file", () => {
        expect(
          command.getCandidatesDirPaths("test/bar/sample_test.rb")
        ).to.deep.equal(["*/bar"])
      })
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
