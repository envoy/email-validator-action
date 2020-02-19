const core = require('@actions/core')
const exec = require('@actions/exec')
const github = require('@actions/github')
const os = require('os')

async function main () {
  try {
    const allowedDomains = core.getInput('allowed-domains')
    const allDomains = allowedDomains.split(',').map(d => d.trim())
    const domains = [...new Set(allDomains)]
    core.debug(`Allowed domains: ${domains.join(', ')}`)

    const { base: { sha: baseSha }, head: { sha: headSha } } = github.context.payload.pull_request
    let buffer = ''
    const options = {}
    options.listeners = { stdout: data => { buffer += data } }
    await exec.exec(
      'git',
      [
        'log',
        '--format={"author": "%ae", "committer": "%ce", "sha": "%h"}',
        '--no-merges',
        `${baseSha}..${headSha}`,
      ],
      options
    )
    const commits = buffer
      .split(os.EOL)
      .filter(Boolean) // remove newline
      .map(JSON.parse)
    core.debug(`commits: ${JSON.stringify(commits)}`)

    const allEmails = commits.flatMap(({ author, committer }) => [
      author,
      committer
    ])
    const emails = [...new Set(allEmails)] // unique
    const joinedEmails = emails.join(', ')
    core.debug(`Emails found: ${joinedEmails}`)

    const emailDomain = email => email.split('@', 2)[1]
    const isDomainAllowed = domain => domains.includes(domain)
    const isEmailAllowed = email => isDomainAllowed(emailDomain(email))

    const invalidCommits = commits.filter(({ author, committer }) => ![author, committer].every(isEmailAllowed))
    core.debug(`invalidCommit: ${invalidCommits}`)
    if (invalidCommits.length) {
      core.setFailed(`Rejected these SHAs: ${invalidCommits.map(c => c.sha).join(', ')}`)
    } else {
      core.setOutput('emails', joinedEmails)
    }
  } catch (e) {
    core.setFailed(e.message)
  }
}

main()
