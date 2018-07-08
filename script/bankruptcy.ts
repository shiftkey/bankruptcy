import * as octokit from '@octokit/rest'
import * as moment from 'moment'

import * as URL from 'url'

const MAXIMUM_PAGES_FOR_NOW = 100

type RateLimit = {
  readonly rate: {
    readonly limit: number
    readonly remaining: number
    readonly reset: number
  }
}

type Notification = {
  readonly id: string
  readonly unread: boolean
  readonly reason: string
  readonly updated_at: string
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

async function wrapThrottling(
  client: octokit,
  action: (client: octokit) => Promise<octokit.AnyResponse>
): Promise<octokit.AnyResponse> {
  try {
    const result = await action(client)

    const response = await client.misc.getRateLimit({})

    const rateLimit: RateLimit = response.data

    const { remaining } = rateLimit.rate

    if (remaining % 100 === 0) {
      console.log(
        `- You have ${remaining} API requests available before you will be rate-limited`
      )
    }

    return result
  } catch (err) {
    const response = await client.misc.getRateLimit({})
    const rateLimit: RateLimit = response.data

    const { remaining, reset } = rateLimit.rate

    if (remaining === 0) {
      const date = new Date(reset * 1000)
      console.log(
        `You are currently rate limited and will be able to use it again ${moment(
          date
        ).fromNow()}`
      )
      process.exit(1)
    }
    throw err
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
  const then = moment(notification.updated_at)
  console.log(` - time: ${then.fromNow()}`)

  console.log()
}

async function unsubscribeFrom(notification: Notification) {
  const id = notification.id
  await wrapThrottling(client, c =>
    c.activity.markNotificationThreadAsRead({
      id: id,
      thread_id: id,
    })
  )

  await wrapThrottling(client, c =>
    c.activity.deleteNotificationThreadSubscription({
      id: id,
      thread_id: id,
    })
  )

  const then = moment(notification.updated_at)
  console.log(
    ` - unsubscribed from notification ${notification.id} from repo ${
      notification.repository.full_name
    } - updated ${then.fromNow()}`
  )
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

client.misc.getRateLimit({}).then(response => {
  const rateLimit: RateLimit = response.data

  const { remaining, reset } = rateLimit.rate

  if (remaining > 0) {
    const date = new Date(reset * 1000)

    console.log(
      `NOTE: You have ${remaining} API requests and this will reset ${moment(
        date
      ).fromNow()}`
    )
  }
})

async function getAllNotifications() {
  let count = 0
  let response = await wrapThrottling(client, c =>
    c.activity.getNotifications({ per_page: 100 })
  )
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
        const pageInt = parseInt(page.value, 10)

        if (pageInt != NaN && pageInt > MAXIMUM_PAGES_FOR_NOW) {
          console.warn(
            `Note: You have ${pageInt} pages of notifications but this script will be limited to the first ${MAXIMUM_PAGES_FOR_NOW} pages. This might take a while to crunch the data.`
          )
        } else {
          console.warn(
            `Note: You have ${
              page.value
            } pages of notifications. This might take a while to crunch the data.`
          )
        }
        console.log()
      }
    }
  }

  let { data } = response
  while (client.hasNextPage(link)) {
    response = await wrapThrottling(client, c => c.getNextPage(link))
    count++
    data = data.concat(response.data)

    if (count > MAXIMUM_PAGES_FOR_NOW) {
      return data
    }
  }
  return data
}

getAllNotifications().then(async (notifications: Array<Notification>) => {
  for (const notification of notifications) {
    const matchesRule = matches(notification)

    if (matchesRule) {
      if (unsubscribe) {
        await unsubscribeFrom(notification)
      } else {
        logNotification(notification)
      }
    }
  }
})
