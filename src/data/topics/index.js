import { os } from './os'
import { networking } from './networking'
import { database } from './database'
import { algorithms } from './algorithms'

const topicContent = {
  ...os,
  ...networking,
  ...database,
  ...algorithms,
}

export default topicContent
