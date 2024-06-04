def isPRBuild() {
  return (BRANCH_NAME ==~ /^PR-\d+$/)
}

def getPRNumber() {
  def matcher = (BRANCH_NAME =~ /^PR-(?<PR>\d+)$/)
  assert matcher.matches()
  return matcher.group('PR')
}

def getPRRef() {
    return isPRBuild() ? "refs/pull/${getPRNumber()}/${GITHUB_PR_REF_TYPE}" : "refs/heads/${BRANCH_NAME}"
}

pipeline {

  agent { label 'node-lts' }

  environment {
    // The Jenkins Credentials ID (as a secret text credential) for your GitHub PAT.
    GITHUB_CREDS = credentials('github-jenkins-pat-secret-text')
    // The repo default branch name
    DEFAULT_BRANCH = 'main'
    // The type of ref that will be checked out for a job initiated by a GitHub PR. 'merge' for the default PR merge commit, 'head' for the head of the branch being merged.
    GITHUB_PR_REF_TYPE = 'head'
    PR_REF = getPRRef()
    // The name of the GitHub repository to run the analysis on
    GITHUB_REPO = 'ctcampbellcom/example-ghas-express-app'
    // See https://docs.github.com/en/code-security/code-scanning/creating-an-advanced-setup-for-code-scanning/customizing-your-advanced-setup-for-code-scanning#changing-the-languages-that-are-analyzed
    // for supported languages.
    // For Java and Kotlin use 'java', for JavaScript and TypeScript use 'javascript', for C and C++ use 'cpp'.
    CODEQL_LANGUAGE = 'javascript'
    // See https://docs.github.com/en/code-security/codeql-cli/codeql-cli-manual/database-create#--build-modemode for build mode options
    CODEQL_QUERY_SUITE = "codeql/${CODEQL_LANGUAGE}-queries:codeql-suites/${CODEQL_LANGUAGE}-security-extended.qls"
    CODEQL_DIR = '/tools/codeql'
    CODEQL_MEMORY = '3276'
  }

  stages {
    stage('Run CodeQL analysis') {
      when {
        anyOf {
          branch DEFAULT_BRANCH
          expression { CHANGE_ID != null && CHANGE_AUTHOR != 'dependabot[bot]'}
        }
      }
      steps {
        container('node-lts') {
          script {
            sh '${CODEQL_DIR}/codeql database create ./codeql-db \
                --ram ${CODEQL_MEMORY} \
                --language ${CODEQL_LANGUAGE} \
                --overwrite \
                ${CODEQL_BUILD_MODE:+--build-mode} ${CODEQL_BUILD_MODE} \
                ${CODEQL_BUILD_COMMAND:+--command} "${CODEQL_BUILD_COMMAND}"'
            sh '${CODEQL_DIR}/codeql database analyze ./codeql-db \
                --ram ${CODEQL_MEMORY} \
                --format=sarif-latest \
                --output=codeql-results.sarif \
                ${CODEQL_QUERY_SUITE}'
            sh 'echo $GITHUB_CREDS | ${CODEQL_DIR}/codeql github upload-results \
                --github-auth-stdin \
                --sarif=codeql-results.sarif \
                --repository=${GITHUB_REPO} \
                --ref=${PR_REF} \
                --commit=${GIT_COMMIT}'
          }
        }
      }
    }
  }
}
