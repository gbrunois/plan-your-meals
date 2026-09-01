import { v1 } from '@google-cloud/firestore'

const client = new v1.FirestoreAdminClient()
const backupBucket = 'gs://plan-your-meals-backup'

/**
 * Exports the default Firestore database to `backupBucket`.
 *
 * Migrated from a hand-deployed 1st-gen `firestoreExport` function
 * (`gcloud functions deploy`, triggered by a raw `google.pubsub.topic.publish`
 * event, never managed through this codebase/firebase.json). Wired up as a
 * scheduled Cloud Function in index.ts, same as the other triggers there.
 */
export async function exportFirestore() {
  const databaseName = client.databasePath(process.env.GCLOUD_PROJECT || '', '(default)')

  try {
    const [response] = await client.exportDocuments({
      name: databaseName,
      outputUriPrefix: backupBucket,
      collectionIds: [],
    })
    console.info(`Operation Name: ${response.name}`)
  } catch (error: any) {
    console.error('Error exporting Firestore:', error.message || error)
  }
}
