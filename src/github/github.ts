import { Component } from "../component";
import { Project } from "../project";
import { AutoApprove, AutoApproveOptions } from "./auto-approve";
import { AutoMergeOptions } from "./auto-merge";
import { Dependabot, DependabotOptions } from "./dependabot";
import { Mergify, MergifyOptions } from "./mergify";
import { PullRequestTemplate } from "./pr-template";
import { PullRequestLint, PullRequestLintOptions } from "./pull-request-lint";
import { Stale, StaleOptions } from "./stale";
import { GithubWorkflow } from "./workflows";

export interface GitHubOptions {
  /**
   * Whether mergify should be enabled on this repository or not.
   *
   * @default true
   */
  readonly mergify?: boolean;

  /**
   * Options for Mergify.
   *
   * @default - default options
   */
  readonly mergifyOptions?: MergifyOptions;

  /**
   * Enables GitHub workflows. If this is set to `false`, workflows will not be created.
   *
   * @default true
   */
  readonly workflows?: boolean;

  /**
   * Add a workflow that performs basic checks for pull requests, like
   * validating that PRs follow Conventional Commits.
   *
   * @default true
   */
  readonly pullRequestLint?: boolean;

  /**
   * Options for configuring a pull request linter.
   *
   * @default - see defaults in `PullRequestLintOptions`
   */
  readonly pullRequestLintOptions?: PullRequestLintOptions;

  /**
   * The name of a secret which includes a GitHub Personal Access Token to be
   * used by projen workflows. This token needs to have the `repo`, `workflows`
   * and `packages` scope.
   *
   * @default "PROJEN_GITHUB_TOKEN"
   */
  readonly projenTokenSecret?: string;

  /**
   * Enable and configure the 'auto approve' workflow.
   * @default - auto approve is disabled
   */
  readonly autoApproveOptions?: AutoApproveOptions;

  /**
   * Configure options for automatic merging on GitHub. Has no effect if
   * `github.mergify` is set to false.
   *
   * @default - see defaults in `AutoMergeOptions`
   */
  readonly autoMergeOptions?: AutoMergeOptions;

  /**
   * Auto-close stale issues and pull requests. To disable set `stale` to `false`.
   *
   * @default - see defaults in `StaleOptions`
   */
  readonly staleOptions?: StaleOptions;

  /**
   * Auto-close of stale issues and pull request. See `staleOptions` for options.
   *
   * @default true
   */
  readonly stale?: boolean;
}

export class GitHub extends Component {
  /**
   * Returns the `GitHub` component of a project or `undefined` if the project
   * does not have a GitHub component.
   */
  public static of(project: Project): GitHub | undefined {
    const isGitHub = (c: Component): c is GitHub => c instanceof GitHub;
    return project.components.find(isGitHub);
  }

  /**
   * The `Mergify` configured on this repository. This is `undefined` if Mergify
   * was not enabled when creating the repository.
   */
  public readonly mergify?: Mergify;

  /**
   * Auto approve set up for this project.
   */
  public readonly autoApprove?: AutoApprove;

  /**
   * Are workflows enabled?
   */
  public readonly workflowsEnabled: boolean;

  /**
   * The name of a secret with a GitHub Personal Access Token to be used by
   * projen workflows.
   */
  public readonly projenTokenSecret: string;

  public constructor(project: Project, options: GitHubOptions = {}) {
    super(project);

    this.workflowsEnabled = options.workflows ?? true;
    this.projenTokenSecret = options.projenTokenSecret ?? "PROJEN_GITHUB_TOKEN";

    if (options.mergify ?? true) {
      this.mergify = new Mergify(this, options.mergifyOptions);
    }

    if (options.pullRequestLint ?? true) {
      new PullRequestLint(this, options.pullRequestLintOptions);
    }

    if (options.autoApproveOptions) {
      this.autoApprove = new AutoApprove(this, options.autoApproveOptions);
    }

    if (options.stale ?? true) {
      new Stale(this, options.staleOptions);
    }
  }

  /**
   * All workflows.
   */
  public get workflows(): GithubWorkflow[] {
    const isWorkflow = (c: Component): c is GithubWorkflow =>
      c instanceof GithubWorkflow;
    return this.project.components
      .filter(isWorkflow)
      .sort((w1, w2) => w1.name.localeCompare(w2.name));
  }

  /**
   * Adds a workflow to the project.
   * @param name Name of the workflow
   * @returns a GithubWorkflow instance
   */
  public addWorkflow(name: string) {
    const workflow = new GithubWorkflow(this, name);
    return workflow;
  }

  public addPullRequestTemplate(...content: string[]) {
    return new PullRequestTemplate(this, { lines: content });
  }

  public addDependabot(options?: DependabotOptions) {
    return new Dependabot(this, options);
  }

  /**
   * Finds a GitHub workflow by name. Returns `undefined` if the workflow cannot be found.
   * @param name The name of the GitHub workflow
   */
  public tryFindWorkflow(name: string): undefined | GithubWorkflow {
    return this.workflows.find((w) => w.name === name);
  }
}
