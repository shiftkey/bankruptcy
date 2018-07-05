import * as octokit from '@octokit/rest'
import * as URL from 'url'

const MAXIMUM_PAGES_FOR_NOW = 40

type Notification = {
  readonly id: string
  readonly unread: boolean
  readonly reason: string
  readonly subject: {
    readonly title: string
  }
  readonly repository: {
    readonly name: string
    readonly full_name: string
    readonly owner: {
      readonly login: string
    }
  }
}

const excludeOrgsOrRepositoryAliases: Array<string> = []

if (process.argv.length < 3) {
  console.error(
    `You need to specify an organization to kill all subscriptions from`
  )
  process.exit(1)
}

const args = process.argv.splice(2)

const organizationsOrRepositoryAliases = args.filter(
  v => v.indexOf('--') === -1
)
const debug = args.indexOf('--debug') >= 0
const unsubscribe = args.indexOf('--unsubscribe') >= 0

if (unsubscribe) {
  console.log(
    'Note: Unsubscribing from all notification threads that match the provided organizations'
  )
  console.log()
}

function logNotification(notification: Notification) {
  console.log(
    ` - notification ${notification.id} from repo ${
      notification.repository.full_name
    } with reason: ${notification.reason}`
  )
  console.log(` - subject: '${notification.subject.title}'`)
  console.log()
}

function matchEntry(
  notification: Notification,
  alias: string
): boolean | undefined {
  if (alias.indexOf('/') > -1) {
    if (alias === notification.repository.full_name) {
      return true
    }
  } else {
    if (alias === notification.repository.owner.login) {
      return true
    }
  }

  return false
}

function matches(notification: Notification) {
  if (debug) {
    return true
  }

  // exclude rules are always applied before matches
  for (const alias of excludeOrgsOrRepositoryAliases) {
    const match = matchEntry(notification, alias)
    if (match === true) {
      return false
    }
  }

  for (const alias of organizationsOrRepositoryAliases) {
    const match = matchEntry(notification, alias)
    if (match) {
      return true
    }
  }

  return false
}

const token = process.env.GITHUB_ACCESS_TOKEN

if (token == null) {
  throw new Error(
    'You need to provide a GITHUB_ACCESS_TOKEN environment variable'
  )
}

const client = new octokit()
client.authenticate({ type: 'token', token })

async function getAllNotifications() {
  let count = 0
  let response = await client.activity.getNotifications({ per_page: 100 })
  count++
  let link = { link: response.headers.link }

  const lastPage = client.hasLastPage(link)
  if (lastPage) {
    const url = URL.parse(lastPage)
    if (url.query) {
      const entries = url.query.split('&')
      const values = entries.map(entry => {
        const values = entry.split('=')
        return { key: values[0], value: values[1] }
      })
      const page = values.find(v => v.key === 'page')
      if (page) {
        console.log(`You have ${page.value} pages of notifications`)
      }
    }
  }

  let { data } = response
  while (client.hasNextPage(link)) {
    response = await client.getNextPage(link)
    count++
    data = data.concat(response.data)

    if (count > MAXIMUM_PAGES_FOR_NOW) {
      return data
    }
  }
  return data
}

getAllNotifications().then(async (data: Array<Notification>) => {
  for (const d of data) {
    const matchesRule = matches(d)

    if (matchesRule) {
      logNotification(d)
    }

    if (matchesRule && unsubscribe) {
      await client.activity.markNotificationThreadAsRead({
        id: d.id,
        thread_id: d.id,
      })
      await client.activity.deleteNotificationThreadSubscription({
        id: d.id,
        thread_id: d.id,
      })
    }
  }
})
