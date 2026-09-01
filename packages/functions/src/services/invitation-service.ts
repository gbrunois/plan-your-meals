const Mustache = require('mustache')
import * as fs from 'fs'
import * as path from 'path'
import { emailServices } from './email-service'
import { UserRecord } from 'firebase-admin/auth'
import { config } from './config-service'
import { firestoreServices } from './firestore-service'
import { DocumentReference } from '@google-cloud/firestore'
import { IPlanning } from '../types/types'
import { removeDotsInEmail } from './string-utils'
import { authServices } from './auth-service'

const invitationTemplateString = fs.readFileSync(path.join(__dirname, '../api/resources/invitation.html'), 'utf-8')

export const invitationServices = {
  /**
   * Send invatation email
   * @param sender User who send invitation
   * @param receiver Email to send invitation
   * @param inviteToRegister [Optional] Add invation link in the email
   */
  async sendInvitation(sender: UserRecord, receiver: string, inviteToRegister: boolean = false) {
    const view = {
      sender,
      displayApplicationUrl: config.app.url,
      baseUrl: `${config.app.url}/`,
      inviteToRegister,
    }
    const html = Mustache.render(invitationTemplateString, view)
    const subject = `${sender.displayName} a partagé ses menus`
    const to = {
      name: `${sender.displayName} (via ${config.app.name})`,
      address: sender.email,
    }
    return emailServices.sendEmail(to, receiver, subject, html)
  },
  /**
   * Store a pending invitation in firestore
   * @param userId User id who send invitation
   * @param guestEmail Invited user email
   * @param planningRef Planning to share with the invited user
   */
  async savePendingInvitation(userId: string, guestEmail: string, planningRef: DocumentReference<IPlanning>) {
    console.log('savePendingInvitation', { userId, guestEmail, planningRef: planningRef.path })
    return firestoreServices.buildNewPendingInvitationReference().create({
      user_id: userId,
      guest_email: removeDotsInEmail(guestEmail),
      planning: planningRef,
      created_date: new Date(),
    })
  },
  async findPendingInvitations(guestEmail: string) {
    console.log('findPendingInvitations', { guestEmail })
    return firestoreServices.findPendingInvitations(guestEmail)
  },
  /**
   * Find pending invitation from the user email and convert it to shared planning
   * @param user New created user
   */
  async acceptPendingInvationIfExists(user) {
    const pendingInvitations = await invitationServices.findPendingInvitations(user.email)
    if (!pendingInvitations.empty) {
      await Promise.all(
        pendingInvitations.docs.map(async (pendingInvitation) => {
          const planningRef = pendingInvitation.data().planning
          const invitationSenderId = pendingInvitation.data().user_id
          const invitationSender = await authServices.getUser(invitationSenderId)
          // if invitation sender doesn't exists...

          // TODO check not already exists ?
          // TODO Add transaction
          await firestoreServices.createUserSharing(user, planningRef, false, invitationSender.displayName)
          await firestoreServices.createPlanningSharing(user, planningRef)
          const planningPendingSharings = await firestoreServices.findPendingPlanningSharing(planningRef, user.email)
          if (!planningPendingSharings.empty) {
            await firestoreServices.deletePendingInvitation(pendingInvitation.ref)
            await firestoreServices.deletePendingPlanningSharings(planningPendingSharings.docs.map((x) => x.ref))
          }
        }),
      )
      if (pendingInvitations.size === 1) {
        await firestoreServices.setPrimaryPlanning(user.uid, pendingInvitations.docs[0].data().planning)
      }
    }
  },
}
